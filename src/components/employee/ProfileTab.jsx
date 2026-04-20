import React from 'react';

const ProfileTab = ({ currentUser }) => {
  return (
    <div className="content-card card glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '32px', margin: '0 auto 20px' }}>
          {currentUser?.name?.charAt(0)}
        </div>
        <h2>{currentUser?.name}</h2>
        <p style={{ opacity: 0.7 }}>{currentUser?.email}</p>
        <p style={{ fontWeight: '600', color: '#00e676', marginTop: '10px' }}>Squad: {currentUser?.department || 'General'}</p>
        
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <h4 style={{ marginBottom: '10px' }}>Verified Handset</h4>
          <div style={{ fontSize: '24px', color: '#00e676', fontWeight: '600' }}>+91 94446 67411</div>
          <p style={{ fontSize: '12px', marginTop: '10px', opacity: 0.6 }}>This phone will ring when you attend a customer call.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
