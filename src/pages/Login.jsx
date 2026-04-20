import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Store session
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        // Redirect based on role
        if (data.user.role === 'Admin') {
          window.location.href = '/dashboard/admin';
        } else {
          window.location.href = '/dashboard/employee';
        }
      } else {
        // Handle specific server error messages
        const errMsg = data.error || data.message || 'Login failed';
        alert(`Error: ${errMsg}`);
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Network error or Server Timeout. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const initAccounts = async () => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Super Admin',
          email: 'admin@fic.com',
          password: 'admin123',
          role: 'Admin'
        })
      });
      // Also register employee
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Demo Employee',
          email: 'employee@fic.com',
          password: 'employee123',
          role: 'Employee'
        })
      });
      alert('Test Accounts Initialized! You can now log in.');
    } catch (err) {
      alert('Could not initialize. Are you sure the backend is running?');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass">
        <h2>Welcome Back</h2>
        <p>Login to your SmartCall account</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Don't have an account? <span style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={initAccounts}>Initialize Test Accounts</span></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
