import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiAdminVendors, apiAdminUpdateVendor, apiAdminLeads, clearToken } from '@/lib/auth';
import { toast } from 'sonner';
import { LogOut, Crown } from 'lucide-react';

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [leads, setLeads] = useState([]);
  const [view, setView] = useState('vendors');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) navigate('/vendor/auth');
  }, [user, loading, navigate]);

  const load = useCallback(async () => {
    try {
      const [v, l] = await Promise.all([apiAdminVendors(), apiAdminLeads()]);
      setVendors(v.vendors || []); setLeads(l.leads || []);
    } catch { toast.error('Admin load failed'); }
  }, []);
  useEffect(() => { if (user?.role === 'admin') load(); }, [user, load]);

  if (!user || user.role !== 'admin') return null;

  const setPlan = async (id, plan) => {
    await apiAdminUpdateVendor(id, { plan });
    toast.success(`Plan switched to ${plan} (DEMO)`);
    load();
  };
  const toggle = async (id, field, value) => {
    await apiAdminUpdateVendor(id, { [field]: value });
    load();
  };

  return (
    <div className="min-h-screen silky-bg pt-28 pb-16 px-4" data-testid="admin-dashboard">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-[#2D2638]">Admin <span className="iridescent-text italic">Console</span></h1>
            <p className="text-xs text-[#988FA6] mt-1">DEMO MODE — plan changes are instant, no payments.</p>
          </div>
          <button data-testid="admin-logout" onClick={() => { clearToken(); navigate('/'); }} className="chip !text-xs inline-flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> Sign out</button>
        </div>

        <div className="liquid-glass rounded-full p-1 flex max-w-sm mb-7">
          <button data-testid="admin-tab-vendors" onClick={() => setView('vendors')} className={`flex-1 py-2 rounded-full text-sm transition ${view === 'vendors' ? 'bg-gradient-to-r from-[#C9B8FF]/70 to-[#F7B7D8]/70 font-medium' : 'text-[#6B617A]'}`}>Vendors ({vendors.length})</button>
          <button data-testid="admin-tab-leads" onClick={() => setView('leads')} className={`flex-1 py-2 rounded-full text-sm transition ${view === 'leads' ? 'bg-gradient-to-r from-[#C9B8FF]/70 to-[#F7B7D8]/70 font-medium' : 'text-[#6B617A]'}`}>Leads ({leads.length})</button>
        </div>

        {view === 'vendors' ? (
          <div className="space-y-3">
            {vendors.map((v) => (
              <div key={v.id} data-testid={`admin-vendor-${v.slug}`} className="pearl-card !p-4 flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold text-[#2D2638] flex items-center gap-2">
                    {v.business_name}
                    {v.plan_badge && <Crown className="w-4 h-4 text-[#F58D91]" />}
                  </p>
                  <p className="text-xs text-[#6B617A]">{v.category} · {v.city} · {v.slug}</p>
                </div>
                <select data-testid={`admin-plan-select-${v.slug}`} value={v.plan} onChange={(e) => setPlan(v.id, e.target.value)} className="chip !py-1.5 !text-xs">
                  <option value="free">FREE</option>
                  <option value="pro">PRO</option>
                  <option value="premium">PREMIUM</option>
                </select>
                <label className="flex items-center gap-1.5 text-xs text-[#6B617A]">
                  <input type="checkbox" data-testid={`admin-featured-${v.slug}`} checked={!!v.is_featured} onChange={(e) => toggle(v.id, 'is_featured', e.target.checked)} /> Featured
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#6B617A]">
                  <input type="checkbox" data-testid={`admin-published-${v.slug}`} checked={v.is_published !== false} onChange={(e) => toggle(v.id, 'is_published', e.target.checked)} /> Published
                </label>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {leads.length === 0 && <p className="text-[#6B617A] text-sm">No leads yet.</p>}
            {leads.map((l) => (
              <div key={l.id} data-testid={`admin-lead-${l.id}`} className="pearl-card !p-4">
                <p className="font-heading font-semibold text-[#2D2638]">{l.name} <span className="text-xs font-normal text-[#988FA6]">→ {l.vendor_id?.slice(0, 8)}…</span></p>
                <p className="text-xs text-[#6B617A]">{l.email} · {l.phone} · {l.city || '—'} · {l.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
