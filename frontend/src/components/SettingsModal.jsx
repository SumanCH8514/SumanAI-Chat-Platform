import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  X, Settings, Database, Sun, Moon, Monitor, Info,
  User, Sliders, Zap, HelpCircle, Check, Copy, ShieldCheck,
  CheckCircle2, ArrowRight, Wallet, CreditCard, RefreshCw,
  Phone, MapPin, Building2, AlertCircle, FileText,
  Gift, Share2, Link2, Users
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { COLOR_THEMES } from '../constants/themes';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { firestoreService } from '../services/firestoreService';
import { referralService } from '../services/referralService';
import { getFirebaseAuth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getUserDisplayName } from '../utils/formatters';
import { adminService } from '../services/adminService';
import {
  PAYMENT_GATEWAYS,
  PRO_PLANS,
  TOPUP_PACKS,
  COUNTRY_CODES,
  COUNTRIES,
  paymentService
} from '../services/paymentService';
import CheckoutModal from './CheckoutModal';
import './SettingsModal.css';
import './SettingsModal.responsive.css';

const SettingsModal = ({ onClose, initialTab = 'general' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme();
  const { user, openAuthModal, updateUserProfileData, updateUserWallet } = useAuthStore();
  const { chats } = useChatStore();

  const isGuest = Boolean(user?.isAnonymous);
  const isAdmin = adminService.checkIsAdmin(user);
  const isPro = adminService.checkHasProAccess(user);
  const userName = isGuest ? 'Guest User' : getUserDisplayName(user);
  const userEmail = user?.email || (isGuest ? 'Guest Session' : 'No email');

  const [copiedUid, setCopiedUid] = useState(false);
  const [personalizationSaved, setPersonalizationSaved] = useState(false);

  const [userAbout, setUserAbout] = useState(() => {
    return localStorage.getItem('sumanai_custom_about') || user?.preferences?.customAbout || '';
  });
  const [responseStyle, setResponseStyle] = useState(() => {
    return localStorage.getItem('sumanai_custom_style') || user?.preferences?.customStyle || '';
  });
  const [customEnabled, setCustomEnabled] = useState(() => {
    return localStorage.getItem('sumanai_custom_enabled') !== 'false';
  });

  const [phone, setPhone] = useState(() => user?.phoneNumber || '');
  const [countryCode, setCountryCode] = useState(() => user?.countryCode || '+91');
  const [street, setStreet] = useState(() => user?.address?.street || '');
  const [city, setCity] = useState(() => user?.address?.city || '');
  const [stateName, setStateName] = useState(() => user?.address?.state || '');
  const [postalCode, setPostalCode] = useState(() => user?.address?.postalCode || '');
  const [country, setCountry] = useState(() => user?.address?.country || 'India');
  const [preferredCurrency, setPreferredCurrency] = useState(() => {
    return user?.preferredCurrency || localStorage.getItem('sumanai_currency') || 'INR';
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [activeCurrency, setActiveCurrency] = useState(() => {
    return user?.preferredCurrency || localStorage.getItem('sumanai_currency') || 'INR';
  });
  const [subGateway, setSubGateway] = useState(() => {
    return paymentService.getDefaultGateway(activeCurrency);
  });
  const [topupGateway, setTopupGateway] = useState(() => {
    return paymentService.getDefaultGateway(activeCurrency);
  });
  const [customTopupAmount, setCustomTopupAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [copiedTxnId, setCopiedTxnId] = useState('');

  const [referralCode, setReferralCode] = useState(() => user?.referralCode || '');
  const [referralStats, setReferralStats] = useState({ count: 0, creditsEarned: 0, history: [] });
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [inputReferralCode, setInputReferralCode] = useState(() => referralService.getPendingReferralCode());
  const [redeemingRef, setRedeemingRef] = useState(false);
  const [refError, setRefError] = useState('');
  const [refSuccess, setRefSuccess] = useState('');
  const [copiedRefCode, setCopiedRefCode] = useState(false);
  const [copiedRefLink, setCopiedRefLink] = useState(false);

  const [checkoutData, setCheckoutData] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const loadTransactions = async () => {
    setLoadingTxns(true);
    const txns = await firestoreService.getTransactions(user?.uid);
    setTransactions(txns);
    setLoadingTxns(false);
  };

  const loadReferralData = useCallback(async () => {
    if (!user?.uid) return;
    setLoadingReferrals(true);
    try {
      const code = await referralService.getOrGenerateReferralCode(user);
      if (code) setReferralCode(code);
      const stats = await referralService.getReferralStats(user.uid);
      setReferralStats(stats);
    } catch {
      void 0;
    } finally {
      setLoadingReferrals(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'wallet') {
      let isMounted = true;
      firestoreService.getTransactions(user?.uid).then(txns => {
        if (isMounted) {
          setTransactions(txns);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [activeTab, user?.uid]);

  useEffect(() => {
    if (activeTab === 'referral' && user?.uid) {
      loadReferralData();
    }
  }, [activeTab, user?.uid, loadReferralData]);

  const handleCurrencyChange = (curr) => {
    setActiveCurrency(curr);
    setPreferredCurrency(curr);
    localStorage.setItem('sumanai_currency', curr);
    setSubGateway(paymentService.getDefaultGateway(curr));
    setTopupGateway(paymentService.getDefaultGateway(curr));
    if (user?.uid && !user.isAnonymous) {
      firestoreService.updateUserProfile(user.uid, { preferredCurrency: curr });
      updateUserProfileData({ preferredCurrency: curr });
    }
  };

  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleSavePersonalization = async (e) => {
    e.preventDefault();
    localStorage.setItem('sumanai_custom_about', userAbout);
    localStorage.setItem('sumanai_custom_style', responseStyle);
    localStorage.setItem('sumanai_custom_enabled', customEnabled ? 'true' : 'false');

    if (user?.uid && !user.isAnonymous) {
      await firestoreService.updatePreferences(user.uid, {
        customAbout: userAbout,
        customStyle: responseStyle,
        customEnabled
      });
    }

    setPersonalizationSaved(true);
    setTimeout(() => setPersonalizationSaved(false), 2500);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');

    if (!phone.trim()) {
      setProfileError('Please provide a valid contact phone number.');
      return;
    }
    if (!street.trim() || !city.trim() || !postalCode.trim()) {
      setProfileError('Please fill out the street address, city, and postal code.');
      return;
    }

    const profileData = {
      phoneNumber: phone.trim(),
      countryCode,
      address: {
        street: street.trim(),
        city: city.trim(),
        state: stateName.trim(),
        postalCode: postalCode.trim(),
        country
      },
      preferredCurrency
    };

    if (user?.uid && !user.isAnonymous) {
      await firestoreService.updateUserProfile(user.uid, profileData);
    }
    updateUserProfileData(profileData);

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleSwitchAccount = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      onClose();
      openAuthModal();
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      await firestoreService.setUserProfile(result.user);
    } catch (err) {
      void err;
    }
  };

  const handleExportData = () => {
    const exportData = {
      user: {
        uid: user?.uid,
        name: userName,
        email: userEmail,
        isGuest
      },
      chatsCount: chats.length,
      chats
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sumanai-chat-history.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleInitiateSubCheckout = () => {
    const plan = PRO_PLANS[activeCurrency] || PRO_PLANS.INR;
    setCheckoutData({
      purpose: 'subscription',
      planId: 'pro_monthly',
      title: 'SumanAI Pro Subscription',
      description: '1-Month Unlimited Flagship AI & Vision Access',
      amount: plan.amount,
      currency: activeCurrency,
      initialGateway: subGateway,
      credits: 0
    });
    setIsCheckoutOpen(true);
  };

  const handleInitiateTopupCheckout = (pack) => {
    setCheckoutData({
      purpose: 'topup',
      planId: pack.id,
      title: `Wallet Credit Top-up (${pack.tag})`,
      description: `Recharge +${pack.credits} Platform Credits`,
      amount: pack.amount,
      currency: activeCurrency,
      initialGateway: topupGateway,
      credits: pack.credits
    });
    setIsCheckoutOpen(true);
  };

  const handleInitiateCustomTopup = () => {
    const amt = parseFloat(customTopupAmount);
    if (!amt || amt <= 0) return;
    const credits = activeCurrency === 'INR' ? Math.round(amt) : Math.round(amt * 80);
    setCheckoutData({
      purpose: 'topup',
      planId: 'custom_topup',
      title: 'Wallet Custom Credit Recharge',
      description: `Recharge +${credits} Platform Credits`,
      amount: amt,
      currency: activeCurrency,
      initialGateway: topupGateway,
      credits
    });
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (receiptRecord) => {
    if (receiptRecord?.credits && checkoutData?.purpose === 'topup') {
      updateUserWallet((user?.credits || 0) + receiptRecord.credits, (user?.walletBalance || 0) + (receiptRecord.amount || 0));
    }
    loadTransactions();
  };

  const handleCopyTxnId = (id) => {
    if (id) {
      navigator.clipboard.writeText(id);
      setCopiedTxnId(id);
      setTimeout(() => setCopiedTxnId(''), 2000);
    }
  };

  const handleCopyRefCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedRefCode(true);
    setTimeout(() => setCopiedRefCode(false), 2000);
  };

  const handleCopyRefLink = () => {
    if (!referralCode) return;
    const url = referralService.buildShareUrl(referralCode);
    navigator.clipboard.writeText(url);
    setCopiedRefLink(true);
    setTimeout(() => setCopiedRefLink(false), 2000);
  };

  const handleSocialShare = async (platform) => {
    if (!referralCode) return;
    const url = referralService.buildShareUrl(referralCode);
    const text = referralService.getShareText(referralCode);

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener,noreferrer');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    } else if (platform === 'native') {
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Join SumanAI', text, url });
        } catch {
          handleCopyRefLink();
        }
      } else {
        handleCopyRefLink();
      }
    }
  };

  const handleRedeemReferral = async (e) => {
    e.preventDefault();
    setRefError('');
    setRefSuccess('');

    if (isGuest || !user?.uid) {
      setRefError('Please sign in with a verified account to claim referral credits.');
      return;
    }

    if (!inputReferralCode.trim()) {
      setRefError('Please enter a referral code.');
      return;
    }

    setRedeemingRef(true);
    try {
      const result = await referralService.redeemReferralCode(user, inputReferralCode.trim());
      setRefSuccess(`Success! +${result.creditsAwarded} credits have been deposited into your wallet.`);
      setInputReferralCode('');
      updateUserProfileData({
        hasRedeemedReferral: true,
        referredBy: result.referralCode
      });
      if (result.wallet) {
        updateUserWallet(result.wallet.credits, result.wallet.walletBalance);
      }
      loadReferralData();
      loadTransactions();
    } catch (err) {
      setRefError(err.message || 'Unable to claim referral code. Please check and try again.');
    } finally {
      setRedeemingRef(false);
    }
  };

  const availableGateways = paymentService.getGatewaysForCurrency(activeCurrency);
  const userCredits = user?.credits || 0;
  const userBalance = user?.walletBalance || 0;

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings size={16} /> },
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'wallet', label: 'Wallet & Credits', icon: <Wallet size={16} /> },
    { id: 'referral', label: 'Refer & Earn', icon: <Gift size={16} />, badge: '+100 Cr' },
    { id: 'upgrade', label: isPro ? 'Pro Benefits' : 'Upgrade plan', icon: <Zap size={16} /> },
    { id: 'personalization', label: 'Personalization', icon: <Sliders size={16} /> },
    { id: 'data', label: 'Data controls', icon: <Database size={16} /> },
    { id: 'help', label: 'Help & FAQ', icon: <HelpCircle size={16} /> },
    { id: 'about', label: 'About Project', icon: <Info size={16} /> },
  ];

  return (
    <>
      <div className="settings-overlay" onClick={onClose} role="dialog" aria-modal="true">
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-sheet-handle" aria-hidden="true" />

          <div className="settings-mobile-header">
            <span className="settings-mobile-title">Settings</span>
            <button className="settings-close-circle" onClick={onClose} aria-label="Close settings" type="button">
              <X size={18} />
            </button>
          </div>

          <div className="settings-left">
            <button className="settings-close" onClick={onClose} aria-label="Close settings" type="button">
              <X size={18} />
            </button>
            <nav className="settings-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={(e) => {
                    setActiveTab(tab.id);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }}
                  type="button"
                >
                  {tab.icon} <span>{tab.label}</span>
                  {tab.badge && <span className="settings-nav-badge">{tab.badge}</span>}
                </button>
              ))}
            </nav>
          </div>

          <div className="settings-right">
            {activeTab === 'general' && (
              <>
                <h2 className="settings-title">General</h2>
                <div className="settings-divider" />

                <div className="settings-row">
                  <span className="settings-row-label">Appearance</span>
                  <div className="appearance-toggle">
                    <button
                      className={`appearance-btn ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => setTheme('light')}
                      title="Light"
                      type="button"
                    >
                      <Sun size={14} /> Light
                    </button>
                    <button
                      className={`appearance-btn ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => setTheme('dark')}
                      title="Dark"
                      type="button"
                    >
                      <Moon size={14} /> Dark
                    </button>
                    <button
                      className={`appearance-btn ${theme === 'system' ? 'active' : ''}`}
                      onClick={() => setTheme('system')}
                      title="System"
                      type="button"
                    >
                      <Monitor size={14} /> System
                    </button>
                  </div>
                </div>

                <div className="settings-divider" />

                <div className="settings-row settings-row-col">
                  <span className="settings-row-label">Colour Theme</span>
                  <div className="color-swatches">
                    {Object.entries(COLOR_THEMES).map(([key, ct]) => (
                      <button
                        key={key}
                        className={`color-swatch ${colorTheme === key ? 'selected' : ''}`}
                        title={ct.label}
                        onClick={() => setColorTheme(key)}
                        style={{ background: ct.swatch || ct.primary }}
                        type="button"
                      >
                        {colorTheme === key && (
                          <span className="swatch-check">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <span className="color-theme-label">
                    {COLOR_THEMES[colorTheme]?.label} — currently applied
                  </span>
                </div>

                <div className="settings-divider" />

                <div className="settings-row">
                  <span className="settings-row-label">Language</span>
                  <select className="settings-select" aria-label="Select interface language">
                    <option>English</option>
                    <option>Bengali</option>
                    <option>Hindi</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'profile' && (
              <>
                <h2 className="settings-title">Profile</h2>
                <div className="settings-divider" />

                <div className="settings-profile-header">
                  <div className="settings-profile-avatar-wrap">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={userName}
                        className="settings-profile-avatar"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="settings-profile-avatar-fallback">
                        {userName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="settings-profile-details">
                    <div className="settings-profile-name">{userName}</div>
                    <div className="settings-profile-email">{userEmail}</div>
                    <div className="settings-profile-badges">
                      {!isGuest && user ? (
                        <span className="settings-badge settings-badge--verified">
                          <CheckCircle2 size={12} /> Google Verified
                        </span>
                      ) : (
                        <span className="settings-badge settings-badge--guest">
                          <ShieldCheck size={12} /> Guest Session
                        </span>
                      )}
                      {isAdmin ? (
                        <span className="settings-badge settings-badge--admin" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                          <ShieldCheck size={12} /> Super Admin (Pro Access)
                        </span>
                      ) : isPro ? (
                        <span className="settings-badge settings-badge--pro" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          <Zap size={12} /> Pro Member
                        </span>
                      ) : (
                        <span className="settings-badge settings-badge--plan">Free Tier</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="settings-divider" />

                <div className="settings-row settings-row-col">
                  <span className="settings-row-label">Account User ID</span>
                  <div className="settings-uid-row">
                    <code className="settings-uid-code">{user?.uid || 'Not signed in'}</code>
                    {user?.uid && (
                      <button
                        type="button"
                        className="settings-copy-btn"
                        onClick={handleCopyUid}
                        title="Copy user ID"
                      >
                        {copiedUid ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                        <span>{copiedUid ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="settings-divider" />

                <div className="settings-section-wrap">
                  <div className="settings-section-header">
                    <span className="settings-section-title">Billing & Contact Information</span>
                    <span className="settings-section-desc">
                      Provide contact details and billing address required for tax invoices and payment verification.
                    </span>
                  </div>

                  {profileError && (
                    <div className="settings-alert-error">
                      <AlertCircle size={15} />
                      <span>{profileError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="settings-profile-form">
                    <div className="settings-field">
                      <label className="settings-field-label">
                        <Phone size={14} /> Contact Phone Number
                      </label>
                      <div className="settings-phone-row">
                        <select
                          className="settings-select settings-select--phone-code"
                          value={countryCode}
                          onChange={e => setCountryCode(e.target.value)}
                        >
                          {COUNTRY_CODES.map(c => (
                            <option key={`${c.country}-${c.code}`} value={c.code}>
                              {c.flag} {c.code} ({c.country})
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          className="settings-input"
                          placeholder="E.g. 9876543210"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="settings-field">
                      <label className="settings-field-label">
                        <MapPin size={14} /> Street Address
                      </label>
                      <input
                        type="text"
                        className="settings-input"
                        placeholder="Flat / House No., Street Name, Landmark"
                        value={street}
                        onChange={e => setStreet(e.target.value)}
                      />
                    </div>

                    <div className="settings-form-row">
                      <div className="settings-field">
                        <label className="settings-field-label">City</label>
                        <input
                          type="text"
                          className="settings-input"
                          placeholder="City"
                          value={city}
                          onChange={e => setCity(e.target.value)}
                        />
                      </div>

                      <div className="settings-field">
                        <label className="settings-field-label">State / Province</label>
                        <input
                          type="text"
                          className="settings-input"
                          placeholder="State / Province"
                          value={stateName}
                          onChange={e => setStateName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="settings-form-row">
                      <div className="settings-field">
                        <label className="settings-field-label">Postal / PIN Code</label>
                        <input
                          type="text"
                          className="settings-input"
                          placeholder="Postal Code"
                          value={postalCode}
                          onChange={e => setPostalCode(e.target.value)}
                        />
                      </div>

                      <div className="settings-field">
                        <label className="settings-field-label">Country</label>
                        <select
                          className="settings-select"
                          value={country}
                          onChange={e => setCountry(e.target.value)}
                        >
                          {COUNTRIES.map(ctry => (
                            <option key={ctry} value={ctry}>{ctry}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="settings-field">
                      <label className="settings-field-label">Preferred Currency</label>
                      <div className="settings-currency-pills">
                        <button
                          type="button"
                          className={`settings-currency-pill ${preferredCurrency === 'INR' ? 'active' : ''}`}
                          onClick={() => {
                            setPreferredCurrency('INR');
                            handleCurrencyChange('INR');
                          }}
                        >
                          <span>INR (₹) Indian Rupee</span>
                        </button>
                        <button
                          type="button"
                          className={`settings-currency-pill ${preferredCurrency === 'USD' ? 'active' : ''}`}
                          onClick={() => {
                            setPreferredCurrency('USD');
                            handleCurrencyChange('USD');
                          }}
                        >
                          <span>USD ($) US Dollar</span>
                        </button>
                      </div>
                    </div>

                    <div className="settings-actions">
                      <button type="submit" className="settings-primary-btn">
                        {profileSaved ? (
                          <>
                            <Check size={15} />
                            <span>Profile Saved Successfully</span>
                          </>
                        ) : (
                          <span>Save Profile Details</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="settings-divider" />

                <div className="settings-row">
                  <div className="settings-row-text">
                    <span className="settings-row-label">Google Account Switcher</span>
                    <p className="settings-row-desc">
                      Connect or switch to another Google account directly without clearing your device data.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="outline-btn"
                    onClick={handleSwitchAccount}
                  >
                    Switch Account
                  </button>
                </div>
              </>
            )}

            {activeTab === 'wallet' && (
              <>
                <div className="settings-wallet-top-bar">
                  <div>
                    <h2 className="settings-title">Wallet & Credits</h2>
                    <p className="settings-tab-desc">
                      Manage platform credits, top up your wallet balance, and track verified transaction history.
                    </p>
                  </div>
                  <div className="settings-currency-toggle-wrap">
                    <span className="settings-curr-toggle-label">Currency:</span>
                    <div className="settings-currency-switcher">
                      <button
                        type="button"
                        className={`curr-btn ${activeCurrency === 'INR' ? 'active' : ''}`}
                        onClick={() => handleCurrencyChange('INR')}
                      >
                        INR (₹)
                      </button>
                      <button
                        type="button"
                        className={`curr-btn ${activeCurrency === 'USD' ? 'active' : ''}`}
                        onClick={() => handleCurrencyChange('USD')}
                      >
                        USD ($)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-divider" />

                <div className="settings-wallet-card">
                  <div className="settings-wallet-balance-col">
                    <span className="wallet-metric-label">Available Balance</span>
                    <div className="wallet-metric-val">
                      {paymentService.formatCurrency(userBalance, activeCurrency)}
                    </div>
                    <span className="wallet-metric-note">
                      1 Credit ≈ {activeCurrency === 'INR' ? '₹1.00' : '$0.0125'} • Direct top-up
                    </span>
                  </div>

                  <div className="settings-wallet-credits-col">
                    <span className="wallet-metric-label">Platform Credits</span>
                    <div className="wallet-credits-badge">
                      <Zap size={15} color="#10B981" />
                      <span className="wallet-credits-number">{userCredits.toLocaleString()}</span>
                      <span className="wallet-credits-unit">Credits</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="settings-refresh-wallet-btn"
                    onClick={loadTransactions}
                    title="Refresh wallet balance"
                  >
                    <RefreshCw size={13} className={loadingTxns ? 'spin' : ''} />
                    <span>Sync</span>
                  </button>
                </div>

                <div className="settings-divider" />

                <div className="settings-section-wrap">
                  <div className="settings-section-header">
                    <span className="settings-section-title">Recharge & Top Up Credits</span>
                    <span className="settings-section-desc">
                      Select a credit bundle or enter custom amount to top up immediately using verified gateways.
                    </span>
                  </div>

                  <div className="settings-gateway-selector-bar">
                    <span className="settings-subheading">Select Payment Gateway</span>
                    <div className="settings-gw-selector-grid">
                      {availableGateways.map(gw => (
                        <button
                          key={gw.id}
                          type="button"
                          className={`settings-gw-option-card ${topupGateway === gw.id ? 'active' : ''}`}
                          onClick={() => setTopupGateway(gw.id)}
                        >
                          <div className="settings-gw-option-left">
                            <div className={`settings-gw-radio-circle ${topupGateway === gw.id ? 'active' : ''}`}>
                              {topupGateway === gw.id && <div className="settings-gw-radio-dot" />}
                            </div>
                            <div className="settings-gw-info">
                              <span className="settings-gw-title">{gw.name}</span>
                              <span className="settings-gw-sub">{gw.description.split(',')[0]}</span>
                            </div>
                          </div>
                          {gw.badge && <span className="settings-gw-badge-tag">{gw.badge}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="settings-packs-grid">
                    {(TOPUP_PACKS[activeCurrency] || TOPUP_PACKS.INR).map(pack => {
                      const isPopular = pack.tag.toLowerCase().includes('popular');
                      return (
                        <div
                          key={pack.id}
                          className={`settings-pack-card ${isPopular ? 'settings-pack-card--featured' : ''}`}
                          onClick={() => handleInitiateTopupCheckout(pack)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleInitiateTopupCheckout(pack); }}
                        >
                          {isPopular && (
                            <div className="pack-card-featured-pill">
                              <span>Most Popular</span>
                            </div>
                          )}
                          <div className="pack-card-header">
                            <span className="pack-card-tag">{pack.tag}</span>
                            {pack.badge && <span className="pack-card-badge">{pack.badge}</span>}
                          </div>
                          <div className="pack-card-amount">
                            {paymentService.formatCurrency(pack.amount, activeCurrency)}
                          </div>
                          <div className="pack-card-credits">
                            <Zap size={14} color="#10B981" />
                            <span>{pack.credits.toLocaleString()} Credits</span>
                          </div>
                          <button
                            type="button"
                            className={`settings-pack-action-btn ${isPopular ? 'settings-pack-action-btn--featured' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInitiateTopupCheckout(pack);
                            }}
                          >
                            <span>Top Up</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="settings-custom-recharge-panel">
                    <div className="settings-custom-input-group">
                      <span className="settings-custom-currency-prefix">
                        {activeCurrency === 'INR' ? '₹' : '$'}
                      </span>
                      <input
                        type="number"
                        className="settings-custom-amount-input"
                        placeholder={`Enter custom amount in ${activeCurrency}...`}
                        value={customTopupAmount}
                        onChange={e => setCustomTopupAmount(e.target.value)}
                        min="1"
                      />
                      {customTopupAmount && parseFloat(customTopupAmount) > 0 && (
                        <span className="settings-custom-calc-badge">
                          <Zap size={12} color="#10B981" />
                          <span>{activeCurrency === 'INR' ? Math.round(parseFloat(customTopupAmount)).toLocaleString() : Math.round(parseFloat(customTopupAmount) * 80).toLocaleString()} Credits</span>
                        </span>
                      )}
                      <button
                        type="button"
                        className="settings-custom-submit-btn"
                        onClick={handleInitiateCustomTopup}
                        disabled={!customTopupAmount || parseFloat(customTopupAmount) <= 0}
                      >
                        <span>Recharge Custom</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="settings-custom-preset-chips">
                      <span className="settings-preset-label">Quick select:</span>
                      {(activeCurrency === 'INR' ? [100, 250, 500, 1000, 2000] : [5, 10, 25, 50, 100]).map(amt => (
                        <button
                          key={amt}
                          type="button"
                          className="settings-preset-chip"
                          onClick={() => setCustomTopupAmount(amt.toString())}
                        >
                          +{activeCurrency === 'INR' ? `₹${amt}` : `$${amt}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="settings-divider" />

                <div className="settings-section-wrap">
                  <div className="settings-section-header">
                    <span className="settings-section-title">Transaction Ledger</span>
                    <span className="settings-section-desc">
                      Detailed chronological record of all payment transactions and wallet recharges.
                    </span>
                  </div>

                  {transactions.length === 0 ? (
                    <div className="settings-empty-state">
                      <FileText size={28} color="var(--text-secondary)" />
                      <span>No transactions recorded yet.</span>
                    </div>
                  ) : (
                    <div className="settings-txn-table-wrap">
                      <table className="settings-txn-table">
                        <thead>
                          <tr>
                            <th>Reference ID</th>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Gateway</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map(txn => (
                            <tr key={txn.id}>
                              <td>
                                <div className="txn-ref-cell">
                                  <code>{txn.id}</code>
                                  <button
                                    type="button"
                                    className="txn-copy-btn"
                                    onClick={() => handleCopyTxnId(txn.id)}
                                    title="Copy reference code"
                                  >
                                    {copiedTxnId === txn.id ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                                  </button>
                                </div>
                              </td>
                              <td>{new Date(txn.timestamp).toLocaleDateString()}</td>
                              <td>{txn.title || txn.purpose}</td>
                              <td>{PAYMENT_GATEWAYS[txn.gateway]?.name || txn.gateway}</td>
                              <td className="txn-amount-cell">
                                {paymentService.formatCurrency(txn.amount, txn.currency)}
                              </td>
                              <td>
                                <span className="txn-status-badge">{txn.status || 'Success'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'referral' && (
              <>
                <div className="settings-referral-header">
                  <div>
                    <h2 className="settings-title">Refer & Earn Platform Credits</h2>
                    <p className="settings-tab-desc">
                      Invite your friends to SumanAI. They receive 50 credits on joining, and you earn 100 credits for every friend who joins.
                    </p>
                  </div>
                </div>

                <div className="referral-stat-grid">
                  <div className="referral-stat-card">
                    <span className="referral-stat-label">Total Credits Earned</span>
                    <div className="referral-stat-val referral-stat-val--brand">
                      {referralStats.creditsEarned.toLocaleString()}
                    </div>
                    <span className="referral-stat-sub">From {referralStats.count} successful referrals</span>
                  </div>

                  <div className="referral-stat-card">
                    <span className="referral-stat-label">Friends Referred</span>
                    <div className="referral-stat-val">
                      {referralStats.count}
                    </div>
                    <span className="referral-stat-sub">Registered accounts</span>
                  </div>

                  <div className="referral-stat-card">
                    <span className="referral-stat-label">Your Reward</span>
                    <div className="referral-stat-val referral-stat-val--green">
                      +100 Credits
                    </div>
                    <span className="referral-stat-sub">Deposited per friend joined</span>
                  </div>

                  <div className="referral-stat-card">
                    <span className="referral-stat-label">Friend's Reward</span>
                    <div className="referral-stat-val">
                      +50 Credits
                    </div>
                    <span className="referral-stat-sub">Instant welcome bonus</span>
                  </div>
                </div>

                <div className="referral-section-card">
                  <div className="referral-card-header">
                    <div>
                      <h3 className="referral-card-title">Your Referral Code & Share Link</h3>
                      <p className="referral-card-desc">
                        Share your unique code or direct invitation link with colleagues, friends, or your community.
                      </p>
                    </div>
                  </div>

                  <div className="referral-share-row">
                    <div className="referral-code-display">
                      <span className="referral-code-label">Your Unique Code</span>
                      <div className="referral-code-box">
                        <code className="referral-code-text">{referralCode || (loadingReferrals ? 'Generating...' : 'SIGN IN')}</code>
                        <button
                          type="button"
                          className="referral-copy-btn"
                          onClick={handleCopyRefCode}
                          disabled={!referralCode}
                          title="Copy referral code"
                        >
                          {copiedRefCode ? (
                            <>
                              <Check size={14} color="#10B981" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="referral-link-display">
                      <span className="referral-code-label">Direct Referral Link</span>
                      <div className="referral-link-box">
                        <input
                          type="text"
                          readOnly
                          className="referral-link-input"
                          value={referralCode ? referralService.buildShareUrl(referralCode) : ''}
                          placeholder="Sign in to generate referral link"
                        />
                        <button
                          type="button"
                          className="referral-copy-btn referral-copy-btn--secondary"
                          onClick={handleCopyRefLink}
                          disabled={!referralCode}
                        >
                          {copiedRefLink ? (
                            <>
                              <Check size={14} color="#10B981" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Link2 size={14} />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="referral-social-share-wrap">
                    <span className="referral-social-label">Quick Share:</span>
                    <div className="referral-social-buttons">
                      <button
                        type="button"
                        className="referral-social-btn"
                        onClick={() => handleSocialShare('whatsapp')}
                        disabled={!referralCode}
                      >
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        className="referral-social-btn"
                        onClick={() => handleSocialShare('twitter')}
                        disabled={!referralCode}
                      >
                        X (Twitter)
                      </button>
                      <button
                        type="button"
                        className="referral-social-btn"
                        onClick={() => handleSocialShare('telegram')}
                        disabled={!referralCode}
                      >
                        Telegram
                      </button>
                      <button
                        type="button"
                        className="referral-social-btn"
                        onClick={() => handleSocialShare('native')}
                        disabled={!referralCode}
                      >
                        <Share2 size={13} />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="referral-section-card">
                  <div className="referral-card-header">
                    <div>
                      <h3 className="referral-card-title">Redeem a Friend's Referral Code</h3>
                      <p className="referral-card-desc">
                        Were you invited by a friend? Claim their code below to instantly receive 50 platform credits.
                      </p>
                    </div>
                  </div>

                  {user?.hasRedeemedReferral ? (
                    <div className="referral-claimed-banner">
                      <CheckCircle2 size={18} color="#10B981" />
                      <div>
                        <div className="referral-claimed-title">Referral Bonus Claimed</div>
                        <div className="referral-claimed-desc">
                          You received 50 platform credits using invitation code {user.referredBy || 'from your friend'}.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form className="referral-redeem-form" onSubmit={handleRedeemReferral}>
                      <div className="referral-input-wrap">
                        <input
                          type="text"
                          className="referral-input"
                          placeholder="e.g. SUMAN-98A1"
                          value={inputReferralCode}
                          onChange={e => setInputReferralCode(e.target.value)}
                          disabled={redeemingRef || isGuest}
                        />
                        <button
                          type="submit"
                          className="referral-submit-btn"
                          disabled={redeemingRef || !inputReferralCode.trim() || isGuest}
                        >
                          {redeemingRef ? (
                            <>
                              <RefreshCw size={14} className="spin" />
                              <span>Claiming...</span>
                            </>
                          ) : (
                            <span>Claim 50 Credits</span>
                          )}
                        </button>
                      </div>

                      {refError && (
                        <div className="referral-form-msg referral-form-msg--error">
                          <AlertCircle size={14} />
                          <span>{refError}</span>
                        </div>
                      )}

                      {refSuccess && (
                        <div className="referral-form-msg referral-form-msg--success">
                          <CheckCircle2 size={14} />
                          <span>{refSuccess}</span>
                        </div>
                      )}

                      {isGuest && (
                        <div className="referral-guest-hint">
                          Please sign in or link your account to redeem referral codes.
                        </div>
                      )}
                    </form>
                  )}
                </div>

                <div className="referral-rules-grid">
                  <div className="referral-rule-item">
                    <span className="referral-rule-step">01</span>
                    <div className="referral-rule-content">
                      <h4 className="referral-rule-title">Share Your Code</h4>
                      <p className="referral-rule-desc">
                        Send your unique referral code or link to your friends, colleagues, and community.
                      </p>
                    </div>
                  </div>

                  <div className="referral-rule-item">
                    <span className="referral-rule-step">02</span>
                    <div className="referral-rule-content">
                      <h4 className="referral-rule-title">Friend Gets 50 Credits</h4>
                      <p className="referral-rule-desc">
                        Your friend claims your code and instantly receives 50 free credits in their wallet.
                      </p>
                    </div>
                  </div>

                  <div className="referral-rule-item">
                    <span className="referral-rule-step">03</span>
                    <div className="referral-rule-content">
                      <h4 className="referral-rule-title">You Earn 100 Credits</h4>
                      <p className="referral-rule-desc">
                        100 platform credits are immediately deposited into your wallet ledger for each referral.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="referral-history-card">
                  <div className="referral-card-header">
                    <div className="referral-history-header-row">
                      <h3 className="referral-card-title">Referral Activity & Rewards</h3>
                      <button
                        type="button"
                        className="referral-sync-btn"
                        onClick={loadReferralData}
                        disabled={loadingReferrals}
                        title="Sync referrals"
                      >
                        <RefreshCw size={13} className={loadingReferrals ? 'spin' : ''} />
                        <span>Refresh</span>
                      </button>
                    </div>
                    <p className="referral-card-desc">
                      Detailed chronological record of every friend who joined using your referral code.
                    </p>
                  </div>

                  {referralStats.history.length === 0 ? (
                    <div className="referral-empty-state">
                      <Users size={32} color="var(--text-secondary)" />
                      <span className="referral-empty-title">No referrals yet</span>
                      <span className="referral-empty-desc">
                        Share your unique code above. Once a friend claims it, your 100-credit rewards will show here.
                      </span>
                    </div>
                  ) : (
                    <div className="referral-table-wrapper">
                      <table className="referral-table">
                        <thead>
                          <tr>
                            <th>Referred Friend</th>
                            <th>Date</th>
                            <th>Reward Earned</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referralStats.history.map(item => (
                            <tr key={item.id}>
                              <td className="referral-user-cell">
                                <span className="referral-user-email">
                                  {item.refereeEmail ? item.refereeEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Verified Member'}
                                </span>
                              </td>
                              <td className="referral-date-cell">
                                {new Date(item.timestamp).toLocaleDateString()}
                              </td>
                              <td className="referral-reward-cell">
                                +{item.referrerReward || 100} Credits
                              </td>
                              <td>
                                <span className="referral-status-badge">
                                  <CheckCircle2 size={12} />
                                  <span>{item.status || 'Completed'}</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'upgrade' && (
              <>
                <div className="settings-upgrade-top-bar">
                  <div>
                    <h2 className="settings-title">{isPro ? 'Pro Benefits' : 'Upgrade Plan'}</h2>
                    <p className="settings-tab-desc">
                      Upgrade to unlock high-capacity reasoning models, dedicated LPU bandwidth, and vision capabilities.
                    </p>
                  </div>
                  <div className="settings-currency-toggle-wrap">
                    <span className="settings-curr-toggle-label">Currency:</span>
                    <div className="settings-currency-switcher">
                      <button
                        type="button"
                        className={`curr-btn ${activeCurrency === 'INR' ? 'active' : ''}`}
                        onClick={() => handleCurrencyChange('INR')}
                      >
                        INR (₹)
                      </button>
                      <button
                        type="button"
                        className={`curr-btn ${activeCurrency === 'USD' ? 'active' : ''}`}
                        onClick={() => handleCurrencyChange('USD')}
                      >
                        USD ($)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-divider" />

                {isAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-primary)' }}>
                    <ShieldCheck size={18} color="#8B5CF6" style={{ flexShrink: 0 }} />
                    <span>Super Admin privileges include full unrestricted access to all Pro flagship models, unlimited daily image generations, and platform controls.</span>
                  </div>
                )}

                <div className="settings-plan-grid">
                  <div className={`settings-plan-card ${!isPro && !isAdmin ? 'settings-plan-card--active' : ''}`}>
                    <div className="settings-plan-header">
                      <span className="settings-plan-title">Free Plan</span>
                      {!isPro && !isAdmin && <span className="settings-plan-current-tag">Current Plan</span>}
                    </div>
                    <div className="settings-plan-price">
                      {paymentService.formatCurrency(0, activeCurrency)} <span>/ month</span>
                    </div>
                    <ul className="settings-plan-features">
                      <li><Check size={14} color="#10B981" /> Full access to Qwen 3.8 27B</li>
                      <li><Check size={14} color="#10B981" /> Local chat history & persistence</li>
                      <li><Check size={14} color="#10B981" /> Interactive Canvas workspace</li>
                      <li><Check size={14} color="#10B981" /> Offline background remover</li>
                    </ul>
                  </div>

                  <div className={`settings-plan-card settings-plan-card--pro ${(isPro || isAdmin) ? 'settings-plan-card--active' : ''}`}>
                    <div className="settings-plan-header">
                      <span className="settings-plan-title">Pro Plan</span>
                      {isAdmin ? (
                        <span className="settings-plan-current-tag" style={{ background: 'rgba(139, 92, 246, 0.18)', color: '#A78BFA', border: '1px solid rgba(139, 92, 246, 0.35)' }}>Included with Admin</span>
                      ) : isPro ? (
                        <span className="settings-plan-current-tag">Active Subscription</span>
                      ) : (
                        <span className="settings-plan-badge-pro">PRO</span>
                      )}
                    </div>
                    <div className="settings-plan-price">
                      {PRO_PLANS[activeCurrency]?.display || (activeCurrency === 'INR' ? '₹1,299' : '$15')} <span>/ month</span>
                    </div>
                    <ul className="settings-plan-features">
                      <li><Check size={14} color="#10B981" /> Unlock GPT-OSS 120B & 20B flagship models</li>
                      <li><Check size={14} color="#10B981" /> Ultra-fast Groq LPU streaming (&lt;200ms)</li>
                      <li><Check size={14} color="#10B981" /> Extended deep thinking reasoning steps</li>
                      <li><Check size={14} color="#10B981" /> Unlimited cross-device cloud sync</li>
                      <li><Check size={14} color="#10B981" /> Priority access during peak traffic</li>
                    </ul>

                    {isAdmin ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10B981', fontSize: '13px', fontWeight: 600 }}>
                        <Check size={15} />
                        <span>Full Pro Privileges Active</span>
                      </div>
                    ) : isPro ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10B981', fontSize: '13px', fontWeight: 600 }}>
                        <Check size={15} />
                        <span>Active Pro Plan</span>
                      </div>
                    ) : (
                      <>
                        <div className="settings-sub-gw-selector">
                          <span className="settings-sub-gw-label">Payment Gateway:</span>
                          <div className="settings-gw-pills">
                            {availableGateways.map(gw => (
                              <button
                                key={gw.id}
                                type="button"
                                className={`settings-gw-pill ${subGateway === gw.id ? 'active' : ''}`}
                                onClick={() => setSubGateway(gw.id)}
                              >
                                <span>{gw.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="settings-upgrade-btn"
                          onClick={handleInitiateSubCheckout}
                        >
                          <Zap size={15} />
                          <span>Subscribe for {PRO_PLANS[activeCurrency]?.display || (activeCurrency === 'INR' ? '₹1,299' : '$15')} / month</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'personalization' && (
              <>
                <h2 className="settings-title">Personalization</h2>
                <div className="settings-divider" />

                <p className="settings-tab-desc">
                  Provide custom instructions so SumanAI tailors its responses to your preferences across all chats.
                </p>

                <form onSubmit={handleSavePersonalization} className="settings-form">
                  <div className="settings-field">
                    <label className="settings-field-label">
                      What would you like SumanAI to know about you to provide better responses?
                    </label>
                    <textarea
                      className="settings-textarea"
                      rows={3}
                      placeholder="E.g., I am a Full-Stack developer based in Kolkata, working primarily with React, Node.js, and Cloudflare Workers..."
                      value={userAbout}
                      onChange={e => setUserAbout(e.target.value)}
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-field-label">
                      How would you like SumanAI to respond?
                    </label>
                    <textarea
                      className="settings-textarea"
                      rows={3}
                      placeholder="E.g., Be concise, direct, and pragmatic. Provide production-grade code without boilerplate comments..."
                      value={responseStyle}
                      onChange={e => setResponseStyle(e.target.value)}
                    />
                  </div>

                  <div className="settings-row settings-toggle-row">
                    <span className="settings-row-label">Enable custom instructions</span>
                    <input
                      type="checkbox"
                      className="settings-checkbox"
                      checked={customEnabled}
                      onChange={e => setCustomEnabled(e.target.checked)}
                      id="enable-custom-instructions"
                    />
                  </div>

                  <div className="settings-actions">
                    <button type="submit" className="settings-primary-btn">
                      {personalizationSaved ? (
                        <>
                          <Check size={15} />
                          <span>Saved Successfully</span>
                        </>
                      ) : (
                        <span>Save Preferences</span>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {activeTab === 'data' && (
              <>
                <h2 className="settings-title">Data Controls</h2>
                <div className="settings-divider" />
                <div className="settings-row">
                  <div className="settings-row-text">
                    <span className="settings-row-label">Export Chat History</span>
                    <p className="settings-row-desc">
                      Download an offline JSON archive of all your conversations and workspace metadata.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="outline-btn"
                    onClick={handleExportData}
                  >
                    Export Data
                  </button>
                </div>

                <div className="settings-divider" />

                <div className="settings-row">
                  <div className="settings-row-text">
                    <span className="settings-row-label">Delete all conversations</span>
                    <p className="settings-row-desc">
                      Permanently wipe your local chat sessions and clear cached messages.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete all conversation history?")) {
                        localStorage.removeItem('chat-storage');
                        window.location.reload();
                      }
                    }}
                  >
                    Delete All
                  </button>
                </div>
              </>
            )}

            {activeTab === 'help' && (
              <>
                <h2 className="settings-title">Help & FAQ</h2>
                <div className="settings-divider" />

                <div className="settings-help-section">
                  <h3 className="settings-section-heading">Keyboard Shortcuts</h3>
                  <div className="settings-shortcuts-list">
                    <div className="settings-shortcut-row">
                      <span>Send Message</span>
                      <kbd>Enter</kbd>
                    </div>
                    <div className="settings-shortcut-row">
                      <span>New Line in Input</span>
                      <kbd>Shift + Enter</kbd>
                    </div>
                    <div className="settings-shortcut-row">
                      <span>Close Active Dialog</span>
                      <kbd>Escape</kbd>
                    </div>
                    <div className="settings-shortcut-row">
                      <span>Toggle Sidebar</span>
                      <kbd>Ctrl / Cmd + Shift + S</kbd>
                    </div>
                  </div>
                </div>

                <div className="settings-divider" />

                <div className="settings-help-section">
                  <h3 className="settings-section-heading">Model Access Policy</h3>
                  <p className="settings-tab-desc">
                    Guest users have instant access to <strong>Qwen 3.8 27B</strong>. To unlock <strong>GPT-OSS 120B</strong>, <strong>GPT-OSS 20B</strong>, and other models, simply sign in with your Google account.
                  </p>
                </div>

                <div className="settings-divider" />

                <div className="settings-help-section">
                  <h3 className="settings-section-heading">Support & Contact</h3>
                  <p className="settings-tab-desc">
                    Need help, encountered a bug, or have a feature request?
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Link
                      to="/contact"
                      onClick={onClose}
                      className="settings-contact-btn"
                    >
                      Open Support Portal <ArrowRight size={14} />
                    </Link>
                    <a
                      href="mailto:support_sumanai@sumanonline.com?subject=SumanAI%20Feedback"
                      className="settings-contact-btn"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Direct Email
                    </a>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'about' && (
              <>
                <h2 className="settings-title">About Project</h2>
                <div className="settings-divider" />

                <div className="about-content">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>SumanAI Core</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--bg-active)', color: 'var(--brand-primary)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>v2.4.0</span>
                      </div>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Latest Production Release • Sept 29, 2026</span>
                    </div>
                    <a
                      href="https://github.com/SumanCH8514/SumanAI-Chat-Platform/releases/tag/v2.4.0"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      Changelog <ArrowRight size={13} />
                    </a>
                  </div>

                  <div className="about-description">
                    SumanAI is a high-performance, minimalist AI chat platform built with React, Vite, and Groq LPU inference. It features responsive layouts, Firebase Google Authentication, dynamic model access tiers, and client-side background removal tools.
                  </div>

                  <div className="about-author-box">
                    <span className="author-label">Designed & Engineered by</span>
                    <span className="author-name">Suman Chakrabortty</span>
                  </div>

                  <div className="about-links">
                    <a href="https://github.com/SumanCH8514/" target="_blank" rel="noopener noreferrer" className="about-link-btn">
                      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                      </svg> GitHub Profile
                    </a>
                    <a href="https://www.linkedin.com/in/sumanchakrabortty8514/" target="_blank" rel="noopener noreferrer" className="about-link-btn">
                      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                        <rect x="2" y="9" width="4" height="12"></rect>
                        <circle cx="4" cy="4" r="2"></circle>
                      </svg> LinkedIn Connect
                    </a>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '14px', borderTop: '1px solid var(--border-light)', alignItems: 'center' }}>
                    <Link to="/about" onClick={onClose} style={{ fontSize: '13px', color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600 }}>
                      Learn More About Us →
                    </Link>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>•</span>
                    <Link to="/terms" onClick={onClose} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                      Terms of Service
                    </Link>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>•</span>
                    <Link to="/privacy" onClick={onClose} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                      Privacy Policy
                    </Link>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>•</span>
                    <Link to="/contact" onClick={onClose} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                      Support & Contact
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        checkoutData={checkoutData}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default SettingsModal;
