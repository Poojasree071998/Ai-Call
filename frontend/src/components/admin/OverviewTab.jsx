import React from 'react';

const OverviewTab = ({ stats, recentCalls, renderCallsTable, setActiveTab }) => {
  return (
    <>
      <section className="stats-grid" style={{ marginBottom: '40px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="stat-card card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
              <span className="stat-change">{stat.change} vs last week</span>
            </div>
          </div>
        ))}
      </section>
      <div className="content-card card">
        <div className="card-header">
          <h2>Recent Call Activity</h2>
          <button className="btn-text" onClick={() => setActiveTab('calls')}>View All</button>
        </div>
        {renderCallsTable(recentCalls?.slice(0, 5) || [])}
      </div>
    </>
  );
};

export default OverviewTab;
