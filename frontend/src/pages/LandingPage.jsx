import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <nav className="navbar glass">
        <div className="logo">FIC <span>SmartCall</span></div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#solutions">Solutions</a>
          <a href="#pricing">Pricing</a>
          <button className="btn-login" onClick={() => window.location.href='/login'}>Login</button>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1 className="gradient-text">Elevate Your Customer Experience with AI</h1>
            <p>Seamlessly route calls to humans during peak hours and let our advanced AI handle the rest. 24/7 coverage with zero missed opportunities.</p>
            <div className="hero-btns">
              <button className="btn-primary">Get Started</button>
              <button className="btn-secondary">Watch Demo</button>
            </div>
          </div>
          <div className="hero-visual glass">
            <div className="stat-card">
              <h3>98%</h3>
              <p>Satisfaction Rate</p>
            </div>
            <div className="stat-card">
              <h3>24/7</h3>
              <p>Support Ready</p>
            </div>
          </div>
        </section>

        <section id="features" className="features">
          <h2 className="section-title">Why Choose SmartCall?</h2>
          <div className="feature-grid">
            <div className="feature-card glass">
              <div className="icon">🛡️</div>
              <h3>Intelligent IVR</h3>
              <p>Advanced menu detection for Credit Card Sales, Insurance, and Job Consulting.</p>
            </div>
            <div className="feature-card glass">
              <div className="icon">⚙️</div>
              <h3>Time-Based Routing</h3>
              <p>Smart redirection between employees (8 AM - 8 PM) and AI Voice Assistants.</p>
            </div>
            <div className="feature-card glass">
              <div className="icon">🤖</div>
              <h3>Gemini Powered AI</h3>
              <p>Natural conversation and automated lead generation with detailed summaries.</p>
            </div>
            <div className="feature-card glass">
              <div className="icon">📊</div>
              <h3>Real-time Dashboard</h3>
              <p>Comprehensive analytics for admins, employees, and lead management.</p>
            </div>
          </div>
        </section>

        <section className="cta glass">
          <h2>Ready to transform your call center?</h2>
          <p>Join 500+ businesses using FIC SmartCall to automate their growth.</p>
          <button className="btn-primary">Start Your Free Trial</button>
        </section>
      </main>

      <footer>
        <p>&copy; 2024 FIC Smart Calling System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
