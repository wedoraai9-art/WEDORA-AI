import React, { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Plus, Users, Wallet, Heart } from 'lucide-react';
import { authAxios } from '@/lib/auth';

const WeddingsTab = ({ vendor }) => {
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    wedding_name: '',
    bride_name: '',
    groom_name: '',
    wedding_date: '',
    city: '',
    venue: '',
    guest_count: '',
    budget: '',
    notes: '',
    status: 'upcoming',
  });

  const loadWeddings = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get('/vendor/weddings');
      setWeddings(res.data.weddings || []);
    } catch (err) {
      setError('Could not load weddings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeddings();
  }, []);

  const createWedding = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
    const response = await authAxios.post('/vendor/weddings', {
  ...form,
  guest_count: form.guest_count ? Number(form.guest_count) : null,
  budget: form.budget ? Number(form.budget) : null,
});

      setForm({
        wedding_name: '',
        bride_name: '',
        groom_name: '',
        wedding_date: '',
        city: '',
        venue: '',
        guest_count: '',
        budget: '',
        notes: '',
        status: 'upcoming',
      });

     setShowForm(false);
     await loadWeddings();
    } catch (err) {
      const detail = err.response?.data?.detail;

     if (detail?.code === 'WEDDING_LIMIT_REACHED') {
        setError(
          detail.message ||
          `You've reached your FREE plan limit of ${detail.limit || 3} weddings.`
        );
      } else {
        setError(
          detail?.message ||
          (typeof detail === 'string' ? detail : 'Could not create wedding.')
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const weddingLimit = vendor?.plan === 'pro' ? null : 3;
  const remaining =
    weddingLimit === null
      ? null
      : Math.max(weddingLimit - weddings.length, 0);

  return (
    <div className="space-y-6" data-testid="weddings-tab">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#988FA6]">
            Your Wedding Workspace
          </p>
          <h2 className="font-display text-3xl text-[#2D2638] mt-1">
            Weddings
          </h2>
          <p className="text-sm text-[#6B617A] mt-1">
            Manage every wedding you're working on from one place.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          disabled={remaining === 0}
          className="glow-btn inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          New Wedding
        </button>
      </div>

      {/* Plan usage */}
      <div className="pearl-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#988FA6]">
              Wedding Workspace
            </p>

            <p className="font-heading font-semibold text-[#2D2638] mt-1">
              {weddings.length}
              {weddingLimit !== null ? ` / ${weddingLimit}` : ''}
              {' '}weddings
            </p>
          </div>

          {vendor?.plan === 'pro' ? (
            <span className="chip">
              PRO · Unlimited
            </span>
          ) : (
            <span className="chip">
              FREE · {remaining} remaining
            </span>
          )}
        </div>

        {weddingLimit !== null && (
          <div className="mt-4 h-2 rounded-full bg-white/70 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C9B8FF] via-[#F7B7D8] to-[#A9E8FF]"
              style={{
                width: `${Math.min(
                  (weddings.length / weddingLimit) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-3xl border border-[#F7B7D8]/60 bg-white/70 p-5">
          <p className="text-sm text-[#6B617A]">{error}</p>

          {remaining === 0 && vendor?.plan !== 'pro' && (
            <button
              onClick={() => window.dispatchEvent(
                new CustomEvent('wedora:goto-tab', {
                  detail: 'subscription',
                })
              )}
              className="glow-btn !py-2 !px-5 !text-sm mt-4"
            >
              Upgrade to PRO
            </button>
          )}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={createWedding}
          className="pearl-card p-6 md:p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-semibold text-xl text-[#2D2638]">
                Create Wedding
              </h3>
              <p className="text-sm text-[#6B617A] mt-1">
                Add the basic details for this wedding.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="chip"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input
              required
              placeholder="Wedding / Project Name"
              value={form.wedding_name}
              onChange={(e) =>
                setForm({ ...form, wedding_name: e.target.value })
              }
              className="input"
            />

            <input
              required
              placeholder="Bride Name"
              value={form.bride_name}
              onChange={(e) =>
                setForm({ ...form, bride_name: e.target.value })
              }
              className="input"
            />

            <input
              required
              placeholder="Groom Name"
              value={form.groom_name}
              onChange={(e) =>
                setForm({ ...form, groom_name: e.target.value })
              }
              className="input"
            />

            <input
              type="date"
              value={form.wedding_date}
              onChange={(e) =>
                setForm({ ...form, wedding_date: e.target.value })
              }
              className="input"
            />

            <input
              placeholder="City"
              value={form.city}
              onChange={(e) =>
                setForm({ ...form, city: e.target.value })
              }
              className="input"
            />

            <input
              placeholder="Venue"
              value={form.venue}
              onChange={(e) =>
                setForm({ ...form, venue: e.target.value })
              }
              className="input"
            />

            <input
              type="number"
              placeholder="Guest Count"
              value={form.guest_count}
              onChange={(e) =>
                setForm({ ...form, guest_count: e.target.value })
              }
              className="input"
            />

            <input
              type="number"
              placeholder="Wedding Budget"
              value={form.budget}
              onChange={(e) =>
                setForm({ ...form, budget: e.target.value })
              }
              className="input"
            />

            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
              className="input"
            >
              <option value="upcoming">Upcoming</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="attention">Needs Attention</option>
            </select>

            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) =>
                setForm({ ...form, notes: e.target.value })
              }
              className="input min-h-[44px]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="glow-btn mt-6 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Wedding'}
          </button>
        </form>
      )}

      {/* Wedding cards */}
      {loading ? (
        <div className="pearl-card p-10 text-center text-[#6B617A]">
          Loading weddings...
        </div>
      ) : weddings.length === 0 ? (
        <div className="pearl-card p-10 text-center">
          <Heart className="w-8 h-8 mx-auto text-[#C9B8FF] mb-3" />

          <h3 className="font-heading font-semibold text-lg text-[#2D2638]">
            No weddings yet
          </h3>

          <p className="text-sm text-[#6B617A] mt-1">
            Create your first wedding workspace to start managing the project.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {weddings.map((wedding) => (
            <div
              key={wedding.id}
              className="pearl-card p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#988FA6]">
                    {wedding.status?.replace('_', ' ')}
                  </p>

                  <h3 className="font-heading font-semibold text-xl text-[#2D2638] mt-1">
                    {wedding.wedding_name}
                  </h3>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-[#6B617A]">

                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#F58D91]" />
                  {wedding.bride_name} & {wedding.groom_name}
                </div>

                {wedding.wedding_date && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    {wedding.wedding_date}
                  </div>
                )}

                {(wedding.city || wedding.venue) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {[wedding.venue, wedding.city]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}

                {wedding.guest_count && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {wedding.guest_count} guests
                  </div>
                )}

                {wedding.budget && (
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    ₹{Number(wedding.budget).toLocaleString('en-IN')}
                  </div>
                )}
              </div>

              <button
                className="chip !text-sm mt-5"
                onClick={() => onOpenWedding(wedding)}
                  // Wedding detail workspace will be added next.
                }}
              >
                Open Wedding
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeddingsTab;
