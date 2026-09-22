import React, { useState } from 'react';
import { PLANS_UI } from './VendorLanding';
import { apiSwitchPlan, fmtApiError } from '@/lib/auth';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

export const SubscriptionTab = ({ vendor, planDetails, onSaved }) => {
  const [busy, setBusy] = useState(false);

  const choose = async (plan) => {
    if (plan === vendor.plan) return;
    setBusy(true);
    try {
      const r = await apiSwitchPlan(plan);
      toast.success(`Switched to ${PLANS_UI.find(p => p.id === plan)?.name} (DEMO)`);
      onSaved && onSaved(r.vendor);
    } catch (e) { toast.error(fmtApiError(e.response?.data?.detail, 'Could not switch plan')); }
    setBusy(false);
  };

  return (
    <div data-testid="subscription-tab">
      <div className="pearl-card p-5 mb-6 flex items-start gap-3 border !border-amber-200/70 !bg-gradient-to-br !from-amber-50/80 !to-white/70">
        <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-[#6B617A]">
          <b className="text-[#2D2638]">DEMO MODE</b> — subscriptions switch instantly without collecting payment. Real payments (e.g. Razorpay Subscriptions) plug into this same flow later. No card details are ever stored.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS_UI.map((p) => {
          const active = vendor.plan === p.id;
          return (
            <div key={p.id} data-testid={`sub-plan-${p.id}`} className={`relative pearl-card p-6 flex flex-col ${active ? 'gradient-border ring-1 ring-pink-200/80' : ''}`}>
              {active && <span className="absolute -top-3 left-1/2 -translate-x-1/2 chip !text-[10px] !py-1 !px-3 uppercase tracking-[0.2em] !bg-gradient-to-r !from-[#C9B8FF]/60 !to-[#F7B7D8]/60">Current Plan</span>}
              <p className="font-heading text-sm font-semibold tracking-[0.2em] text-[#2D2638]">{p.name}</p>
              <p className="mt-2"><span className="font-display text-3xl text-[#2D2638]">{p.price}</span><span className="text-xs text-[#988FA6]">{p.per}</span></p>
              <ul className="mt-4 space-y-1.5 flex-1">
                {p.features.slice(0, 5).map((f) => <li key={f} className="text-xs text-[#6B617A]">· {f}</li>)}
              </ul>
              <button data-testid={`plan-choose-${p.id}`} onClick={() => choose(p.id)} disabled={busy || active}
                className={`mt-5 w-full ${active ? 'chip !py-2 opacity-50 cursor-default' : 'glow-btn !py-2.5 !text-sm'}`}>
                {active ? 'Active' : `Switch to ${p.name.charAt(0) + p.name.slice(1).toLowerCase()}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionTab;
