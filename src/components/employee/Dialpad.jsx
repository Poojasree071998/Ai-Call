import React, { useEffect, useCallback, useState } from 'react';
import { Phone } from 'lucide-react';
import './Dialpad.css';

const Dialpad = ({ 
  dialNumber, 
  setDialNumber, 
  handleManualCall, 
  isLoading,
  isCalling,
  activeCall,
  deviceStatus,
  deviceReady,
  callDuration,
  handleEndCall
}) => {
  const [activeButton, setActiveButton] = useState(null);
  const [disposition, setDisposition] = useState('Interested');
  const [notes, setNotes] = useState('');

  const handleDigitClick = useCallback((digit) => {
    setDialNumber((prev) => (prev.length < 15 ? prev + digit : prev));
    setActiveButton(digit);
    setTimeout(() => setActiveButton(null), 150);
  }, [setDialNumber]);

  const handleBackspace = useCallback(() => {
    setDialNumber((prev) => prev.slice(0, -1));
  }, [setDialNumber]);

  // Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      
      if (/^[0-9*#+]$/.test(e.key)) {
        handleDigitClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter' && dialNumber) {
        handleManualCall();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigitClick, handleBackspace, handleManualCall, dialNumber]);

  const digits = [
    { num: '1', sub: '' },
    { num: '2', sub: 'ABC' },
    { num: '3', sub: 'DEF' },
    { num: '4', sub: 'GHI' },
    { num: '5', sub: 'JKL' },
    { num: '6', sub: 'MNO' },
    { num: '7', sub: 'PQRS' },
    { num: '8', sub: 'TUV' },
    { num: '9', sub: 'WXYZ' },
    { num: '*', sub: '' },
    { num: '0', sub: '+' },
    { num: '#', sub: '' },
  ];

  return (
    <div className="dialpad-wrapper glass-card-premium">
      <div className="dialpad-display">
        <input 
          type="text" 
          value={dialNumber} 
          onChange={(e) => setDialNumber(e.target.value.replace(/[^0-9*#+]/g, ''))} 
          onKeyDown={(e) => {
            if (e.key === 'Enter' && dialNumber && deviceReady) {
              handleManualCall();
            }
          }}
          placeholder="Enter Number..." 
          className="dialpad-input"
          maxLength={15}
          disabled={isCalling}
        />
        {dialNumber && !isCalling && (
          <button className="dialpad-backspace" onClick={handleBackspace} title="Backspace">
            ⌫
          </button>
        )}
      </div>
      
      {/* Keypad */}
      <div className="dialpad-grid">
        {digits.map((digit) => (
          <button
            key={digit.num}
            className={`dialpad-btn ${activeButton === digit.num ? 'active' : ''}`}
            onClick={() => handleDigitClick(digit.num)}
            disabled={isLoading || isCalling}
          >
            <span className="dialpad-num">{digit.num}</span>
            <span className="dialpad-letters">{digit.sub || '\u00A0'}</span>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="dialpad-actions">
        <button 
          className="btn-dialpad-call" 
          onClick={handleManualCall} 
          disabled={!dialNumber || isLoading || isCalling || !deviceReady}
        >
          {isLoading ? (
            <span className="loading-spinner-sm"></span>
          ) : (
            <>
              <Phone className="call-icon" size={20} fill="currentColor" />
              <span>Call Now</span>
            </>
          )}
        </button>
      </div>

      {dialNumber && !isLoading && !isCalling && (
        <button className="btn-clear-all" onClick={() => setDialNumber('')}>
          Clear All
        </button>
      )}

      {/* Active Call UI */}
      {isCalling && (
        <div className="active-call-ui">
          <div className="active-call-header">
            <div className="status-badge-live">
              <div className="dot"></div> LIVE CALL
            </div>
            <div className="call-timer-header">
              {callDuration || '00:00'}
            </div>
          </div>
          
          <div className="active-call-avatar">
            <div className="avatar-square">1</div>
          </div>
          
          <h2 className="active-call-number">{activeCall?.from || dialNumber}</h2>
          
          <p className="active-call-status">
            Outbound Dial • <span className="icon-mobile">📱</span> {deviceStatus || 'Ringing Customer...'}
          </p>
          
          <div className="sentiment-section">
            <div className="sentiment-labels">
              <span className="label-bold">Customer Sentiment</span>
              <span className="label-bold">Neutral</span>
            </div>
            <div className="sentiment-bar-container">
              <div className="sentiment-bar-fill" style={{ width: '40%' }}></div>
            </div>
          </div>
          
          <div className="call-actions-grid">
            <div className="action-column">
              <span className="action-label">Disposition</span>
              <select 
                className="action-btn select-btn" 
                value={disposition}
                onChange={(e) => setDisposition(e.target.value)}
                style={{ appearance: 'auto', WebkitAppearance: 'auto', MozAppearance: 'auto' }}
              >
                <option value="Interested">Interested</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Call Back">Call Back</option>
                <option value="No Answer">No Answer</option>
                <option value="Invalid Number">Invalid Number</option>
              </select>
            </div>
            <div className="action-column">
              <span className="action-label">Actions</span>
              <div className="action-buttons-row">
                <button className="action-btn">
                  <span className="icon">⏸</span> Hold
                </button>
                <button className="action-btn">
                  <span className="icon">🚀</span> Transfer
                </button>
              </div>
            </div>
          </div>
          
          <div className="insights-section">
            <span className="action-label">Call Insights & AI Logs</span>
            <textarea 
              className="insights-textarea" 
              placeholder="Start typing call insights..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
          
          <div className="bottom-action-buttons">
            <button className="btn-hangup-large" onClick={() => handleEndCall()}>
              HANG<br/>UP
            </button>
            <button className="btn-save-close" onClick={() => handleEndCall({ disposition, notes })}>
              SAVE<br/>&<br/>CLOSE<br/>LEAD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dialpad;
