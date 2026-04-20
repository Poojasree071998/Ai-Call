import React from 'react';
import { Phone, PhoneOff, User, ShieldCheck } from 'lucide-react';
import './InboundCallPopup.css';

const InboundCallPopup = ({ call, onAccept, onReject }) => {
  if (!call) return null;

  return (
    <div className="call-popup-overlay">
      <div className="call-popup-card">
        <div className="call-popup-pulse">
          <div className="pulse-circle"></div>
          <Phone className="pulse-icon" />
        </div>
        
        <div className="call-popup-header">
          <div className="badge-live">LIVE CALL</div>
          <h2>Incoming Assignment</h2>
          <p className="dept-pill">{call.department || 'General'} Specialist Required</p>
        </div>

        <div className="call-popup-info">
          <div className="info-row">
            <User size={18} />
            <span>{call.from || 'Unknown Caller'}</span>
          </div>
          <div className="info-row">
            <ShieldCheck size={18} className="verified-icon" />
            <span>SLA Verified • Priority Hunt</span>
          </div>
        </div>

        <div className="call-popup-actions">
          <button className="btn-reject" onClick={() => onReject(call.id)}>
            <PhoneOff size={20} />
            Ignore
          </button>
          <button className="btn-accept" onClick={() => onAccept(call)}>
            <Phone size={20} />
            Attend Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default InboundCallPopup;
