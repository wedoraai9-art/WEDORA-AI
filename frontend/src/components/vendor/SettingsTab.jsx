import React, { useState } from 'react';
import { ExternalLink, Copy, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export const SettingsTab = ({ vendor, user, onLogout }) => {
  const [copyingProfileUrl, setCopyingProfileUrl] = useState(false);

  const publicProfilePath = vendor?.slug
    ? `/vendor/${vendor.slug}`
    : null;

  const publicProfileUrl = publicProfilePath
    ? `${window.location.origin}${publicProfilePath}`
    : null;

  const openPublicProfile = () => {
    if (!publicProfilePath) {
      toast.error('Public profile is not available yet.');
      return;
    }

    window.open(
      publicProfilePath,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const copyPublicProfile = async () => {
    if (!publicProfileUrl || copyingProfileUrl) {
      if (!publicProfileUrl) {
        toast.error('Public profile is not available yet.');
      }
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
        document.execCommand('copy');
        textarea.remove();
      }

      toast.success('Public profile link copied');
    } catch {
      toast.error('Could not copy profile link');
    } finally {
      setCopyingProfileUrl(false);
    }
  };

  return (
    <div
      className="pearl-card p-6 md:p-8"
      data-testid="settings-tab"
    >
      <h3 className="font-heading font-semibold text-lg text-[#2D2638] mb-2">
        Settings
      </h3>

      <p className="text-sm text-[#6B617A]">
        Account:{' '}
        <b>{user?.email || 'Not available'}</b>
      </p>

      <p className="text-sm text-[#6B617A] mt-1">
        Public profile URL:{' '}

        {publicProfilePath ? (
          <a
            className="underline decoration-pink-300"
            href={publicProfilePath}
            target="_blank"
            rel="noreferrer"
          >
            {publicProfilePath}
          </a>
        ) : (
          <span className="text-[#988FA6]">
            Not available yet
          </span>
        )}
      </p>

      <div className="flex flex-wrap gap-2 mt-6">
        <button
          data-testid="settings-copy-profile"
          onClick={copyPublicProfile}
          disabled={!publicProfilePath || copyingProfileUrl}
          className="chip !text-sm inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Copy className="w-4 h-4" />

          {copyingProfileUrl
            ? 'Copying…'
            : 'Copy profile link'}
        </button>

        <button
          data-testid="settings-open-profile"
          onClick={openPublicProfile}
          disabled={!publicProfilePath}
          className="glow-btn !py-2 !px-4 !text-sm inline-flex items-center gap-2 disabled:opacity-50"
        >
          <ExternalLink className="w-4 h-4" />
          Open profile
        </button>
      </div>

      <button
        data-testid="settings-logout"
        onClick={onLogout}
        className="chip !text-sm mt-6 inline-flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );
};

export default SettingsTab;
