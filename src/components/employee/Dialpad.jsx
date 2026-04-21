import React, { useEffect, useCallback } from 'react';
import './Dialpad.css';

const Dialpad = ({ dialNumber, setDialNumber, handleManualCall, isLoading }) => {
  const handleDigitClick = useCallback((digit) => {
    setDialNumber((prev) => (prev.length < 15 ? prev + digit : prev));
  }, [setDialNumber]);

  const handleBackspace = useCallback(() => {
    setDialNumber((prev) => prev.slice(0, -1));
  }, [setDialNumber]);

  const handleClear = () => {
    setDialNumber('');
  };

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
    { num: '1', letters: '' },
    { num: '2', letters: 'ABC' },
    { num: '3', letters: 'DEF' },
    { num: '4', letters: 'GHI' },
    { num: '5', letters: 'JKL' },
    { num: '6', letters: 'MNO' },
    { num: '7', letters: 'PQRS' },
    { num: '8', letters: 'TUV' },
    { num: '9', letters: 'WXYZ' },
    { num: '*', letters: '' },
    { num: '0', letters: '+' },
    { num: '#', letters: '' },
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
        />
        {dialNumber && (
          <button className="dialpad-backspace" onClick={handleBackspace} title="Backspace">
            ⌫
          </button>
        )}
      </div>
      
      <div className="dialpad-grid">
        {digits.map((item, idx) => (
          <button 
            key={idx} 
            className="dialpad-btn" 
            onClick={() => handleDigitClick(item.num)}
            onMouseDown={(e) => e.currentTarget.classList.add('active')}
            onMouseUp={(e) => e.currentTarget.classList.remove('active')}
            onMouseLeave={(e) => e.currentTarget.classList.remove('active')}
          >
            <span className="dialpad-num">{item.num}</span>
            <span className="dialpad-letters">{item.letters || '\u00A0'}</span>
          </button>
        ))}
      </div>

      <div className="dialpad-call-action">
        <button 
          className="btn-dialpad-call" 
          onClick={handleManualCall} 
          disabled={isLoading || !dialNumber}
        >
          <span className="call-icon">📞</span>
          {isLoading ? 'Connecting...' : 'Call Now'}
        </button>
        {dialNumber && (
          <button className="btn-clear-all" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default Dialpad;
