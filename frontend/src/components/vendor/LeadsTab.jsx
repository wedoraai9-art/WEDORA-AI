import React, { useCallback, useEffect, useState } from 'react';
import {
  apiVendorLeads,
  apiUpdateLead,
  fmtApiError,
} from '@/lib/auth';
import { toast } from 'sonner';
import {
  Phone,
  MessageCircle,
  CheckCircle2,
  Archive,
  CalendarDays,
  MapPin,
  Users,
  IndianRupee,
} from 'lucide-react';

const STATUS_STYLE = {
  new: 'bg-gradient-to-r from-[#F7B7D8]/40 to-[#C9B8FF]/40 text-[#2D2638] border-pink-200/70',
  contacted: 'bg-[#A9E8F4]/40 text-[#2D2638] border-white/80',
  closed: 'bg-white/60 text-[#988FA6] border-white/80',
};

export const LeadsTab = ({ vendor }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await apiVendorLeads();
      const nextLeads = Array.isArray(response?.leads)
        ? response.leads
        : [];

      setLeads(nextLeads);
    } catch (error) {
      toast.error(
        fmtApiError(
          error?.response?.data?.detail,
          'Could not load leads'
        )
      );
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    if (!id || updatingId) return;

    setUpdatingId(id);

    try {
      await apiUpdateLead(id, status);

      setLeads((currentLeads) =>
        currentLeads.map((lead) =>
          lead.id === id
            ? { ...lead, status }
            : lead
        )
      );

      toast.success(`Lead marked as ${status}`);
    } catch (error) {
      toast.error(
        fmtApiError(
          error?.response?.data?.detail,
          'Could not update lead'
        )
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const getWhatsAppUrl = (lead) => {
    const phone = String(lead?.phone || '').replace(
      /[^0-9]/g,
      ''
    );

    if (!phone) return '#';

    const message = encodeURIComponent(
      `Hi ${lead?.name || 'there'}, this is ${
        vendor?.business_name || 'a WEDORA vendor'
      } from WEDORA — thanks for your inquiry!`
    );

    return `https://wa.me/${phone}?text=${message}`;
  };

  const newLeadCount = leads.filter(
    (lead) => lead.status === 'new'
  ).length;

  return (
    <div
      className="pearl-card p-6 md:p-8"
      data-testid="leads-tab"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-lg text-[#2D2638]">
          Leads
        </h3>

        <span className="chip !text-xs">
          {newLeadCount} new
        </span>
      </div>

      {loading ? (
        <p className="text-[#6B617A] text-sm">
          Loading leads…
        </p>
      ) : leads.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#C9B8FF]/60 bg-white/50 p-10 text-center text-[#6B617A]">
          <p>
            No leads yet. Couples who click{' '}
            <b>Request Quote</b> on your public profile will
            appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => {
            const isUpdating = updatingId === lead.id;

            return (
              <div
                key={lead.id}
                data-testid={`lead-card-${lead.id}`}
                className="rounded-3xl border border-white/70 bg-white/70 backdrop-blur p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {lead.status === 'new' && (
                        <span className="text-[10px] font-semibold tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-[#F7B7D8] to-[#C9B8FF] text-[#2D2638]">
                          NEW LEAD
                        </span>
                      )}

                      <h4 className="font-heading font-semibold text-[#2D2638]">
                        {lead.name || 'Unnamed lead'}
                      </h4>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6B617A]">
                      {lead.wedding_date && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {lead.wedding_date}
                        </span>
                      )}

                      {lead.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {lead.city}
                        </span>
                      )}

                      {lead.guest_count != null && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {lead.guest_count} guests
                        </span>
                      )}

                      {lead.budget && (
                        <span className="inline-flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {lead.budget}
                        </span>
                      )}
                    </div>

                    {lead.required_service && (
                      <p className="text-sm text-[#4a4257] mt-2">
                        <b>Requirement:</b>{' '}
                        {lead.required_service}
                      </p>
                    )}

                    {lead.functions && (
                      <p className="text-sm text-[#4a4257]">
                        <b>Functions:</b> {lead.functions}
                      </p>
                    )}

                    {lead.theme && (
                      <p className="text-sm text-[#4a4257]">
                        <b>Theme:</b> {lead.theme}
                      </p>
                    )}

                    {lead.message && (
                      <p className="text-sm text-[#4a4257] mt-2 italic">
                        “{lead.message}”
                      </p>
                    )}
                  </div>

                  <span
                    className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                      STATUS_STYLE[lead.status] ||
                      STATUS_STYLE.new
                    }`}
                    data-testid={`lead-status-${lead.id}`}
                  >
                    {lead.status || 'new'}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    data-testid={`lead-contact-${lead.id}`}
                    href={
                      lead.phone
                        ? `tel:${lead.phone}`
                        : undefined
                    }
                    onClick={(event) => {
                      if (!lead.phone) {
                        event.preventDefault();
                        toast.error(
                          'This lead does not have a phone number.'
                        );
                      }
                    }}
                    className="chip !text-xs inline-flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Contact
                  </a>

                  <a
                    data-testid={`lead-whatsapp-${lead.id}`}
                    href={getWhatsAppUrl(lead)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => {
                      if (!lead.phone) {
                        event.preventDefault();
                        toast.error(
                          'This lead does not have a WhatsApp number.'
                        );
                      }
                    }}
                    className="chip !text-xs inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>

                  {lead.status === 'new' && (
                    <button
                      type="button"
                      data-testid={`lead-contacted-${lead.id}`}
                      onClick={() =>
                        setStatus(lead.id, 'contacted')
                      }
                      disabled={isUpdating}
                      className="chip !text-xs inline-flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isUpdating
                        ? 'Updating…'
                        : 'Mark as Contacted'}
                    </button>
                  )}

                  {lead.status !== 'closed' && (
                    <button
                      type="button"
                      data-testid={`lead-closed-${lead.id}`}
                      onClick={() =>
                        setStatus(lead.id, 'closed')
                      }
                      disabled={isUpdating}
                      className="chip !text-xs inline-flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      {isUpdating
                        ? 'Updating…'
                        : 'Mark as Closed'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeadsTab;
