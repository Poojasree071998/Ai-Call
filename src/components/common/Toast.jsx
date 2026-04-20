import React, { useState, useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast-message ${type} ${isVisible ? 'fade-in' : 'fade-out'}`}>
      <div className="toast-content">
        <span className="toast-icon">
          {type === 'success' && '✅'}
          {type === 'error' && '❌'}
          {type === 'warning' && '⚠️'}
          {type === 'info' && 'ℹ️'}
          {type === 'demo' && '🧪'}
        </span>
        <span className="toast-text">{message}</span>
      </div>
      <button className="toast-close" onClick={() => setIsVisible(false)}>×</button>
    </div>
  );
};

export default Toast;
