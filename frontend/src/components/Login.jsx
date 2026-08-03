import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [apiStatus, setApiStatus] = useState('Checking connectivity...');
  const [isConnected, setIsConnected] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }

    fetch('http://localhost:5000/api/health')
      .then(res => res.json())
      .then(data => {
        setApiStatus(`Connected securely`);
        setIsConnected(true);
      })
      .catch(err => {
        setApiStatus('Service unreachable');
        setIsConnected(false);
      });
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (data.success) {
        login(data.data.user, data.data.token);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="bloom-1"></div>
        <div className="bloom-2"></div>
        <div className="left-content">
          <img src="/IMG-20260803-WA0000.jpg" alt="Prime Roadways" className="hero-logo" />
          <h1 className="hero-title">Prime Roadways</h1>
          <p className="hero-subtitle">
            Enterprise Logistics & Transportation Management System
          </p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="mobile-logo-wrapper">
            <img src="/IMG-20260803-WA0000.jpg" alt="Prime Roadways" className="mobile-logo" />
          </div>

          <h2 className="login-title">Sign in</h2>
          <p className="login-subtitle">Continue to Prime Roadways Portal</p>

          {error && <div style={{ color: 'var(--ms-error)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">Email or username</label>
              <input 
                type="email" 
                id="email" 
                className="input-field" 
                placeholder="someone@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                className="input-field" 
                placeholder="Password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-options">
              <label className="checkbox-wrapper">
                <input type="checkbox" /> Keep me signed in
              </label>
              <a href="#forgot" className="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className={`api-status ${isConnected ? 'connected' : ''}`}>
            <div className="status-dot"></div>
            {apiStatus}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
