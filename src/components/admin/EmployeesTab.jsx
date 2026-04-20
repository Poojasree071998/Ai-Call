import React from 'react';

const EmployeesTab = ({ allEmployees, newEmployee, setNewEmployee, handleCreateEmployee, loading }) => {
  const deptCounts = (allEmployees || []).reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="employee-management-grid">
      <div className="content-card card" style={{ gridColumn: 'span 2', marginBottom: '20px' }}>
        <div className="card-header"><h2>Team Strength</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', padding: '20px' }}>
          {['SBI', 'IT', 'Insurance', 'Job Consulting'].map(dept => (
            <div key={dept} style={{ textAlign: 'center', padding: '15px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{deptCounts[dept] || 0}</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>{dept} Agents</div>
            </div>
          ))}
        </div>
      </div>

      <div className="content-card card">
        <div className="card-header"><h2>Add New Staff</h2></div>
        <form className="employee-form" onSubmit={handleCreateEmployee}>
          <div className="form-group"><label>Full Name</label><input type="text" placeholder="e.g. Pooja" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} required /></div>
          <div className="form-group"><label>Email</label><input type="email" placeholder="pooja@fic.com" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} required /></div>
          <div className="form-group"><label>Password</label><input type="password" value={newEmployee.password} onChange={e => setNewEmployee({...newEmployee, password: e.target.value})} required /></div>
          <div className="form-group">
            <label>Department</label>
            <select value={newEmployee.department} onChange={e => setNewEmployee({...newEmployee, department: e.target.value})}>
              <option value="SBI">SBI Team</option>
              <option value="IT">IT Support</option>
              <option value="Insurance">Insurance Dept</option>
              <option value="Job Consulting">Job Consulting</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Registering...' : 'Register Employee'}</button>
        </form>
      </div>

      <div className="registry-squads" style={{ gridColumn: 'span 2' }}>
        {['SBI', 'IT', 'Insurance', 'Job Consulting'].map(dept => {
          const deptAgents = (allEmployees || []).filter(emp => emp.department === dept);
          
          return (
            <div key={dept} className="content-card card" style={{ marginBottom: '30px', overflow: 'hidden' }}>
              <div className="card-header" style={{ borderLeft: '4px solid #00e676' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {dept} Team <span>({deptAgents.length} Agents)</span>
                </h2>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1a1d21' }}>
                    <tr><th>Agent</th><th>State</th><th>Activity</th></tr>
                  </thead>
                  <tbody>
                    {deptAgents.map(emp => (
                      <tr key={emp?._id}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '14px', borderRadius: '8px' }}>
                            {emp?.name?.charAt(0)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '600', fontSize: '14px' }}>{emp?.name}</span>
                            <span style={{ fontSize: '11px', opacity: 0.6 }}>{emp?.email}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="status-dot" style={{ 
                              width: '8px', height: '8px', borderRadius: '50%',
                              backgroundColor: emp?.status === 'Busy' ? '#ff4b2b' : 
                                             emp?.status === 'Free' ? '#00e676' : 
                                             emp?.status === 'On-Hold' ? '#ffa726' : '#999'
                            }}></div>
                            <span style={{ 
                              fontSize: '13px',
                              fontWeight: '500', 
                              color: emp?.status === 'Busy' ? '#ff4b2b' : 
                                     emp?.status === 'Free' ? '#00e676' : 
                                     emp?.status === 'On-Hold' ? '#ffa726' : '#999'
                            }}>
                              {emp?.status || 'Offline'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', opacity: 0.7 }}>
                            {emp?.status === 'Busy' ? 'On Call' : 'Standby'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {deptAgents.length === 0 && (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>No agents assigned to this team.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeesTab;
