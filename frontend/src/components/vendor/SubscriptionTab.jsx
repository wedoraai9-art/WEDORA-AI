import React, { useMemo, useState } from 'react';
import {
  Check,
  Crown,
  Sparkles,
  Lock,
  Zap,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Inbox,
  Images,
  CalendarDays,
  Download,
  Bot,
} from 'lucide-react';
import { authAxios } from '@/lib/auth';
import { toast } from 'sonner';

const SubscriptionTab = ({ vendor, planDetails, onSaved }) => {
  const [billing, setBilling] = useState('monthly');
  const [savingPlan, setSavingPlan] = useState(null);

  const currentPlan = String(
    vendor?.plan || planDetails?.plan || 'free'
  ).toLowerCase();

  const plans = useMemo(
    () => [
      {
        id: 'free',
        name: 'FREE',
        label: 'WEDORA FREE',
        monthly: 0,
        yearly: 0,
        description: 'Everything you need to get started on WEDORA.',
        badge: 'STARTER',
        features: [
          'Public vendor profile',
          'Up to 3 wedding workspaces',
          'Up to 5 portfolio images',
          'Basic wedding workspace',
          'Profile visibility on WEDORA',
          'Basic dashboard',
        ],
        unavailable: [
          'Client lead enquiries',
          'Advanced analytics',
          'AI Assistant',
          'Unlimited portfolio',
          'CSV / data export',
          'Featured vendor placement',
        ],
      },
      {
        id: 'pro',
        name: 'PRO',
        label: 'WEDORA PRO',
        monthly: 599,
        yearly: 5999,
        description:
          'For vendors ready to manage more weddings and receive client leads.',
        badge: 'PRO VENDOR',
        popular: true,
        features: [
          'Unlimited wedding workspaces',
          'Unlimited portfolio images',
          'Receive client enquiries',
          'Lead management',
          'Advanced analytics',
          'AI Assistant access',
          'CSV / data export',
          'Featured vendor placement',
          'PRO Vendor badge',
        ],
        unavailable: [],
      },
    ],
    []
  );

  const selectedPlan = (plan) =>
    billing === 'yearly' ? plan.yearly : plan.monthly;

  const switchPlan = async (planId) => {
    if (savingPlan || planId === currentPlan) return;

    if (planId === 'pro') {
      toast.info('PRO activation will be available after secure payment is set up.');
      return;
    }

    setSavingPlan(planId);

    try {
      await authAxios.post('/vendor/plan', {
        plan: planId,
      });

      toast.success(
        planId === 'pro'
          ? 'WEDORA PRO activated successfully.'
          : 'WEDORA FREE activated successfully.'
      );

      if (onSaved) {
        await onSaved();
      }
    } catch (error) {
      const detail = error?.response?.data?.detail;

      toast.error(
        typeof detail === 'string'
          ? detail
          : 'Could not change your subscription plan.'
      );
    } finally {
      setSavingPlan(null);
    }
  };

  return (
    <div
      className="space-y-7"
      data-testid="subscription-tab"
    >
      {/* Header */}
      <div className="pearl-card p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#988FA6] mb-2">
              WEDORA VENDOR PLANS
            </p>

            <h2 className="font-display text-3xl md:text-4xl text-[#2D2638]">
              Choose your plan
            </h2>

            <p className="text-sm text-[#6B617A] mt-2 max-w-2xl leading-6">
              Grow your wedding business with better visibility, client
              enquiries, analytics and intelligent wedding tools.
            </p>
          </div>

          {/* Current plan */}
          <div className="liquid-glass rounded-3xl px-5 py-4 min-w-[220px]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#988FA6]">
              <ShieldCheck className="w-4 h-4" />
              Current Plan
            </div>

            <div className="flex items-center gap-2 mt-1">
              {currentPlan === 'pro' && (
                <Crown className="w-4 h-4 text-[#F58D91]" />
              )}

              <span
                className="font-display text-xl text-[#2D2638]"
                data-testid="subscription-current-plan"
              >
                {currentPlan === 'pro' ? 'WEDORA PRO' : 'WEDORA FREE'}
              </span>
            </div>

            <p className="text-xs text-[#6B617A] mt-1">
              {currentPlan === 'pro'
                ? 'PRO features are active.'
                : 'You are currently on the free plan.'}
            </p>
          </div>
        </div>
      </div>

      {/* Billing selector */}
      <div className="flex justify-center">
        <div
          className="liquid-glass rounded-full p-1.5 inline-flex items-center gap-1"
          data-testid="billing-toggle"
        >
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2.5 rounded-full text-sm transition ${
              billing === 'monthly'
                ? 'bg-gradient-to-r from-[#C9B8FF]/70 to-[#F7B7D8]/70 text-[#2D2638] font-medium shadow-sm'
                : 'text-[#6B617A] hover:text-[#2D2638]'
            }`}
            data-testid="billing-monthly"
          >
            Monthly
          </button>

          <button
            type="button"
            onClick={() => setBilling('yearly')}
            className={`px-5 py-2.5 rounded-full text-sm transition flex items-center gap-2 ${
              billing === 'yearly'
                ? 'bg-gradient-to-r from-[#C9B8FF]/70 to-[#F7B7D8]/70 text-[#2D2638] font-medium shadow-sm'
                : 'text-[#6B617A] hover:text-[#2D2638]'
            }`}
            data-testid="billing-yearly"
          >
            Yearly
            <span className="text-[10px] uppercase tracking-wider bg-white/70 px-2 py-0.5 rounded-full">
              Save
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const price = selectedPlan(plan);

          return (
            <div
              key={plan.id}
              className={`pearl-card relative overflow-hidden p-6 md:p-8 transition-all ${
                plan.popular
                  ? 'ring-1 ring-[#C9B8FF]/60 shadow-[0_18px_55px_rgba(201,184,255,0.18)]'
                  : ''
              }`}
              data-testid={`subscription-plan-${plan.id}`}
            >
              {/* Soft decorative glow */}
              <div
                className={`absolute -top-20 -right-20 w-44 h-44 rounded-full blur-3xl ${
                  plan.id === 'pro'
                    ? 'bg-[#C9B8FF]/20'
                    : 'bg-[#F7B7D8]/15'
                }`}
              />

              <div className="relative">
                {/* Plan top */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {plan.id === 'pro' ? (
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C9B8FF]/70 to-[#F7B7D8]/70 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-[#5E536F]" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-white/70 border border-white/80 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-[#988FA6]" />
                        </div>
                      )}

                      <div>
                        <p className="text-xs uppercase tracking-widest text-[#988FA6]">
                          {plan.badge}
                        </p>

                        <h3 className="font-display text-2xl text-[#2D2638]">
                          {plan.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {plan.popular && (
                    <span className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full bg-gradient-to-r from-[#C9B8FF]/70 to-[#F7B7D8]/70 text-[#2D2638] font-medium">
                      Recommended
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-7">
                  <div className="flex items-end gap-2">
                    <span
                      className="font-display text-5xl text-[#2D2638]"
                      data-testid={`subscription-price-${plan.id}`}
                    >
                      ₹{price.toLocaleString('en-IN')}
                    </span>

                    <span className="text-sm text-[#6B617A] mb-2">
                      /{billing === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>

                  {billing === 'yearly' && plan.id === 'pro' && (
                    <p className="text-xs text-[#6B617A] mt-2">
                      ₹5,999/year · equivalent to ₹499.92/month
                    </p>
                  )}

                  <p className="text-sm text-[#6B617A] mt-3 leading-6">
                    {plan.description}
                  </p>
                </div>

                {/* Action */}
                <div className="mt-7">
                  {isCurrent ? (
                    <div
                      className="w-full rounded-2xl px-5 py-3.5 text-center border border-[#C9B8FF]/40 bg-white/55 text-[#6B617A] text-sm font-medium"
                      data-testid={`current-plan-${plan.id}`}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        Current Plan
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchPlan(plan.id)}
                      disabled={savingPlan !== null || plan.id === 'pro'}
                      className={`w-full glow-btn flex items-center justify-center gap-2 ${
                        savingPlan === plan.id
                          ? 'opacity-70 cursor-wait'
                          : plan.id === 'pro'
                            ? 'opacity-70 cursor-not-allowed'
                            : ''
                      }`}
                      data-testid={`choose-plan-${plan.id}`}
                    >
                      {savingPlan === plan.id ? (
                        'Activating...'
                      ) : (
                        <>
                          {plan.id === 'pro'
                            ? 'PRO payment setup coming soon'
                            : 'Switch to FREE'}
                          {plan.id !== 'pro' && <ArrowRight className="w-4 h-4" />}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Features */}
                <div className="mt-8">
                  <p className="text-xs uppercase tracking-widest text-[#988FA6] mb-4">
                    Included
                  </p>

                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 text-sm text-[#4E465A]"
                      >
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-[#C9B8FF]/25 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-[#6D5F8A]" />
                        </div>

                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unavailable */}
                {plan.unavailable.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-[#E9E1F0]">
                    <p className="text-xs uppercase tracking-widest text-[#988FA6] mb-4">
                      Not included
                    </p>

                    <div className="space-y-3">
                      {plan.unavailable.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-start gap-3 text-sm text-[#9A92A4]"
                        >
                          <div className="mt-0.5 w-5 h-5 rounded-full bg-white/60 border border-[#E5DDEB] flex items-center justify-center flex-shrink-0">
                            <Lock className="w-3 h-3" />
                          </div>

                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* PRO benefits */}
      <div className="pearl-card p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C9B8FF]/60 to-[#F7B7D8]/60 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#5E536F]" />
          </div>

          <div>
            <h3 className="font-display text-2xl text-[#2D2638]">
              What PRO unlocks
            </h3>

            <p className="text-sm text-[#6B617A]">
              More visibility, more control and more wedding intelligence.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Benefit
            icon={Inbox}
            title="Client Leads"
            text="Receive enquiries directly from clients discovering your profile."
          />

          <Benefit
            icon={BarChart3}
            title="Analytics"
            text="Understand profile views, leads and WhatsApp engagement."
          />

          <Benefit
            icon={Bot}
            title="AI Assistant"
            text="Use WEDORA AI inside your wedding workspace."
          />

          <Benefit
            icon={Download}
            title="Export"
            text="Export useful wedding and procurement information."
          />
        </div>
      </div>

      {/* Demo / payment note */}
      <div className="rounded-3xl border border-dashed border-[#C9B8FF]/50 bg-white/45 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C9B8FF]/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#6D5F8A]" />
          </div>

          <div>
            <p className="text-sm font-medium text-[#2D2638]">
              Subscription preview
            </p>

            <p className="text-xs text-[#6B617A] mt-1 leading-5">
              PRO access activates only after payment is verified. Secure
              payment is not available from this screen yet, so your current
              plan remains active until PRO checkout is ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Benefit = ({ icon: Icon, title, text }) => (
  <div className="rounded-3xl border border-white/80 bg-white/50 p-5">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9B8FF]/35 to-[#F7B7D8]/35 flex items-center justify-center mb-4">
      <Icon className="w-4 h-4 text-[#6D5F8A]" />
    </div>

    <h4 className="font-heading font-semibold text-[#2D2638]">
      {title}
    </h4>

    <p className="text-xs text-[#6B617A] mt-1.5 leading-5">
      {text}
    </p>
  </div>
);

export default SubscriptionTab;
