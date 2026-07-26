import { X, MapPin, Mail, Phone, Linkedin, Briefcase } from 'lucide-react';
import { Badge } from 'src/common/components/Badge';
import { OutreachTimeline } from 'src/components/OutreachTimeline';
import { OutreachStatusCell } from 'src/common/components/DataTable/components';

function ContactRow({ icon: Icon, value, empty }) {
  return (
    <div className="flex items-center gap-2.5 h-9">
      <Icon size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
      <span
        className="text-[13px]"
        style={value ? { color: 'var(--text-primary)', fontWeight: 500 } : { color: 'var(--text-tertiary)', fontStyle: 'italic' }}
      >
        {value || empty}
      </span>
    </div>
  );
}

export function LeadDetailSidebar({ lead, onClose }) {
  if (!lead) return null;

  const statusTone =
    lead.scrapingStatus === 'complete' ? 'success'
    : lead.scrapingStatus === 'partial' ? 'warning'
    : lead.scrapingStatus === 'failed' ? 'danger'
    : 'neutral';

  const statusLabel =
    lead.scrapingStatus === 'complete' ? 'Complete'
    : lead.scrapingStatus === 'partial' ? 'Partial'
    : lead.scrapingStatus === 'failed' ? 'Failed'
    : lead.scrapingStatus;

  const initials = (lead.name || '').charAt(0).toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-[50]"
        style={{ background: 'rgba(20,20,28,0.18)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="absolute right-0 top-0 bottom-0 z-[60] flex flex-col w-[400px] h-full overflow-hidden"
        style={{
          background: 'var(--glass-thick)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderLeft: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-xl)',
          animation: 'sidebar-slide 320ms cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div
          className="flex items-center justify-between px-5 shrink-0 border-b border-[var(--separator)]"
          style={{ height: 60, background: 'var(--glass-chrome)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
        >
          <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Lead profile</span>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-[9px] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Avatar + Name */}
          <div className="flex items-start gap-3.5 mb-4">
            <div
              className="w-14 h-14 rounded-[14px] grid place-items-center text-white text-[22px] font-bold shrink-0"
              style={{ background: 'var(--brand-gradient-vivid)' }}
            >
              {lead.avatar ? (
                <img src={lead.avatar} alt={lead.name} className="w-14 h-14 rounded-[14px] object-cover" />
              ) : initials}
            </div>
            <div className="min-w-0 pt-1">
              <h2 className="text-[19px] font-bold tracking-[-0.014em] text-[var(--text-primary)] leading-tight">{lead.name}</h2>
              <p className="text-[13.5px] text-[var(--text-secondary)] mt-0.5">
                {lead.title}{lead.company ? ` · ${lead.company}` : ''}
              </p>
              {lead.location && (
                <p className="flex items-center gap-1 text-[12.5px] text-[var(--text-tertiary)] mt-1">
                  <MapPin size={13} /> {lead.location}
                </p>
              )}
            </div>
          </div>

          {lead.headline && (
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-4">{lead.headline}</p>
          )}

          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <OutreachStatusCell outreach={lead.outreach} />
            {lead.connectionDegree && (
              <Badge tone="neutral">{lead.connectionDegree} degree</Badge>
            )}
            {lead.scrapingStatus && (
              <Badge tone={statusTone} dot>{statusLabel}</Badge>
            )}
            {lead.badges?.map((badge) => (
              <Badge key={badge} tone="primary">{badge}</Badge>
            ))}
          </div>

          {/* AI Summary */}
          {lead.aiSummary && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">AI Summary</h4>
                <Badge tone="accent">Beta</Badge>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{lead.aiSummary}</p>
            </div>
          )}

          {/* Signals */}
          {lead.signals?.length > 0 && (
            <div className="mb-5">
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)] mb-2">Key signals</h4>
              <ul className="flex flex-col gap-1.5">
                {lead.signals.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--green)' }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Outreach activity — what we've actually sent this person, and when */}
          <OutreachTimeline
            personId={lead._id || lead.id}
            profileUrl={lead.linkedInUrl || lead.profileUrl}
          />

          {/* Contact */}
          <h4 className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)] mb-2">Contact</h4>
          <div className="flex flex-col mb-5">
            <ContactRow icon={Mail} value={lead.email} empty="No email — enrich to reveal" />
            <ContactRow icon={Phone} value={lead.phone} empty="No phone on file" />
            {lead.linkedin && (
              <div className="flex items-center gap-2.5 h-9">
                <Linkedin size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <a
                  href={lead.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-semibold"
                  style={{ color: 'var(--brand-purple)' }}
                >
                  View profile
                </a>
              </div>
            )}
          </div>

          {/* Experience */}
          {lead.experiences?.length > 0 && (
            <div className="mb-5">
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)] mb-2.5">Experience</h4>
              <div className="flex flex-col gap-3">
                {lead.experiences.map((exp, i) => (
                  <div key={i} className="flex gap-3">
                    <span
                      className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
                      style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}
                    >
                      <Briefcase size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold text-[var(--text-primary)]">{exp.title}</div>
                      <div className="text-[12.5px] text-[var(--text-secondary)]">{exp.company}</div>
                      {(exp.startDate || exp.duration) && (
                        <div className="text-[11.5px] text-[var(--text-tertiary)]">
                          {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}{exp.duration ? ` · ${exp.duration}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes sidebar-slide {
          from { transform: translateX(24px); opacity: 0; }
          to   { transform: none; opacity: 1; }
        }
      `}</style>
    </>
  );
}
