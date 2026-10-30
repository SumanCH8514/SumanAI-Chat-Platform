import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Lock, Zap } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useModel } from '../hooks/useModel';
import { usageService } from '../services/usageService';
import './ImageQuotaBadge.css';

const ImageQuotaBadge = ({ onQuotaChange }) => {
  const { user, openAuthModal } = useAuthStore();
  const { governance } = useModel();

  const [quota, setQuota] = useState(() => usageService.getRollingUsage(user, governance));

  useEffect(() => {
    if (typeof onQuotaChange === 'function') {
      onQuotaChange(quota);
    }
  }, [quota, onQuotaChange]);

  const refreshQuota = useCallback(() => {
    const updated = usageService.getRollingUsage(user, governance);
    setQuota(updated);
  }, [user, governance]);

  useEffect(() => {
    const interval = setInterval(refreshQuota, 60000);
    const handleUsageEvent = () => refreshQuota();

    if (typeof window !== 'undefined') {
      window.addEventListener('sumanai_image_usage_updated', handleUsageEvent);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('sumanai_image_usage_updated', handleUsageEvent);
      }
    };
  }, [refreshQuota]);

  if (!quota.isGoogleUser) {
    return (
      <div
        className="image-quota-badge guest"
        onClick={() => openAuthModal()}
        title="Sign in with Google to create AI images (5 Free daily)"
        role="button"
        tabIndex={0}
      >
        <Lock size={12} />
        <span>Sign in to Generate</span>
      </div>
    );
  }

  if (quota.isUnlimited) {
    return (
      <div
        className="image-quota-badge pro"
        title="You have unlimited AI image generations on the Pro tier"
      >
        <Zap size={12} />
        <span>Pro Unlimited</span>
      </div>
    );
  }

  if (quota.isBlocked) {
    return (
      <div
        className="image-quota-badge blocked"
        title={`Limit reached (${quota.limit}/${quota.limit}). Next image generation slot unlocks in ${quota.resetsInText || '24 hours'}.`}
      >
        <Clock size={12} className="quota-clock-icon" />
        <span>{quota.limit}/{quota.limit} (Resets in {quota.resetsInText || '24h'})</span>
      </div>
    );
  }

  return (
    <div
      className="image-quota-badge active"
      title={`${quota.remaining} of ${quota.limit} image generation slots available in current 24-hour cycle`}
    >
      <span className="quota-status-dot" />
      <span>{quota.used} / {quota.limit} Images (24h)</span>
    </div>
  );
};

export default ImageQuotaBadge;