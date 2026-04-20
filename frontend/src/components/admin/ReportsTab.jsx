import React from 'react';

const ReportsTab = ({ calls, leads, metrics }) => {
  // Calculate Sentiment Distribution
  const sentimentCounts = (calls || []).reduce((acc, call) => {
    if (call.sentiment) acc[call.sentiment] = (acc[call.sentiment] || 0) + 1;
    return acc;
  }, { Positive: 0, Neutral: 0, Negative: 0 });

  // Calculate Department Call Volume
  const deptVolume = (calls || []).reduce((acc, call) => {
    const dept = call.department || 'General';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const departments = ['SBI', 'IT', 'Insurance', 'Job Consulting', 'General'];
  const maxVolume = Math.max(...Object.values(deptVolume), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div className="grid-2">
        {/* Sentiment Analysis Card */}
        <div className="content-card card">
          <div className="card-header">
            <h2>AI Sentiment Analysis</h2>
            <p className="stat-muted">Across all AI interactions</p>
          </div>
          <div className="sentiment-chart" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '150px', padding: '20px 0' }}>
            {Object.entries(sentimentCounts).map(([label, count]) => {
              const height = (count / Math.max(...Object.values(sentimentCounts), 1)) * 100;
              return (
                <div key={label} style={{ textAlign: 'center', width: '60px' }}>
                  <div style={{ 
                    height: `${height}%`, 
                    minHeight: '10px',
                    background: label === 'Positive' ? '#10b981' : label === 'Negative' ? '#ef4444' : '#6366f1',
                    borderRadius: '8px 8px 0 0',
                    transition: 'height 1s ease-out'
                  }}></div>
                  <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: '600' }}>{label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.6 }}>{count} calls</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Priority Distribution */}
        <div className="content-card card">
          <div className="card-header">
            <h2>Conversion Funnel</h2>
            <p className="stat-muted">Lead Status tracking</p>
          </div>
          <div style={{ padding: '20px 0' }}>
            {['High', 'Medium', 'Low'].map(prio => {
              const count = (leads || []).filter(l => l.priority === prio).length;
              const percent = (count / Math.max(leads?.length, 1)) * 100;
              return (
                <div key={prio} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px' }}>
                    <span>{prio} Priority</span>
                    <span>{count} Leads</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${percent}%`, 
                      height: '100%', 
                      background: prio === 'High' ? 'linear-gradient(90deg, #f43f5e, #e11d48)' : 
                                 prio === 'Medium' ? 'linear-gradient(90deg, #f59e0b, #d97706)' : '#94a3b8',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Call Volume Chart */}
      <div className="content-card card">
        <div className="card-header">
          <h2>Department Performance</h2>
          <div className="badge">LIVE VOLUME</div>
        </div>
        <div className="bar-chart-container" style={{ padding: '20px 0' }}>
          {departments.map(dept => {
            const count = deptVolume[dept] || 0;
            const width = (count / maxVolume) * 100;
            return (
              <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
                <div style={{ width: '120px', fontSize: '13px', fontWeight: '500' }}>{dept}</div>
                <div style={{ flex: 1, height: '24px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ 
                    width: `${width}%`, 
                    height: '100%', 
                    background: 'var(--accent-gradient)', 
                    borderRadius: '6px',
                    transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}></div>
                  <span style={{ position: 'absolute', right: '10px', top: '2px', fontSize: '12px', fontWeight: '700' }}>{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
