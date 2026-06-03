import api from './api';

export const authService = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Admin-only: Register employee with all details

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  async verifyToken() {
    try {
      const response = await api.post('/auth/verify');
      return response.data;
    } catch (error) {
      this.logout();
      throw error;
    }
  }
  ,

  // Password reset (admin) flows
  async requestPasswordReset(email) {
    const response = await api.post('/auth/admin/request-password-reset', { email });
    return response.data;
  },

  async verifyOtp(email, otp) {
    const response = await api.post('/auth/admin/verify-otp', { email, otp });
    return response.data;
  },

  async resetPassword(email, newPassword) {
    const response = await api.post('/auth/admin/reset-password', { email, newPassword });
    return response.data;
  }
};

