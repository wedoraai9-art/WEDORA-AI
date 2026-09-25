import React, { useState } from 'react';
import { Bell, Copy, ExternalLink, LogOut, UserRound } from 'lucide-react';
import { toast } from 'sonner';

const preferenceKey = 'wedora_vendor_lead_notifications';

export const SettingsTab = ({ vendor, user, onLogout }) => {
  const [copyingProfileUrl, setCopyingProfileUrl] = useState(false);
  const [leadNotifications, setLeadNotifications] = useState(() => {
    try {
      return window.localStorage.getItem(preferenceKey) !== 'false';
    } catch {
      return true;
    }
  });

  const publicProfilePath = vendor?.slug ? `/vendor/${vendor.slug}` : null;
  const publicProfileUrl = publicProfilePath
    ? `${window.location.origin}${publicProfilePath}`
    : null;
  const hasProAccess = String(vendor?.plan || '').toLowerCase() === 'pro';

  const openPublicProfile = () => {
    if (!publicProfilePath) {
      toast.error('Public profile is not available yet.');
      return;
    }

    window.open(publicProfilePath, '_blank', 'noopener,noreferrer');
  };

  const copyPublicProfile = async () => {
    if (!publicProfileUrl || copyingProfileUrl) {
      if (!publicProfileUrl) toast.error('Public profile is not available yet.');
      return;
    }

    setCopyingProfileUrl(true);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(publicProfileUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = publicProfileUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        textarea.remove();
        if (!copied) throw new Error('Copy command failed');
      }
      toast.success('Public profile link copied');
    } catch {
      toast.error('Could not copy profile link');
    } finally {
      setCopyingProfileUrl(false);
    }
  };

  const updateLeadNotifications = (event) => {
    const enabled = event.target.checked;
    setLeadNotifications(enabled);
    try {
      window.localStorage.setItem(preferenceKey, String(enabled));
      toast.success(enabled ? 'New lead alerts enabled' : 'New lead alerts paused');
    } catch {
      toast.error('Could not save this notification preference');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="settings-tab">
      <section className="pearl-card p-6 md:p-8">
        <h3 className="font-heading font-semibold text-lg text-[#2D2638] mb-5">
          Account
        </h3>

        <div className="rounded-2xl bg-white/60 border border-white/80 p-4">
          <p className="text-xs uppercase tracking-widest text-[#988FA6]">Signed-in email</p>
          <p className="text-sm text-[#2D2638] mt-1 break-all">{user?.email || 'Not available'}</p>
        </div>

        <div className="rounded-2xl bg-white/60 border border-white/80 p-4 mt-3">
          <p className="text-xs uppercase tracking-widest text-[#988FA6]">Business</p>
          <p className="text-sm text-[#2D2638] mt-1">{vendor?.business_name || 'Vendor profile'}</p>
          <p className="text-xs text-[#6B617A] mt-1">
            {[vendor?.category, vendor?.city].filter(Boolean).join(' · ') || 'Add details in My Profile'}
          </p>
        </div>

        <button
          type="button"
          data-testid="settings-edit-profile"
          onClick={() => window.dispatchEvent(new CustomEvent('wedora:goto-tab', { detail: 'profile' }))}
          className="chip !text-sm mt-4 inline-flex items-center gap-2"
        >
          <UserRound className="w-4 h-4" /> Edit business profile
        </button>

        <button
          type="button"
          data-testid="settings-logout"
          onClick={onLogout}
          className="chip !text-sm mt-4 ml-2 inline-flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </section>

      <section className="pearl-card p-6 md:p-8">
        <h3 className="font-heading font-semibold text-lg text-[#2D2638] mb-5">
          Notifications
        </h3>

        {hasProAccess ? (
          <label className="flex items-start gap-3 rounded-2xl bg-white/60 border border-white/80 p-4 cursor-pointer">
            <Bell className="w-5 h-5 text-[#988FA6] mt-0.5" />
            <span className="flex-1">
              <span className="block text-sm font-medium text-[#2D2638]">New client lead alerts</span>
              <span className="block text-xs text-[#6B617A] mt-1">Show an alert when a new enquiry arrives while your dashboard is open.</span>
              <span className="block text-xs text-[#988FA6] mt-1">This preference is saved on this device.</span>
            </span>
            <input
              data-testid="settings-lead-notifications"
              type="checkbox"
              checked={leadNotifications}
              onChange={updateLeadNotifications}
              className="mt-1 accent-[#C9B8FF]"
            />
          </label>
        ) : (
          <div className="rounded-2xl bg-white/60 border border-white/80 p-4">
            <p className="text-sm font-medium text-[#2D2638]">New client lead alerts</p>
            <p className="text-xs text-[#6B617A] mt-1">Lead alerts are available to PRO vendors after payment is verified.</p>
          </div>
        )}

        <h3 className="font-heading font-semibold text-lg text-[#2D2638] mt-7 mb-3">
          Public profile
        </h3>
        <p className="text-sm text-[#6B617A] break-all">
          {publicProfilePath ? (
            <a className="underline decoration-pink-300" href={publicProfilePath} target="_blank" rel="noreferrer">
              {publicProfileUrl}
            </a>
          ) : (
            <span className="text-[#988FA6]">Your profile link will appear after your profile is set up.</span>
          )}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            data-testid="settings-copy-profile"
            onClick={copyPublicProfile}
            disabled={!publicProfilePath || copyingProfileUrl}
            className="chip !text-sm inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Copy className="w-4 h-4" /> {copyingProfileUrl ? 'Copying…' : 'Copy profile link'}
          </button>
          <button
            type="button"
            data-testid="settings-open-profile"
            onClick={openPublicProfile}
            disabled={!publicProfilePath}
            className="glow-btn !py-2 !px-4 !text-sm inline-flex items-center gap-2 disabled:opacity-50"
          >
            <ExternalLink className="w-4 h-4" /> Open profile
          </button>
        </div>
      </section>
    </div>
  );
};

export default SettingsTab;
