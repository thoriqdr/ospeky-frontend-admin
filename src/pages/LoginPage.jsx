// frontend-admin/src/pages/LoginPage.jsx (Versi Final & Benar)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Ambil semua fungsi yang dibutuhkan dari context
  const { login, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();

  // Fungsi untuk login dengan email dan password
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await login(email, password);
      const token = await userCredential.user.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Ambil profil dari backend untuk memeriksa role
      const { data: profile } = await axios.get('/api/users/profile', config);

      if (profile.role !== 'ADMIN') {
        await logout(); // Logout paksa jika bukan admin
        throw new Error('Akses ditolak. Akun ini bukan admin.');
      }
      // Jika admin, arahkan ke dashboard
      navigate('/');
    } catch (err) {
      setError(err.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  // --- PERBAIKAN PADA FUNGSI LOGIN GOOGLE ---
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Panggil loginWithGoogle, `result` sekarang berisi { user, isNewUser } dari backend
      const result = await loginWithGoogle();
      
      // Langsung periksa role dari data yang dikembalikan backend
      if (result.user.role !== 'ADMIN') {
        await logout(); // Logout paksa jika bukan admin
        throw new Error('Akses ditolak. Akun Google ini bukan admin.');
      }
      
      // Jika admin, arahkan ke dashboard
      navigate('/');
    } catch (err) {
      // Menampilkan pesan error dari logic di atas atau jika login gagal
      setError(err.message || 'Gagal login dengan Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <h1>Ospeky.id Panel Admin</h1>
        <p>Silakan login untuk melanjutkan</p>
        
        {error && <p className="admin-login-error">{error}</p>}

        <form onSubmit={handleEmailLogin}>
          <div className="admin-login-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="admin-login-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="admin-login-button" disabled={loading}>
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <div className="admin-separator">atau</div>

        <button type="button" className="admin-google-btn" onClick={handleGoogleLogin} disabled={loading}>
          <img src="/icons/google.svg" alt="Google icon" />
          Login dengan Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;