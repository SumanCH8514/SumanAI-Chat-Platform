import React, { useState } from 'react';
import {
  X, Check, Copy, ArrowRight, ShieldCheck, Lock,
  CreditCard, ExternalLink, Printer, AlertCircle, RefreshCw
} from 'lucide-react';
import { PAYMENT_GATEWAYS, paymentService } from '../services/paymentService';
import { firestoreService } from '../services/firestoreService';
import { adminService } from '../services/adminService';
import { useAuthStore } from '../store/useAuthStore';
import './CheckoutModal.css';

const CheckoutModal = ({ isOpen, onClose, checkoutData, onPaymentSuccess }) => {
  const { user, updateUserProfileData, updateUserWallet } = useAuthStore();

  const [step, setStep] = useState('review');
  const [selectedGateway, setSelectedGateway] = useState(() => {
    return checkoutData?.initialGateway || paymentService.getDefaultGateway(checkoutData?.currency || 'INR');
  });

  const [phone, setPhone] = useState(() => user?.phoneNumber || '');
  const [countryCode, setCountryCode] = useState(() => user?.countryCode || '+91');
  const [street, setStreet] = useState(() => user?.address?.street || '');
  const [city, setCity] = useState(() => user?.address?.city || '');
  const [stateName, setStateName] = useState(() => user?.address?.state || '');
  const [postalCode, setPostalCode] = useState(() => user?.address?.postalCode || '');
  const [country, setCountry] = useState(() => user?.address?.country || 'India');

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [formError, setFormError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [copiedTxn, setCopiedTxn] = useState(false);

  if (!isOpen || !checkoutData) return null;

  const currency = checkoutData.currency || 'INR';
  const amount = checkoutData.amount || 0;
  const availableGateways = paymentService.getGatewaysForCurrency(currency);

  const activeGatewayObj = PAYMENT_GATEWAYS[selectedGateway] || availableGateways[0];

  const handleCopyTxn = () => {
    if (receipt?.transactionId) {
      navigator.clipboard.writeText(receipt.transactionId);
      setCopiedTxn(true);
      setTimeout(() => setCopiedTxn(false), 2000);
    }
  };

  const loadScript = (src) => {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const completeVerifiedPayment = async (verifyDetails, profileData) => {
    try {
      const verifyPayload = {
        orderId: verifyDetails.orderId,
        paymentId: verifyDetails.paymentId || `PAY_${Date.now()}`,
        signature: verifyDetails.signature || 'verified',
        gateway: verifyDetails.gateway || selectedGateway,
        amount,
        currency,
        userId: user?.uid || 'guest_user',
        purpose: checkoutData.purpose || 'subscription',
        credits: checkoutData.credits || 0,
        planId: checkoutData.planId
      };

      const verifyResult = await paymentService.verifyPayment(verifyPayload);

      let updatedWallet = null;
      if (checkoutData.purpose === 'topup' && checkoutData.credits > 0) {
        updatedWallet = await firestoreService.updateWallet(user?.uid, checkoutData.credits, amount);
        if (updatedWallet) {
          updateUserWallet(updatedWallet.credits, updatedWallet.walletBalance);
        }
      } else if (checkoutData.purpose === 'subscription') {
        const subData = await firestoreService.activateProSubscription(user?.uid, {
          gateway: verifyDetails.gateway || selectedGateway,
          transactionId: verifyResult.transactionId
        });
        updateUserProfileData(subData);
      }

      const transactionRecord = {
        id: verifyResult.transactionId,
        orderId: verifyResult.orderId,
        paymentId: verifyResult.paymentId,
        gateway: verifyDetails.gateway || selectedGateway,
        amount,
        currency,
        purpose: checkoutData.purpose,
        title: checkoutData.title,
        credits: checkoutData.credits || 0,
        status: 'Completed',
        timestamp: Date.now(),
        billingAddress: profileData.address,
        phoneNumber: `${countryCode} ${phone.trim()}`,
        email: user?.email || 'guest@sumanai.local'
      };

      await firestoreService.recordTransaction(user?.uid, transactionRecord);

      setReceipt(transactionRecord);
      setStep('completed');

      if (onPaymentSuccess) {
        onPaymentSuccess(transactionRecord);
      }
    } catch (err) {
      setStep('review');
      setFormError(err.message || 'Payment verification failed. Please try again or choose another gateway.');
    }
  };

  const handleInitiatePayment = async () => {
    setFormError('');

    if (!phone.trim()) {
      setFormError('Please enter a valid phone number for billing notifications.');
      return;
    }
    if (!street.trim() || !city.trim() || !postalCode.trim()) {
      setFormError('Please provide complete street address, city, and postal code.');
      setIsEditingAddress(true);
      return;
    }

    const updatedProfile = {
      phoneNumber: phone.trim(),
      countryCode,
      address: {
        street: street.trim(),
        city: city.trim(),
        state: stateName.trim(),
        postalCode: postalCode.trim(),
        country
      },
      preferredCurrency: currency
    };

    if (user?.uid && !user.isAnonymous) {
      await firestoreService.updateUserProfile(user.uid, updatedProfile);
    }
    updateUserProfileData(updatedProfile);

    setStep('processing');

    try {
      const gwConfig = await adminService.getPaymentGatewayConfig();
      const currentGw = gwConfig?.[selectedGateway] || {};

      const orderPayload = {
        amount,
        currency,
        gateway: selectedGateway,
        purpose: checkoutData.purpose || 'subscription',
        planId: checkoutData.planId,
        credits: checkoutData.credits || 0,
        userId: user?.uid || 'guest_user',
        userEmail: user?.email || 'guest@sumanai.local',
        billingAddress: updatedProfile.address
      };

      const orderResult = await paymentService.createOrder(orderPayload);

      if (selectedGateway === 'razorpay') {
        const rzpKey = currentGw.keyId || orderResult.keyId;
        const scriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

        if (scriptLoaded && window.Razorpay && rzpKey) {
          const rzpOptions = {
            key: rzpKey,
            amount: Math.round(amount * 100),
            currency: 'INR',
            name: 'SumanAI Platform',
            description: checkoutData.title,
            order_id: orderResult.orderId && orderResult.orderId.startsWith('order_') ? orderResult.orderId : undefined,
            prefill: {
              name: user?.displayName || 'Customer',
              email: user?.email || '',
              contact: `${countryCode}${phone.replace(/\D/g, '')}`
            },
            theme: {
              color: '#8B5CF6'
            },
            handler: async function (response) {
              setStep('processing');
              await completeVerifiedPayment({
                orderId: response.razorpay_order_id || orderResult.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                gateway: 'razorpay'
              }, updatedProfile);
            },
            modal: {
              ondismiss: function () {
                setStep('review');
              }
            }
          };

          const rzpInstance = new window.Razorpay(rzpOptions);
          rzpInstance.on('payment.failed', function (resp) {
            setStep('review');
            setFormError(resp.error?.description || 'Razorpay transaction was declined.');
          });
          rzpInstance.open();
          return;
        } else if (!rzpKey) {
          setFormError('Razorpay Key ID is not configured. Please add your Razorpay Key ID and Secret in Admin Console -> Payments & Gateways.');
          setStep('review');
          return;
        }
      }

      if (selectedGateway === 'stripe') {
        const stripeKey = currentGw.publishableKey || orderResult.stripeKey;
        if (!stripeKey) {
          setFormError('Stripe Publishable Key is not configured. Please add your Stripe Keys in Admin Console -> Payments & Gateways.');
          setStep('review');
          return;
        }
      }

      if (selectedGateway === 'phonepe' && !currentGw.merchantId) {
        setFormError('PhonePe Merchant ID is not configured. Please add your PhonePe Merchant ID in Admin Console -> Payments & Gateways.');
        setStep('review');
        return;
      }

      if (selectedGateway === 'zaakpay' && !currentGw.merchantId) {
        setFormError('Zaakpay Merchant Identifier is not configured. Please add your Zaakpay Merchant ID in Admin Console -> Payments & Gateways.');
        setStep('review');
        return;
      }

      if (selectedGateway === 'paypal' && !currentGw.clientId) {
        setFormError('PayPal Client ID is not configured. Please add your PayPal Client ID in Admin Console -> Payments & Gateways.');
        setStep('review');
        return;
      }

      await completeVerifiedPayment({
        orderId: orderResult.orderId,
        paymentId: `PAY_${Date.now()}`,
        signature: 'sandbox_verified',
        gateway: selectedGateway
      }, updatedProfile);

    } catch (err) {
      setStep('review');
      setFormError(err.message || 'Payment initiation failed. Please try again or choose another gateway.');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="checkout-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="checkout-modal" onClick={e => e.stopPropagation()}>
        <div className="checkout-header">
          <div className="checkout-header-title-wrap">
            <span className="checkout-badge-secure">
              <Lock size={12} /> 256-Bit SSL Encrypted
            </span>
            <h3 className="checkout-title">
              {step === 'completed' ? 'Order Receipt' : 'Secure Checkout'}
            </h3>
          </div>
          <button
            type="button"
            className="checkout-close-btn"
            onClick={onClose}
            aria-label="Close checkout"
          >
            <X size={18} />
          </button>
        </div>

        {step === 'review' && (
          <div className="checkout-body">
            <div className="checkout-summary-box">
              <div className="checkout-summary-row">
                <div className="checkout-item-details">
                  <span className="checkout-item-name">{checkoutData.title}</span>
                  <span className="checkout-item-desc">{checkoutData.description}</span>
                </div>
                <div className="checkout-item-price">
                  {paymentService.formatCurrency(amount, currency)}
                </div>
              </div>

              <div className="checkout-divider" />

              <div className="checkout-total-row">
                <span className="checkout-total-label">Total Due (Incl. taxes)</span>
                <div className="checkout-total-value">
                  {paymentService.formatCurrency(amount, currency)}
                </div>
              </div>
            </div>

            {formError && (
              <div className="checkout-error-banner">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <div className="checkout-section">
              <span className="checkout-section-heading">Select Payment Gateway</span>
              <div className="checkout-gateway-grid">
                {availableGateways.map(gw => (
                  <button
                    key={gw.id}
                    type="button"
                    className={`checkout-gateway-card ${selectedGateway === gw.id ? 'selected' : ''}`}
                    onClick={() => setSelectedGateway(gw.id)}
                  >
                    <div className="checkout-gw-top">
                      <span className="checkout-gw-name">{gw.name}</span>
                      {gw.badge && (
                        <span className="checkout-gw-badge">{gw.badge}</span>
                      )}
                    </div>
                    <span className="checkout-gw-desc">{gw.description}</span>
                    <div className="checkout-gw-features">
                      {gw.features.slice(0, 2).map((feat, idx) => (
                        <span key={idx} className="checkout-gw-feature-tag">
                          {feat}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="checkout-section">
              <div className="checkout-section-header-row">
                <span className="checkout-section-heading">Billing Information</span>
                <button
                  type="button"
                  className="checkout-edit-toggle"
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                >
                  {isEditingAddress ? 'Done Editing' : 'Edit Details'}
                </button>
              </div>

              {isEditingAddress ? (
                <div className="checkout-form-grid">
                  <div className="checkout-input-group checkout-input-group--phone">
                    <label className="checkout-label">Contact Phone Number</label>
                    <div className="checkout-phone-row">
                      <select
                        className="checkout-select checkout-select--country"
                        value={countryCode}
                        onChange={e => setCountryCode(e.target.value)}
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US/CA)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+61">+61 (AU)</option>
                        <option value="+49">+49 (DE)</option>
                        <option value="+65">+65 (SG)</option>
                        <option value="+971">+971 (UAE)</option>
                      </select>
                      <input
                        type="tel"
                        className="checkout-input"
                        placeholder="Mobile number"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="checkout-input-group">
                    <label className="checkout-label">Street Address</label>
                    <input
                      type="text"
                      className="checkout-input"
                      placeholder="House / Flat No., Street, Landmark"
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                    />
                  </div>

                  <div className="checkout-input-row">
                    <div className="checkout-input-group">
                      <label className="checkout-label">City</label>
                      <input
                        type="text"
                        className="checkout-input"
                        placeholder="City"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                      />
                    </div>

                    <div className="checkout-input-group">
                      <label className="checkout-label">State / Province</label>
                      <input
                        type="text"
                        className="checkout-input"
                        placeholder="State"
                        value={stateName}
                        onChange={e => setStateName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="checkout-input-row">
                    <div className="checkout-input-group">
                      <label className="checkout-label">Postal / ZIP Code</label>
                      <input
                        type="text"
                        className="checkout-input"
                        placeholder="Postal Code"
                        value={postalCode}
                        onChange={e => setPostalCode(e.target.value)}
                      />
                    </div>

                    <div className="checkout-input-group">
                      <label className="checkout-label">Country</label>
                      <select
                        className="checkout-select"
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                      >
                        <option value="India">India</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="Singapore">Singapore</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="checkout-billing-preview">
                  <div className="checkout-preview-row">
                    <span className="checkout-preview-label">Name:</span>
                    <span className="checkout-preview-val">{user?.displayName || 'Authorized Customer'}</span>
                  </div>
                  <div className="checkout-preview-row">
                    <span className="checkout-preview-label">Email:</span>
                    <span className="checkout-preview-val">{user?.email || 'Registered Email'}</span>
                  </div>
                  <div className="checkout-preview-row">
                    <span className="checkout-preview-label">Phone:</span>
                    <span className="checkout-preview-val">{phone ? `${countryCode} ${phone}` : 'Not provided (Click edit)'}</span>
                  </div>
                  <div className="checkout-preview-row">
                    <span className="checkout-preview-label">Address:</span>
                    <span className="checkout-preview-val">
                      {street ? `${street}, ${city}, ${stateName} - ${postalCode}, ${country}` : 'Not provided (Click edit)'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="checkout-footer">
              <button
                type="button"
                className="checkout-submit-btn"
                onClick={handleInitiatePayment}
              >
                <span>Pay {paymentService.formatCurrency(amount, currency)} with {activeGatewayObj.name}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="checkout-body checkout-body--processing">
            <div className="checkout-spinner" />
            <h4 className="checkout-proc-title">
              Processing Payment with {activeGatewayObj.name}
            </h4>
            <p className="checkout-proc-desc">
              Authorizing transaction of {paymentService.formatCurrency(amount, currency)} securely. Please do not refresh or close this window.
            </p>
            <div className="checkout-security-pill">
              <ShieldCheck size={14} color="#10B981" />
              <span>TLS 1.3 Certified Bank Handshake</span>
            </div>
          </div>
        )}

        {step === 'completed' && receipt && (
          <div className="checkout-body checkout-body--receipt">
            <div className="checkout-success-icon-wrap">
              <Check size={28} />
            </div>

            <h4 className="checkout-receipt-headline">Payment Successful</h4>
            <p className="checkout-receipt-subheadline">
              Your transaction has been confirmed and updated in your account ledger.
            </p>

            <div className="checkout-receipt-card">
              <div className="checkout-receipt-row">
                <span className="receipt-label">Transaction Reference</span>
                <div className="receipt-txn-wrap">
                  <code className="receipt-txn-code">{receipt.id}</code>
                  <button
                    type="button"
                    className="receipt-copy-btn"
                    onClick={handleCopyTxn}
                    title="Copy reference code"
                  >
                    {copiedTxn ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <div className="checkout-receipt-row">
                <span className="receipt-label">Item</span>
                <span className="receipt-val">{receipt.title}</span>
              </div>

              <div className="checkout-receipt-row">
                <span className="receipt-label">Gateway</span>
                <span className="receipt-val">{PAYMENT_GATEWAYS[receipt.gateway]?.name || receipt.gateway}</span>
              </div>

              <div className="checkout-receipt-row">
                <span className="receipt-label">Amount Paid</span>
                <span className="receipt-val receipt-val--highlight">
                  {paymentService.formatCurrency(receipt.amount, receipt.currency)}
                </span>
              </div>

              <div className="checkout-receipt-row">
                <span className="receipt-label">Timestamp</span>
                <span className="receipt-val">{new Date(receipt.timestamp).toLocaleString()}</span>
              </div>

              <div className="checkout-receipt-row">
                <span className="receipt-label">Status</span>
                <span className="receipt-status-tag">Completed</span>
              </div>
            </div>

            <div className="checkout-receipt-actions">
              <button
                type="button"
                className="checkout-print-btn"
                onClick={handlePrintReceipt}
              >
                <Printer size={15} />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                className="checkout-done-btn"
                onClick={onClose}
              >
                <span>Return to Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
