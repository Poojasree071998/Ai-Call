import React, { useState, useEffect } from 'react';
import './Dashboard.css';

// Import Modular Components
import OverviewTab from '../components/admin/OverviewTab';
import MonitorTab from '../components/admin/MonitorTab';
import EmployeesTab from '../components/admin/EmployeesTab';
import CallsTab from '../components/admin/CallsTab';
import LeadsTab from '../components/admin/LeadsTab';
import ReportsTab from '../components/admin/ReportsTab';
import { io } from 'socket.io-client';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [calls, setCalls] = useState([]);
  const [activeCalls, setActiveCalls] = useState([]);
  const [leads, setLeads] = useState([]);
  const [metrics, setMetrics] = useState({ totalCalls: 0, aiCalls: 0, employeeCalls: 0, totalLeads: 0 });
  const [onlineEmployees, setOnlineEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '', department: 'Insurance' });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Auto-refresh every 5s

    // Socket.io Real-time Monitoring
    const socket = io('/');
    socket.on('connect', () => console.log('📡 [ADMIN] Connected to FIC Pulse'));
    
    socket.on('call-initiated', (data) => {
      console.log('📡 [ADMIN] New Call detected:', data);
      fetchData(); // Refresh everything on new call
    });

    socket.on('call-handled', () => fetchData());
    socket.on('incoming-call', () => fetchData()); // Department assigned

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const fetchData = async () => {
    try {
      const historyRes = await fetch('/api/calls/history');
      if (historyRes.ok) setCalls(await historyRes.json() || []);

      const leadsRes = await fetch('/api/leads');
      if (leadsRes.ok) setLeads(await leadsRes.json() || []);

      const metricsRes = await fetch('/api/calls/metrics');
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        if (data && !data.message) setMetrics(data);
      }

      const onlineRes = await fetch('/api/auth/online-employees');
      if (onlineRes.ok) setOnlineEmployees(await onlineRes.json() || []);

      const activeRes = await fetch('/api/calls/active?department=All');
      if (activeRes.ok) setActiveCalls(await activeRes.json() || []);

      const usersRes = await fetch('/api/auth/users');
      if (usersRes.ok) setAllEmployees(await usersRes.json() || []);
    } catch (err) {
      console.error('🚀 Dashboard Sync Error:', err);
    }
  };

  const simulateCall = async () => {
    setLoading(true);
    try {
      const randomNum = '+91' + Math.floor(6000000000 + Math.random() * 3999999999);
      await fetch('/api/calls/incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `CallSid=SIM_${Date.now()}&From=${randomNum}&To=+910000000000`
      });
      fetchData();
    } catch (err) {
      alert('Error: Make sure backend is running on port 5050');
    }
    setLoading(false);
  };

  const purgeTestCalls = async () => {
    if (!window.confirm('Delete all active test calls?')) return;
    setLoading(true);
    try {
      await fetch('/api/calls/purge', { method: 'POST' });
      fetchData();
    } catch (err) {
      alert('Purge failed');
    }
    setLoading(false);
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEmployee, role: 'Employee' })
      });
      if (res.ok) {
        alert('Employee created successfully!');
        setNewEmployee({ name: '', email: '', password: '', department: 'Insurance' });
        fetchData();
      }
    } catch (err) {
      alert('Network error');
    }
    setLoading(false);
  };

  const stats = [
    { title: 'Total Calls', value: metrics.totalCalls, change: '+12%', icon: '📞' },
    { title: 'AI Handled', value: metrics.aiCalls, change: '+25%', icon: '🤖' },
    { title: 'Employee Calls', value: metrics.employeeCalls, change: '-5%', icon: '👨‍💼' },
    { title: 'Missed Calls', value: metrics.missedCalls || 0, change: '0%', icon: '❌' },
    { title: 'Leads Generated', value: metrics.totalLeads, change: '+18%', icon: '🎯' },
  ];

  const recentCalls = Array.isArray(calls) ? calls.map(call => ({
    id: call._id,
    customer: call.from || 'Unknown',
    dept: call.department || 'General',
    time: call.startTime ? new Date(call.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...',
    duration: call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : '...',
    handledBy: call.handledBy || 'AI',
    status: call.status || 'In-Progress',
    disposition: call.disposition || 'N/A',
    recordingUrl: call.recordingUrl
  })) : [];

  const renderCallsTable = (data) => (
    <table className="data-table">
      <thead>
        <tr><th>Customer</th><th>Department</th><th>Time</th><th>Duration</th><th>Handled By</th><th>Status</th><th>Action</th></tr>
      </thead>
      <tbody>
        {data.map(call => (
          <tr key={call.id}>
            <td>{call.customer}</td>
            <td><span className="badge">{call.dept}</span></td>
            <td>{call.time}</td>
            <td>{call.duration}</td>
            <td><span className={`handler-badge ${(call.handledBy || 'AI').toLowerCase()}`}>{call.handledBy}</span></td>
            <td><span className={`status-dot ${call.status.toLowerCase()}`}></span> {call.status}</td>
            <td>{call.recordingUrl && <button className="btn-text" onClick={() => window.open(call.recordingUrl, '_blank')}>▶️ Listen</button>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="dashboard-container">
      <aside className="sidebar glass">
        <div className="sidebar-logo">FIC <span>SC</span></div>
        <nav>
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>📊 Overview</button>
          <button className={activeTab === 'monitor' ? 'active' : ''} onClick={() => setActiveTab('monitor')}>📡 Live Monitor</button>
          <button className={activeTab === 'employees' ? 'active' : ''} onClick={() => setActiveTab('employees')}>👥 Employees</button>
          <button className={activeTab === 'calls' ? 'active' : ''} onClick={() => setActiveTab('calls')}>📞 Call History</button>
          <button className={activeTab === 'leads' ? 'active' : ''} onClick={() => setActiveTab('leads')}>🎯 Leads</button>
          <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>📈 Reports</button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>⚙️ Settings</button>
        </nav>
        <div className="sidebar-footer">
          <p>Admin Mode</p>
          <button className="btn-logout" onClick={() => { localStorage.clear(); window.location.href = '/login'; }}>Logout</button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <div className="header-actions">
            <button className="btn-header secondary shadow-btn" onClick={purgeTestCalls}>🧹 Clean Queue</button>
            <button className="btn-header primary shadow-btn" onClick={simulateCall} disabled={loading}>{loading ? 'Simulating...' : '🚀 Test Call'}</button>
            <div className="user-profile"><div className="avatar">AD</div><span>Administrator</span></div>
          </div>
        </header>

        <section className="dashboard-content">
          {(() => {
            switch(activeTab) {
              case 'overview': return <OverviewTab stats={stats} recentCalls={recentCalls} renderCallsTable={renderCallsTable} setActiveTab={setActiveTab} />;
              case 'monitor': return <MonitorTab onlineEmployees={onlineEmployees} activeCalls={activeCalls} />;
              case 'employees': return <EmployeesTab allEmployees={allEmployees} newEmployee={newEmployee} setNewEmployee={setNewEmployee} handleCreateEmployee={handleCreateEmployee} loading={loading} />;
              case 'calls': return <CallsTab recentCalls={recentCalls} renderCallsTable={renderCallsTable} />;
              case 'leads': return <LeadsTab leads={leads} />;
              case 'reports': return <ReportsTab calls={calls} leads={leads} metrics={metrics} />;
              case 'settings':
                return (
                  <div className="content-card card">
                    <div className="card-header"><h2>System Settings</h2></div>
                    <div style={{ padding: '20px' }}><p>⚙️ Outbound Caller ID: +13203141838</p><p>🏢 Global Forwarding: +919444667411</p></div>
                  </div>
                );
              default: return <div>Please select a tab.</div>;
            }
          })()}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
