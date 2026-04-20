import React from 'react';

const MonitorTab = ({ onlineEmployees, activeCalls }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div className="content-card card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2>Live Call Traffic</h2>
            <div className="realtime-indicator"><div className="realtime-dot"></div>{activeCalls?.length || 0} In-Progress</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Caller</th><th>Status</th><th>Handled By</th><th>Department</th><th>Start Time</th></tr>
          </thead>
          <tbody>
            {activeCalls?.length > 0 ? activeCalls.map(call => (
              <tr key={call._id}>
                <td><strong>{call.from}</strong></td>
                <td>
                  <span className={`status-pill ${call.handledBy === 'AI' ? 'ai-active' : 'employee-active'}`}>
                    {call.handledBy === 'AI' ? '🤖 AI IVR' : '🎧 With Agent'}
                  </span>
                </td>
                <td>{call.handledBy === 'AI' ? 'FIC AI System' : (call.employeeId || 'Hunting...')}</td>
                <td><span className="badge">{call.department || 'Unknown'}</span></td>
                <td>{new Date(call.startTime).toLocaleTimeString()}</td>
              </tr>
            )) : (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No live calls at the moment.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="content-card card">
        <div className="card-header">
          <h2>Live Employee Monitor</h2>
          <div className="realtime-indicator">
            <div className="realtime-dot"></div>
            {onlineEmployees?.length || 0} Online
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Status</th>
              <th>Activity</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {onlineEmployees?.length > 0 ? onlineEmployees.map(emp => (
              <tr key={emp?._id}>
                <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '12px' }}>
                    {emp?.name?.charAt(0)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '600' }}>{emp?.name}</span>
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>{emp?.email}</span>
                  </div>
                </td>
                <td><span className="badge">{emp?.department}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="status-dot" style={{ 
                      width: '10px', height: '10px', borderRadius: '50%',
                      backgroundColor: emp?.status === 'Busy' ? '#ff4b2b' : 
                                     emp?.status === 'Free' ? '#00e676' : 
                                     emp?.status === 'On-Call' ? '#ff4b2b' :
                                     emp?.status === 'On-Hold' ? '#ffa726' : '#999'
                    }}></div>
                    <span style={{ 
                      fontWeight: '500', 
                      color: emp?.status === 'Busy' || emp?.status === 'On-Call' ? '#ff4b2b' : 
                             emp?.status === 'Free' ? '#00e676' : 
                             emp?.status === 'On-Hold' ? '#ffa726' : '#999'
                    }}>
                      {emp?.status || 'Offline'}
                    </span>
                  </div>
                </td>
                <td>{emp?.status === 'Busy' || emp?.status === 'On-Call' ? 'In Active Call' : emp?.status === 'On-Hold' ? 'Handling Hold' : 'Ready'}</td>
                <td>{emp?.lastLogin ? new Date(emp.lastLogin).toLocaleTimeString() : 'N/A'}</td>
              </tr>
            )) : (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No online staff member.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonitorTab;
