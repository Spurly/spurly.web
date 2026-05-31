import { X, Briefcase, MapPin, Clock, Mail, Phone, Linkedin, ExternalLink } from 'lucide-react';
import { Badge } from 'src/common/components/Badge';
import { useNavigate } from 'react-router-dom';

export function LeadDetailSidebar({ lead, onClose }) {
  const navigate = useNavigate();
  if (!lead) return null;

  return (
    <div className="w-96 bg-white border-l border-spurly-border flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-spurly-border flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-dashboard-title font-bold text-spurly-navy-light">{lead.name}</h3>
          <p className="text-label text-spurly-text-secondary mt-1">{lead.title}</p>
          <p className="text-label text-spurly-text-secondary">{lead.location}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
            className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition"
            title="Open full profile"
          >
            <ExternalLink size={20} className="text-spurly-text-secondary hover:text-spurly-navy-light" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-spurly-surface-bg rounded-spurly transition"
          >
            <X size={20} className="text-spurly-text-secondary" />
          </button>
        </div>
      </div>

      {/* Profile Avatar */}
      <div className="px-6 py-4 border-b border-spurly-border">
        <div className="flex items-center gap-4">
          <img
            src={lead.avatar}
            alt={lead.name}
            className="w-16 h-16 rounded-spurly object-cover"
          />
          <div>
            <div className="flex gap-2 mb-2">
              {lead.badges?.map((badge) => (
                <Badge key={badge} variant="primary">
                  {badge}
                </Badge>
              ))}
            </div>
            <div className="text-label font-medium text-spurly-navy-light">{lead.company}</div>
          </div>
        </div>
      </div>

      {/* AI Score Section */}
      <div className="px-6 py-4 border-b border-spurly-border">
        <div className="mb-4">
          <p className="text-label font-semibold text-spurly-text-secondary mb-2">AI Score</p>
          <div className="flex items-baseline gap-2">
            <div className="text-section-heading font-bold text-spurly-navy-light">{lead.aiScore}</div>
            <p className="text-label font-semibold text-spurly-success">{lead.aiGrade}</p>
          </div>
        </div>
        <div className="space-y-2">
          {lead.signals?.map((signal) => (
            <div key={signal} className="flex items-center gap-2 text-label text-spurly-text-secondary">
              <span className="w-2 h-2 rounded-full bg-spurly-success"></span>
              {signal}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-spurly-border px-6">
        <button className="text-label font-semibold text-spurly-navy-light border-b-2 border-spurly-purple pb-4 px-4">
          Overview
        </button>
        <button className="text-label font-semibold text-spurly-text-secondary hover:text-spurly-navy-light pb-4 px-4">
          Contact & Enrichment
        </button>
        <button className="text-label font-semibold text-spurly-text-secondary hover:text-spurly-navy-light pb-4 px-4">
          Company
        </button>
        <button className="text-label font-semibold text-spurly-text-secondary hover:text-spurly-navy-light pb-4 px-4">
          Activity
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-6 flex-1 overflow-y-auto">
        {/* AI Summary */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-label font-bold text-spurly-navy-light">AI Summary</h4>
            <Badge variant="primary">BETA</Badge>
          </div>
          <p className="text-body text-spurly-text-secondary leading-relaxed">
            {lead.aiSummary}
          </p>
        </div>

        {/* Key Signals */}
        <div>
          <h4 className="text-label font-bold text-spurly-navy-light mb-3">Key Signals</h4>
          <ul className="space-y-2">
            {lead.keySignals?.map((signal, idx) => (
              <li key={idx} className="flex items-start gap-2 text-label text-spurly-text-secondary">
                <span className="text-spurly-success mt-1">•</span>
                {signal}
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Info */}
        <div>
          <h4 className="text-label font-bold text-spurly-navy-light mb-3">Quick Info</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-spurly-text-secondary flex-shrink-0" />
              <div>
                <p className="text-label text-spurly-text-secondary">Email</p>
                <p className="text-label font-medium text-spurly-navy-light">{lead.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-spurly-text-secondary flex-shrink-0" />
              <div>
                <p className="text-label text-spurly-text-secondary">Phone</p>
                <p className="text-label font-medium text-spurly-navy-light">{lead.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Linkedin size={16} className="text-spurly-text-secondary flex-shrink-0" />
              <div>
                <p className="text-label text-spurly-text-secondary">LinkedIn</p>
                <a href={lead.linkedin} className="text-label font-medium text-spurly-purple hover:text-spurly-blue transition">
                  View Profile
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-spurly-text-secondary flex-shrink-0" />
              <div>
                <p className="text-label text-spurly-text-secondary">Location</p>
                <p className="text-label font-medium text-spurly-navy-light">{lead.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-spurly-text-secondary flex-shrink-0" />
              <div>
                <p className="text-label text-spurly-text-secondary">Time in Role</p>
                <p className="text-label font-medium text-spurly-navy-light">{lead.timeInRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 border-t border-spurly-border space-y-3">
        <button className="w-full px-4 py-3 rounded-spurly bg-spurly-surface-bg hover:bg-spurly-border text-spurly-navy-light font-medium text-label transition">
          View Full Profile
        </button>
        <button className="w-full px-4 py-3 rounded-spurly bg-spurly-purple hover:bg-spurly-blue text-white font-medium text-label transition">
          Enrich Again
        </button>
      </div>
    </div>
  );
}
