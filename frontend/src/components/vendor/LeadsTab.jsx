import React, { useEffect, useState } from 'react';
import { apiVendorLeads, apiUpdateLead, fmtApiError } from '@/lib/auth';
import { toast } from 'sonner';
import { Phone, MessageCircle, CheckCircle2, Archive, CalendarDays, MapPin, Users, IndianRupee } from 'lucide-react';

const STATUS_STYLE = {
  new: 'bg-gradient-to-r from-[#F7B7D8]/40 to-[#C9B8FF]/40 text-[#2D2638] border-pink-200/70',
  contacted: 'bg-[#A9E8F4]/40 text-[#2D2638] border-white/80',
  closed: 'bg-white/60 text-[#988FA6] border-white/80',
};

export const LeadsTab = ({ vendor }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await apiVendorLeads(); setLeads(r.leads || []); }
    catch (e) { toast.error(fmtApiError(e.response?.data?.detail, 'Could not load leads')); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    try {
      await apiUpdateLead(id, status);
      setLeads((ls) => ls.map((l) => l.id === id ? { ...l, status } : l));
      toast.success(`Lead marked as ${status}`);
    } catch (e) { toast.error('Could not update lead'); }
  };

  return (
    <div className="pearl-card p-6 md:p-8" data-testid="leads-tab">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-lg text-[#2D2638]">Leads</h3>
        <span className="chip !text-xs">{leads.filter((l) => l.status === 'new').length} new</span>
      </div>

      {loading ? <p className="text-[#6B617A] text-sm">Loading leads…</p> : leads.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#C9B8FF]/60 bg-white/50 p-10 text-center text-[#6B617A]">
          <p>No leads yet. Couples who click <b>Request Quote</b> on your public profile will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((l) => (
            <div key={l.id} data-testid={`lead-card-${l.id}`} className="rounded-3xl border border-white/70 bg-white/70 backdrop-blur p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {l.status === 'new' && <span className="text-[10px] font-semibold tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-[#F7B7D8] to-[#C9B8FF] text-[#2D2638]">NEW LEAD</span>}
                    <h4 className="font-heading font-semibold text-[#2D2638]">{l.name}</h4>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6B617A]">
                    {l.wedding_date && <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{l.wedding_date}</span>}
                    {l.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{l.city}</span>}
                    {l.guest_count != null && <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{l.guest_count} guests</span>}
                    {l.budget && <span className="inline-flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />{l.budget}</span>}
                  </div>
                  {l.required_service && <p className="text-sm text-[#4a4257] mt-2"><b>Requirement:</b> {l.required_service}</p>}
                  {l.functions && <p className="text-sm text-[#4a4257]"><b>Functions:</b> {l.functions}</p>}
                  {l.theme && <p className="text-sm text-[#4a4257]"><b>Theme:</b> {l.theme}</p>}
                  {l.message && <p className="text-sm text-[#4a4257] mt-2 italic">“{l.message}”</p>}
                </div>
                <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_STYLE[l.status] || STATUS_STYLE.new}`} data-testid={`lead-status-${l.id}`}>{l.status}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <a data-testid={`lead-contact-${l.id}`} href={`tel:${l.phone}`} className="chip !text-xs inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Contact</a>
                <a data-testid={`lead-whatsapp-${l.id}`} href={`https://wa.me/${(l.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${l.name}, this is ${vendor.business_name} from WEDORA — thanks for your inquiry!`)}`} target="_blank" rel="noreferrer" className="chip !text-xs inline-flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</a>
                {l.status === 'new' && (
                  <button data-testid={`lead-contacted-${l.id}`} onClick={() => setStatus(l.id, 'contacted')} className="chip !text-xs inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Mark as Contacted</button>
                )}
                {l.status !== 'closed' && (
                  <button data-testid={`lead-closed-${l.id}`} onClick={() => setStatus(l.id, 'closed')} className="chip !text-xs inline-flex items-center gap-1.5"><Archive className="w-3.5 h-3.5" /> Mark as Closed</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadsTab;
