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
  CalendarDays,
  MapPin,
  Users,
  IndianRupee,
  Lock,
  Sparkles,
  Clock,
  FileText,
  ChevronDown,
} from 'lucide-react';

const LEAD_STAGES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'lost', label: 'Lost' },
];

const STATUS_STYLE = {
  new: 'bg-gradient-to-r from-[#F7B7D8]/40 to-[#C9B8FF]/40 text-[#2D2638] border-pink-200/70',
  contacted: 'bg-[#A9E8F4]/40 text-[#2D2638] border-white/80',
  proposal_sent: 'bg-[#C9B8FF]/30 text-[#4D3D65] border-[#C9B8FF]/50',
  negotiation: 'bg-[#F7B7D8]/30 text-[#69435B] border-[#F7B7D8]/50',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  lost: 'bg-white/60 text-[#988FA6] border-white/80',
};

const getLeadValue = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');

const LeadDetail = ({ icon: Icon, label, value }) => {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label ? `${label}: ` : ''}{value}</span>
    </span>
  );
};

export const LeadsTab = ({ vendor }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const isPro = String(vendor?.plan || 'free').toLowerCase() === 'pro';

  const load = useCallback(async () => {
    if (!isPro) {
      setLeads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiVendorLeads();
      const nextLeads = Array.isArray(response?.leads) ? response.leads : [];
      setLeads(nextLeads);
    } catch (error) {
      toast.error(fmtApiError(error?.response?.data?.detail, 'Could not load leads'));
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [isPro]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    if (!isPro || !id || updatingId) return;
    const stageLabel = LEAD_STAGES.find((stage) => stage.value === status)?.label || status;
    setUpdatingId(id);
    try {
      await apiUpdateLead(id, status);
      setLeads((currentLeads) => currentLeads.map((lead) => lead.id === id ? { ...lead, status } : lead));
      toast.success(`Lead moved to ${stageLabel}`);
    } catch (error) {
      toast.error(fmtApiError(error?.response?.data?.detail, 'Could not update lead'));
    } finally {
      setUpdatingId(null);
    }
  };

  const getWhatsAppUrl = (lead) => {
    const phone = String(lead?.phone || '').replace(/[^0-9]/g, '');
    if (!phone) return '#';
    const message = encodeURIComponent(`Hi ${lead?.name || 'there'}, this is ${vendor?.business_name || 'a WEDORA vendor'} from WEDORA — thanks for your inquiry!`);
    return `https://wa.me/${phone}?text=${message}`;
  };

  const newLeadCount = leads.filter((lead) => (lead.status || 'new') === 'new').length;
  const getStageLabel = (status) => LEAD_STAGES.find((stage) => stage.value === status)?.label || 'New';

  return (
    <div className="pearl-card p-6 md:p-8" data-testid="leads-tab">
      {!isPro ? (
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-br from-[#C9B8FF]/40 to-[#F7B7D8]/40 border border-white/80 flex items-center justify-center shadow-sm">
            <Lock className="w-7 h-7 text-[#2D2638]" />
          </div>
          <p className="mt-5 font-heading font-semibold text-lg text-[#2D2638]">Leads are a PRO feature</p>
          <p className="mt-2 max-w-md mx-auto text-sm leading-6 text-[#6B617A]">
            Client enquiries and lead management are available to PRO vendors after payment is verified. Your FREE public profile and portfolio remain available.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 chip !text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            PRO access starts after verified payment
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-heading font-semibold text-lg text-[#2D2638]">Leads</h3>
              <p className="text-sm text-[#6B617A] mt-1">Move each enquiry through your booking process.</p>
            </div>
            <span className="chip !text-xs">{newLeadCount} new</span>
          </div>

          {loading ? (
            <p className="text-[#6B617A] text-sm">Loading leads…</p>
          ) : leads.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#C9B8FF]/60 bg-white/50 p-10 text-center text-[#6B617A]">
              <p>No leads yet. Couples who click <b>Request Quote</b> on your public profile will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map((lead) => {
                const isUpdating = updatingId === lead.id;
                const status = LEAD_STAGES.some((stage) => stage.value === lead.status) ? lead.status : 'new';
                const followUpDate = getLeadValue(lead.follow_up_date, lead.followup_date);
                const leadSource = getLeadValue(lead.lead_source, lead.source);
                const location = getLeadValue(lead.city, lead.location);
                const requirement = getLeadValue(lead.required_service, lead.requirements, lead.requirement);
                const eventDate = getLeadValue(lead.wedding_date, lead.event_date);
                const guestCount = getLeadValue(lead.guest_count, lead.guests);

                return (
                  <div key={lead.id} data-testid={`lead-card-${lead.id}`} className="rounded-3xl border border-white/70 bg-white/70 backdrop-blur p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {status === 'new' && <span className="text-[10px] font-semibold tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-[#F7B7D8] to-[#C9B8FF] text-[#2D2638]">NEW LEAD</span>}
                          <h4 className="font-heading font-semibold text-[#2D2638]">{lead.name || 'Unnamed lead'}</h4>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6B617A]">
                          <LeadDetail icon={CalendarDays} value={eventDate} />
                          <LeadDetail icon={MapPin} value={location} />
                          <LeadDetail icon={Users} value={guestCount != null ? `${guestCount} guests` : null} />
                          <LeadDetail icon={IndianRupee} value={lead.budget} />
                          <LeadDetail icon={FileText} label="Source" value={leadSource} />
                          <LeadDetail icon={Clock} label="Follow-up" value={followUpDate} />
                        </div>

                        {requirement && <p className="text-sm text-[#4a4257] mt-2"><b>Requirement:</b> {requirement}</p>}
                        {lead.functions && <p className="text-sm text-[#4a4257]"><b>Functions:</b> {lead.functions}</p>}
                        {lead.theme && <p className="text-sm text-[#4a4257]"><b>Theme:</b> {lead.theme}</p>}
                        {lead.message && <p className="text-sm text-[#4a4257] mt-2 italic">“{lead.message}”</p>}
                        {lead.notes && <p className="text-sm text-[#4a4257] mt-2"><b>Notes:</b> {lead.notes}</p>}
                      </div>

                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_STYLE[status] || STATUS_STYLE.new}`} data-testid={`lead-status-${lead.id}`}>
                          {getStageLabel(status)}
                        </span>
                        <label className="sr-only" htmlFor={`lead-stage-${lead.id}`}>Lead stage</label>
                        <div className="relative">
                          <select id={`lead-stage-${lead.id}`} data-testid={`lead-stage-select-${lead.id}`} value={status} onChange={(event) => setStatus(lead.id, event.target.value)} disabled={isUpdating} className="appearance-none rounded-xl border border-[#eadff2] bg-white px-3 py-2 pr-9 text-xs text-[#4a4257] disabled:opacity-60">
                            {LEAD_STAGES.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#988FA6]" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <a data-testid={`lead-contact-${lead.id}`} href={lead.phone ? `tel:${lead.phone}` : undefined} onClick={(event) => { if (!lead.phone) { event.preventDefault(); toast.error('This lead does not have a phone number.'); } }} className="chip !text-xs inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Contact
                      </a>
                      <a data-testid={`lead-whatsapp-${lead.id}`} href={getWhatsAppUrl(lead)} target="_blank" rel="noreferrer" onClick={(event) => { if (!lead.phone) { event.preventDefault(); toast.error('This lead does not have a WhatsApp number.'); } }} className="chip !text-xs inline-flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeadsTab;
