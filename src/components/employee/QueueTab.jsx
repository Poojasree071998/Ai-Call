import React from 'react';
import Dialpad from './Dialpad';

const QueueTab = ({ 
  incomingCalls, 
  filteredCalls, 
  filter, 
  setFilter, 
  handleAttend, 
  isLoading, 
  currentUser, 
  isCalling, 
  activeCall, 
  handleHold, 
  handleTransfer, 
  notes, 
  setNotes, 
  handleEndCall, 
  dialNumber, 
  setDialNumber, 
  handleManualCall,
  disposition,
  setDisposition,
  handleFinishCall,
  deviceStatus,
  callDuration,
  sentiment,
  suggestions,
  deviceReady,
  setActiveTab
}) => {
  return (
    <div className={`queue-layout ${isCalling ? 'war-room' : 'standard'}`}>
      {/* COLUMN 1: QUEUE */}
      <div className="content-card card glass-card queue-column">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '1rem' }}>Live Queue</h3>
            <div className="realtime-indicator"><div className="realtime-dot"></div></div>
          </div>
          <span className="badge-small">{incomingCalls.length}</span>
        </div>
        
        <div className="filter-row-compact">
          {['All', 'SBI', 'IT'].map(role => (
            <button key={role} className={`filter-btn-sm ${filter === role ? 'active' : ''}`} onClick={() => setFilter(role)}>{role}</button>
          ))}
        </div>

        <div className="call-queue-compact">
          {filteredCalls.map(call => (
            <div key={call._id} className="call-item-sm slide-in">
              <div className="c-info">
                <strong>{call.from}</strong>
                <span>{call.department}</span>
              </div>
              <button className="btn-attend-sm" onClick={() => handleAttend(call)} disabled={isLoading || currentUser?.status !== 'Free'}>Attend</button>
            </div>
          ))}
          {filteredCalls.length === 0 && <p className="empty-msg-sm">Queue Clear</p>}
        </div>
      </div>

      {/* COLUMN 2: ACTIVE CALL */}
      <div className="content-card card active-call-box glass-card main-column">
        {isCalling ? (
          <div className="call-active-premium">
            <div className="call-status-header">
              <div className="status-badge-live"><div className="dot"></div> LIVE CALL</div>
              <div className="call-timer-glow">{callDuration}</div>
            </div>

            <div className="customer-hero">
              <div className="c-avatar">{activeCall?.from?.charAt(activeCall.from.length - 1)}</div>
              <h2>{activeCall?.from}</h2>
              <p className="c-meta">{activeCall?.department || 'Outbound Dial'} • {deviceStatus}</p>
            </div>

            {/* SENTIMENT MONITOR */}
            <div className="sentiment-tracker">
              <div className="s-header">
                <span>Customer Sentiment</span>
                <strong className={sentiment > 60 ? 'text-success' : sentiment < 40 ? 'text-danger' : 'text-warning'}>
                  {sentiment > 60 ? 'Positive' : sentiment < 40 ? 'Frustrated' : 'Neutral'}
                </strong>
              </div>
              <div className="s-progress-bg">
                <div 
                  className="s-progress-fill" 
                  style={{ 
                    width: `${sentiment}%`,
                    background: sentiment > 60 ? 'var(--success)' : sentiment < 40 ? 'var(--danger)' : 'var(--warning)'
                  }}
                ></div>
              </div>
            </div>

            <div className="action-grid">
              <div className="input-group">
                <label>Disposition</label>
                <select value={disposition} onChange={(e) => setDisposition(e.target.value)}>
                  <option value="Interested">Interested</option>
                  <option value="Callback">Callback Needed</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Converted">Closed Deal</option>
                </select>
              </div>
              <div className="input-group">
                <label>Actions</label>
                <div className="btn-row">
                  <button className="btn-action-sm" onClick={handleHold}>⏸ Hold</button>
                  <button className="btn-action-sm" onClick={handleTransfer}>🚀 Transfer</button>
                </div>
              </div>
            </div>

            <div className="input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label>Call Insights & AI Logs</label>
              <textarea 
                placeholder="Start typing call insights..." 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className="note-area-premium"
              ></textarea>
            </div>

            <div className="footer-actions">
              <button className="btn-hangup" onClick={handleEndCall}>Hang Up</button>
              <button className="btn-finish-premium" onClick={handleFinishCall} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save & Close Lead'}
              </button>
            </div>
          </div>
        ) : (
          <div className="call-empty-state">
            <div className="empty-visual-glow">
              <div className="inner-circle">🎧</div>
            </div>
            <h3>Waiting for Activity</h3>
            <p>Your queue is active. New calls will appear on the left.</p>
            <p className="device-status-indicator" style={{ 
              fontSize: '0.8rem', 
              color: deviceReady ? 'var(--success)' : 'var(--warning)',
              marginTop: '10px' 
            }}>
              {deviceReady ? '🟢' : '🟠'} {deviceStatus}
            </p>
            
            <div style={{ marginTop: '30px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Need to make a manual call?</p>
              <button 
                className="btn-dial-main" 
                onClick={() => setActiveTab('dialer')} 
                style={{ width: 'auto', padding: '12px 30px' }}
              >
                🔢 Open Dial Pad
              </button>
            </div>
          </div>
        )}
      </div>

      {/* COLUMN 3: AI CO-PILOT */}
      <div className={`content-card card glass-card ai-column ${!isCalling ? 'locked' : ''}`}>
        <div className="card-header-ai">
          <div className="ai-branding">
            <span className="ai-sparkle">✨</span>
            <h3>AI Co-Pilot</h3>
          </div>
          {isCalling && <div className="ai-active-pulse">Listening...</div>}
        </div>

        <div className="ai-suggestions-list">
          {isCalling ? (
            suggestions.length > 0 ? (
              suggestions.map(s => (
                <div key={s.id} className={`ai-tip-card ${s.type} slide-left`}>
                  <div className="tip-icon">{s.type === 'success' ? '🚀' : s.type === 'warning' ? '⚠️' : '💡'}</div>
                  <div className="tip-content">
                    <strong>{s.type === 'success' ? 'Opportunity' : s.type === 'warning' ? 'Risk Alert' : 'Guidance'}</strong>
                    <p>{s.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="ai-analyzing">
                <div className="shimmer-line"></div>
                <div className="shimmer-line shorter"></div>
                <p>Analyzing voice intent...</p>
              </div>
            )
          ) : (
            <div className="ai-idle">
              <p>AI Assistant will activate automatically when a call is established.</p>
            </div>
          )}
        </div>

        {isCalling && (
          <div className="ai-footer">
            <button className="btn-ai-help">
              <span style={{ fontSize: '1.1rem' }}>💡</span>
              Get Script Advice
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueTab;
