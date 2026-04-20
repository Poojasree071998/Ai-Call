import React from 'react';

const CallsTab = ({ recentCalls, renderCallsTable }) => {
  return (
    <div className="content-card card">
      <div className="card-header">
        <h2>Full Call History</h2>
      </div>
      {renderCallsTable(recentCalls || [])}
    </div>
  );
};

export default CallsTab;
