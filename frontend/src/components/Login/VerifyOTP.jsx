import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import './Login.css';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const preEmail = location.state?.email || '';

  const [email, setEmail] = useState(preEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !otp) return setError('Please enter email and OTP');
    setLoading(true);
    try {
      await authService.verifyOtp(email, otp);
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-right-panel">
        <div className="login-card">
          <h2>Verify OTP</h2>
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            </div>
            <button type="submit" className="signin-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
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

export default VerifyOTP;
