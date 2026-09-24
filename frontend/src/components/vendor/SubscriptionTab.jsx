import React, { useState } from 'react';
import { PLANS_UI } from './VendorLanding';
import { apiSwitchPlan, fmtApiError } from '@/lib/auth';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

export const SubscriptionTab = ({ vendor, planDetails, onSaved }) => {
  const [busy, setBusy] = useState(false);
  const [switchingPlan, setSwitchingPlan] = useState(null);

  const currentPlan = vendor?.plan || planDetails?.id || 'free';

  const getPlanName = (planId) => {
    const plan = PLANS_UI.find((item) => item.id === planId);

    return (
      plan?.name ||
      String(planId || 'plan')
        .charAt(0)
        .toUpperCase() +
        String(planId || 'plan')
          .slice(1)
          .toLowerCase()
    );
  };

  const choose = async (plan) => {
    if (!plan || plan === currentPlan || busy) return;

    const selectedPlan = PLANS_UI.find((item) => item.id === plan);

    if (!selectedPlan) {
      toast.error('This plan is not available right now.');
      return;
    }

    setBusy(true);
    setSwitchingPlan(plan);

    try {
      const response = await apiSwitchPlan(plan);
      const updatedVendor = response?.vendor;

      toast.success(
        `Switched to ${getPlanName(plan)} (DEMO)`
      );

      if (onSaved) {
        await onSaved(updatedVendor);
      }
    } catch (error) {
      toast.error(
        fmtApiError(
          error?.response?.data?.detail,
          'Could not switch plan'
        )
      );
    } finally {
      setSwitchingPlan(null);
      setBusy(false);
    }
  };

  return (
    <div data-testid="subscription-tab">
      <div className="pearl-card p-5 mb-6 flex items-start gap-3 border !border-amber-200/70 !bg-gradient-to-br !from-amber-50/80 !to-white/70">
        <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />

        <p className="text-sm text-[#6B617A]">
          <b className="text-[#2D2638]">DEMO MODE</b> —
          subscriptions switch instantly without collecting
          payment. Real payments (e.g. Razorpay Subscriptions)
          plug into this same flow later. No card details are
          ever stored.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS_UI.map((plan) => {
          const active = currentPlan === plan.id;
          const switching = switchingPlan === plan.id;

          return (
            <div
              key={plan.id}
              data-testid={`sub-plan-${plan.id}`}
              className={`relative pearl-card p-6 flex flex-col ${
                active
                  ? 'gradient-border ring-1 ring-pink-200/80'
                  : ''
              }`}
            >
              {active && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 chip !text-[10px] !py-1 !px-3 uppercase tracking-[0.2em] !bg-gradient-to-r !from-[#C9B8FF]/60 !to-[#F7B7D8]/60">
                  Current Plan
                </span>
              )}

              <p className="font-heading text-sm font-semibold tracking-[0.2em] text-[#2D2638]">
                {plan.name}
              </p>

              <p className="mt-2">
                <span className="font-display text-3xl text-[#2D2638]">
                  {plan.price}
                </span>

                <span className="text-xs text-[#988FA6]">
                  {plan.per}
                </span>
              </p>

              <ul className="mt-4 space-y-1.5 flex-1">
                {plan.features.slice(0, 5).map((feature) => (
                  <li
                    key={feature}
                    className="text-xs text-[#6B617A]"
                  >
                    · {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                data-testid={`plan-choose-${plan.id}`}
                onClick={() => choose(plan.id)}
                disabled={busy || active}
                className={`mt-5 w-full ${
                  active
                    ? 'chip !py-2 opacity-50 cursor-default'
                    : 'glow-btn !py-2.5 !text-sm'
                }`}
              >
                {active
                  ? 'Active'
                  : switching
                    ? 'Switching…'
                    : `Switch to ${getPlanName(plan.id)}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionTab;
