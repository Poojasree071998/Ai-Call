import React from 'react';

const HistoryTab = ({ callHistory }) => {
  return (
    <div className="content-card card glass-card">
      <div className="card-header"><h2>Your Call History</h2></div>
      <table className="data-table">
        <thead>
          <tr><th>Customer</th><th>Dept</th><th>Duration</th><th>Handled By</th><th>Notes</th></tr>
        </thead>
        <tbody>
          {callHistory?.length > 0 ? callHistory.map(call => (
            <tr key={call._id}>
              <td>{call.from}</td>
              <td><span className="badge">{call.department}</span></td>
              <td>{Math.floor(call.duration/60)}m {call.duration%60}s</td>
              <td>{call.handledBy || 'You'}</td>
              <td style={{ fontSize: '12px', opacity: 0.8 }}>{call.notes || 'No notes taken'}</td>
            </tr>
          )) : (
            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No previous calls found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTab;
