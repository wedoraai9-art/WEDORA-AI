import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiVendorStats, apiVendorMe, clearToken, fmtApiError } from '@/lib/auth';
import { toast } from 'sonner';
import {
  LayoutGrid, User, Images, Inbox, CalendarDays, BarChart3, CreditCard, Settings as SettingsIcon,
  Eye, MessageCircle, Users, MousePointerClick, LogOut, ExternalLink, Crown,
} from 'lucide-react';
import ProfileTab from './ProfileTab';
import PortfolioTab from './PortfolioTab';
import LeadsTab from './LeadsTab';
import SubscriptionTab from './SubscriptionTab';
import WeddingsTab from './WeddingsTab';
import WeddingWorkspace from './WeddingWorkspace';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'weddings', label: 'Weddings', icon: CalendarDays },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'portfolio', label: 'Portfolio', icon: Images },
  { id: 'leads', label: 'Leads', icon: Inbox },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const StatCard = ({ icon: Icon, label, value, testid }) => (
  <div className="pearl-card p-5" data-testid={testid}>
    <div className="flex items-center gap-2 text-[#988FA6] text-xs uppercase tracking-widest mb-2">
      <Icon className="w-4 h-4" /> {label}
    </div>
    <p className="font-display text-3xl text-[#2D2638]">{value}</p>
  </div>
);

const VendorDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const onGoto = (e) => setTab(e.detail);
    window.addEventListener('wedora:goto-tab', onGoto);
    return () => window.removeEventListener('wedora:goto-tab', onGoto);
  }, []);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'vendor' && user.role !== 'admin'))) navigate('/vendor/auth');
  }, [user, loading, navigate]);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [me, st] = await Promise.all([apiVendorMe(), apiVendorStats()]);
      setVendor(me.vendor); setPlanDetails(me.plan_details); setStats(st);
    } catch (e) {
      toast.error(fmtApiError(e.response?.data?.detail, 'Could not load dashboard'));
    }
    setBusy(false);
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  const logout = () => { clearToken(); navigate('/for-vendors'); };

  if (loading || !user) return null;
  if (busy && !vendor) return (
    <div className="min-h-screen silky-bg pt-40 text-center"><div className="thinking-orb mx-auto" /></div>
  );

  return (
    <div className="min-h-screen silky-bg pt-28 pb-16 px-4" data-testid="vendor-dashboard">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl overflow-hidden bg-white/70 border border-white/80 flex items-center justify-center">
              {vendor?.logo ? <img src={vendor.logo} alt="" className="w-full h-full object-cover" /> : <span className="font-display text-2xl text-[#988FA6]">{vendor?.business_name?.[0]}</span>}
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-[#2D2638] flex items-center gap-2">
                {vendor?.business_name}
                {vendor?.plan === 'premium' && <Crown className="w-5 h-5 text-[#F58D91]" data-testid="premium-crown" />}
              </h1>
              <p className="text-xs text-[#6B617A] mt-0.5">
                <span className="uppercase tracking-widest" data-testid="current-plan-label">{planDetails?.label}</span> plan
                {vendor?.slug && <> · <a href={`/vendor/${vendor.slug}`} target="_blank" rel="noreferrer" className="underline decoration-pink-300 inline-flex items-center gap-1">View public profile <ExternalLink className="w-3 h-3" /></a></>}
              </p>
            </div>
          </div>
          <button data-testid="dashboard-logout" onClick={logout} className="chip !text-xs inline-flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> Sign out</button>
        </div>

        {/* Tabs */}
        <div className="liquid-glass rounded-full p-1.5 flex overflow-x-auto gap-1 mb-7 max-w-full" data-testid="dashboard-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} data-testid={`tab-${id}`} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${tab === id ? 'bg-gradient-to-r from-[#C9B8FF]/70 to-[#F7B7D8]/70 text-[#2D2638] font-medium shadow-sm' : 'text-[#6B617A] hover:text-[#2D2638]'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Panels */}
        {tab === 'overview' && stats && (
          <div data-testid="overview-tab">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <StatCard icon={Eye} label="Profile Views" value={stats.profile_views} testid="stat-profile-views" />
              <StatCard icon={Inbox} label="Leads" value={stats.leads} testid="stat-leads" />
              <StatCard icon={MessageCircle} label="WhatsApp Clicks" value={stats.whatsapp_clicks} testid="stat-whatsapp-clicks" />
              <StatCard icon={Users} label="Contact Requests" value={stats.contact_requests} testid="stat-contact-requests" />
              <StatCard icon={MousePointerClick} label="Portfolio Views" value={stats.portfolio_views} testid="stat-portfolio-views" />
            </div>
            <div className="pearl-card p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="font-heading font-semibold text-[#2D2638]">Profile Completion</p>
                <p className="text-sm text-[#6B617A]" data-testid="profile-completion">{stats.profile_completion}%</p>
              </div>
              <div className="h-3 rounded-full bg-white/70 border border-white/80 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#C9B8FF] via-[#F7B7D8] to-[#A9E8FF] transition-all duration-700" style={{ width: `${stats.profile_completion}%` }} />
              </div>
            </div>
          </div>
        )}
        {tab === 'weddings' && vendor && <WeddingsTab vendor={vendor} />}
        {tab === 'profile' && vendor && <ProfileTab vendor={vendor} planDetails={planDetails} onSaved={load} />}
        {tab === 'portfolio' && vendor && <PortfolioTab vendor={vendor} planDetails={planDetails} onSaved={load} />}
        {tab === 'leads' && vendor && <LeadsTab vendor={vendor} />}

        {tab === 'analytics' && stats && (
          <div className="pearl-card p-6 md:p-8" data-testid="analytics-tab">
            <h3 className="font-heading font-semibold text-lg text-[#2D2638] mb-5">Analytics</h3>
            {planDetails?.ai_profile || vendor.plan === 'pro' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={Eye} label="Views → Leads" value={stats.profile_views ? `${Math.round(100 * stats.leads / stats.profile_views)}%` : '—'} testid="stat-conversion" />
                <StatCard icon={Inbox} label="New Leads" value={stats.new_leads} testid="stat-new-leads" />
                <StatCard icon={MessageCircle} label="WhatsApp Rate" value={stats.profile_views ? `${Math.round(100 * stats.whatsapp_clicks / stats.profile_views)}%` : '—'} testid="stat-whatsapp-rate" />
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#C9B8FF]/60 bg-white/50 p-10 text-center">
                <p className="text-[#6B617A] mb-4">This feature is available on PRO/PREMIUM.</p>
                <button data-testid="analytics-upgrade-btn" onClick={() => setTab('subscription')} className="glow-btn !py-2 !px-6 !text-sm">Upgrade Plan</button>
              </div>
            )}
          </div>
        )}

        {tab === 'subscription' && vendor && <SubscriptionTab vendor={vendor} planDetails={planDetails} onSaved={load} />}

        {tab === 'settings' && vendor && (
          <div className="pearl-card p-6 md:p-8" data-testid="settings-tab">
            <h3 className="font-heading font-semibold text-lg text-[#2D2638] mb-2">Settings</h3>
            <p className="text-sm text-[#6B617A]">Account: <b>{user.email}</b></p>
            <p className="text-sm text-[#6B617A] mt-1">Public profile URL: <a className="underline decoration-pink-300" href={`/vendor/${vendor.slug}`} target="_blank" rel="noreferrer">/vendor/{vendor.slug}</a></p>
            <button data-testid="settings-logout" onClick={logout} className="chip !text-sm mt-6 inline-flex items-center gap-2"><LogOut className="w-4 h-4" /> Sign out</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
