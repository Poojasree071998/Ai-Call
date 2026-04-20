import React, { useState } from 'react';
import './TransferModal.css';

const TransferModal = ({ isOpen, onClose, onTransfer, departments }) => {
  const [selectedDept, setSelectedDept] = useState('');
  const [searchAgent, setSearchAgent] = useState('');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card transfer-modal slide-in">
        <div className="modal-header">
          <h3>🚀 Transfer Call</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="transfer-section">
            <label>Select Department</label>
            <div className="dept-grid">
              {departments.map(dept => (
                <button 
                  key={dept} 
                  className={`dept-pill ${selectedDept === dept ? 'active' : ''}`}
                  onClick={() => setSelectedDept(dept)}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="transfer-section">
            <label>Internal Agent Search</label>
            <input 
              type="text" 
              placeholder="Search agent name or ID..." 
              value={searchAgent}
              onChange={(e) => setSearchAgent(e.target.value)}
              className="modal-input"
            />
          </div>

          <div className="transfer-info">
            <p>⚡ Transferring to <strong>{selectedDept || '...'}</strong> department.</p>
            <span>The customer will hear music while the connection is established.</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn-primary" 
            onClick={() => onTransfer(selectedDept, searchAgent)}
            disabled={!selectedDept && !searchAgent}
          >
            Confirm Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
