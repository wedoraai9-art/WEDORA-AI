import React, { useState } from 'react';
import { BUDGET } from '@/constants/testIds';
import { estimateBudget } from '@/lib/aiService';
import { Calculator } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const COLORS = ['#C9B8FF','#F7B7D8','#A9E8FF','#F5A9B8','#FFF8EF','#F58D91','#A9E8F4','#D9CBFF','#FAD1E0','#EAB8FF'];

export const BudgetPlanner = () => {
  const [total, setTotal] = useState(1500000);
  const [guests, setGuests] = useState(200);
  const [city, setCity] = useState('Jaipur');
  const [functions, setFunctions] = useState(3);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const calc = async () => {
    setLoading(true);
    try {
      const r = await estimateBudget({ total_budget: Number(total), guest_count: Number(guests), city, functions: Number(functions) });
      setData(r);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  return (
    <section id="budget" data-testid={BUDGET.section} className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <p className="font-heading uppercase tracking-[0.3em] text-xs text-[#988FA6] mb-4">Budget Planner</p>
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#2D2638] leading-tight">
          Your Dream Wedding.<br />
          Your Budget. <span className="iridescent-text italic">One Smart Plan.</span>
        </h2>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input card */}
        <div className="pearl-card p-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2">
              <span className="text-xs uppercase tracking-widest text-[#988FA6]">Wedding Budget (₹)</span>
              <input
                data-testid={BUDGET.totalInput}
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="mt-1 w-full rounded-2xl px-4 py-2.5 bg-white/70 border border-white/80 outline-none focus:border-pink-300 text-[#2D2638]"
              />
              <input type="range" min="200000" max="10000000" step="100000" value={total} onChange={(e) => setTotal(Number(e.target.value))} className="w-full mt-2 accent-[#F7B7D8]" />
              <p className="text-sm text-[#6B617A] mt-1">{fmt(Number(total))}</p>
            </label>
            <label>
              <span className="text-xs uppercase tracking-widest text-[#988FA6]">Guests</span>
              <input data-testid={BUDGET.guestsInput} type="number" value={guests} onChange={(e) => setGuests(e.target.value)}
                className="mt-1 w-full rounded-2xl px-4 py-2.5 bg-white/70 border border-white/80 outline-none focus:border-pink-300 text-[#2D2638]" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-widest text-[#988FA6]">City</span>
              <input data-testid={BUDGET.cityInput} value={city} onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-2xl px-4 py-2.5 bg-white/70 border border-white/80 outline-none focus:border-pink-300 text-[#2D2638]" />
            </label>
            <label className="col-span-2">
              <span className="text-xs uppercase tracking-widest text-[#988FA6]">Number of Functions</span>
              <input data-testid={BUDGET.functionsInput} type="number" min="1" max="7" value={functions} onChange={(e) => setFunctions(e.target.value)}
                className="mt-1 w-full rounded-2xl px-4 py-2.5 bg-white/70 border border-white/80 outline-none focus:border-pink-300 text-[#2D2638]" />
            </label>
          </div>
          <button data-testid={BUDGET.calcBtn} onClick={calc} disabled={loading} className="glow-btn w-full mt-5 flex items-center justify-center gap-2 disabled:opacity-60">
            <Calculator className="w-4 h-4" /> {loading ? 'Calculating…' : 'Build My Budget'}
          </button>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {!data ? (
            <div className="pearl-card p-10 h-full flex items-center justify-center text-center text-[#6B617A]">
              <div>
                <div className="thinking-orb mx-auto mb-4" />
                <p>Set your budget above and WEDORA will lay out a beautiful, itemized plan.</p>
              </div>
            </div>
          ) : (
            <div data-testid={BUDGET.result} className="pearl-card p-6">
              <div className="flex flex-wrap items-center justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#988FA6]">Total Budget</p>
                  <p className="font-display text-3xl text-[#2D2638]">{fmt(data.total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#988FA6]">{data.guest_count} guests • {data.city} • {data.functions} functions</p>
                  <p className="text-xs text-[#6B617A] mt-1">~{fmt(data.per_head)} food per head</p>
                </div>
              </div>

              {/* Stacked bar */}
              <div className="h-3 w-full rounded-full overflow-hidden flex border border-white/60">
                {data.categories.map((c, i) => (
                  <div key={c.name} title={`${c.name} ${c.percent}%`} style={{ width: `${c.percent}%`, background: COLORS[i % COLORS.length] }} />
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                {data.categories.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3 rounded-2xl p-3 bg-white/60 border border-white/70">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2D2638] truncate">{c.name}</p>
                      <p className="text-xs text-[#988FA6] truncate">{c.note}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#2D2638]">{fmt(c.amount)}</p>
                      <p className="text-xs text-[#988FA6]">{c.percent}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BudgetPlanner;
