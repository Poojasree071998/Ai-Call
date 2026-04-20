import React from 'react';

const LeadsTab = ({ leads }) => {
  return (
    <div className="content-card card">
      <div className="card-header">
        <h2>Customer Leads</h2>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Service</th>
            <th>Priority</th>
            <th>Sentiment</th>
            <th>Requirement</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {leads?.length > 0 ? leads.map(lead => (
            <tr key={lead?._id}>
              <td>{lead?.phoneNumber}</td>
              <td><span className="badge">{lead?.serviceType}</span></td>
              <td>
                <span className={`status-pill`} style={{ 
                  background: lead?.priority === 'High' ? 'rgba(244, 63, 94, 0.1)' : 
                             lead?.priority === 'Medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                  color: lead?.priority === 'High' ? '#f43f5e' : 
                         lead?.priority === 'Medium' ? '#f59e0b' : '#94a3b8',
                  border: `1px solid ${lead?.priority === 'High' ? '#f43f5e33' : 
                                       lead?.priority === 'Medium' ? '#f59e0b33' : '#94a3b833'}`
                }}>
                  {lead?.priority || 'Medium'}
                </span>
              </td>
              <td style={{ textAlign: 'center' }}>
                {lead?.sentiment === 'Positive' ? '😊' : lead?.sentiment === 'Negative' ? '😠' : '😐'}
              </td>
              <td style={{ maxWidth: '250px', fontSize: '13px', opacity: 0.9 }}>{lead?.requirementSummary}</td>
              <td><span className={`handler-badge employee`}>{lead?.status}</span></td>
              <td>{lead?.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}</td>
            </tr>
          )) : (
            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No leads found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeadsTab;
