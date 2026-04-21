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
  callDuration,
  handleEndCall
}) => {
  const [activeButton, setActiveButton] = useState(null);

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
          disabled={!dialNumber || isLoading || isCalling}
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

      {/* Active Call Overlay */}
      {isCalling && (
        <div className="active-call-overlay glass-card-premium">
          <div className="active-call-pulse-bg"></div>
          
          <div className="active-call-content">
            <div className="status-badge-live">
              <div className="dot"></div> LIVE CALL
            </div>
            
            <div className="caller-id">
              <h3>{activeCall?.from || dialNumber}</h3>
              <p>{deviceStatus}</p>
            </div>
            
            <div className="call-timer-large">
              {callDuration || '00:00'}
            </div>
            
            <button className="btn-hangup-circle" onClick={handleEndCall}>
              <Phone size={32} style={{ transform: 'rotate(135deg)' }} fill="currentColor" />
            </button>
            
            <p className="hangup-label">End Call</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dialpad;
