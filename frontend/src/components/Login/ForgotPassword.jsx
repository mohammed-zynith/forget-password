import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email) return setError('Please enter your email');
    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setMessage('OTP sent to admin email.');
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-right-panel">
        <div className="login-card">
          <h2>Request Password Reset</h2>
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
              />
            </div>
            <button type="submit" className="signin-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button type="button" className="signin-btn" onClick={() => navigate('/login')}>Back to login</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
