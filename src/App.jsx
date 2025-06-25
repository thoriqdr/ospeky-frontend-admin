// frontend-admin/src/App.jsx (Versi Final dengan Alur Login)
// Trigger redeploy

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Impor Provider Autentikasi
import { AuthProvider } from './context/AuthContext';

// Impor Komponen & Halaman
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import KelolaProdukPage from './pages/KelolaProdukPage';
import AddProductPage from './pages/AddProductPage';
import ManajemenKategoriPage from './pages/ManajemenKategoriPage';
import PackingPage from './pages/PackingPage';
import LoginPage from './pages/LoginPage'; // <-- Impor halaman login
import PrivateRoute from './components/PrivateRoute'; // <-- Impor penjaga rute

import './App.css';

// Komponen Layout untuk memisahkan halaman login dari halaman admin
const AppLayout = () => {
  const location = useLocation();

  // Jika bukan di halaman login, tampilkan layout dengan sidebar
  if (location.pathname !== '/login') {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            {/* Semua rute di sini dilindungi oleh PrivateRoute */}
            <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/kelola-produk" element={<PrivateRoute><KelolaProdukPage /></PrivateRoute>} />
            <Route path="/add-product" element={<PrivateRoute><AddProductPage /></PrivateRoute>} />
            <Route path="/manajemen-kategori" element={<PrivateRoute><ManajemenKategoriPage /></PrivateRoute>} />
            <Route path="/packing" element={<PrivateRoute><PackingPage /></PrivateRoute>} />
            {/* Tambahkan rute privat lainnya di sini */}
          </Routes>
        </main>
      </div>
    );
  }

  // Jika di halaman login, hanya tampilkan halaman login
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      {/* Bungkus seluruh aplikasi dengan AuthProvider */}
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;