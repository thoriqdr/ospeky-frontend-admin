// src/components/Sidebar.jsx

import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useUserProfile from '../hooks/useUserProfile.jsx'; // Benar, tanpa {}

// Hook custom untuk mendeteksi klik di luar elemen
const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
};


const Sidebar = () => {
  const { logout } = useAuth();
  const userProfile = useUserProfile(); // Mengambil data profil (termasuk role)
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef();
  useOutsideClick(profileRef, () => setIsProfileOpen(false));

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login'); // Arahkan ke halaman login setelah logout
    } catch (error) {
      console.error("Gagal logout", error);
    }
  };

  return (
    <div className="sidebar">
      
      {/* --- BAGIAN PROFIL PENGGUNA BARU (PALING ATAS) --- */}
      <div className="sidebar-profile-section" ref={profileRef}>
        <button className="profile-trigger" onClick={() => setIsProfileOpen(!isProfileOpen)}>
          <img src="/icons/avatar-placeholder.svg" alt="Avatar" className="profile-avatar" />
          <div className="profile-info">
            <span className="profile-email">{userProfile?.email || 'Memuat...'}</span>
            <span className="profile-role">{userProfile?.role}</span>
          </div>
          <img src="/icons/chevron-down.svg" alt="toggle menu" className={`profile-chevron ${isProfileOpen ? 'open' : ''}`} />
        </button>

        {isProfileOpen && (
          <div className="profile-dropdown">
            <button onClick={handleLogout} className="logout-button">
              <span>Log out</span>
              <img src="/icons/logout.svg" alt="Logout" />
            </button>
          </div>
        )}
      </div>

      {/* --- LOGO MENGGANTIKAN TEKS HEADER --- */}
      <div className="sidebar-logo-container">
        <img src="/logo.svg" alt="Ospeky.id Logo" className="sidebar-logo"/>
      </div>
      
      {/* Navigasi menu tetap sama */}
      <nav className="sidebar-nav">
        <ul>
          <li><NavLink to="/" end>Dashboard</NavLink></li>
          <li><NavLink to="/packing">Mode Packing</NavLink></li>
          <li><NavLink to="/kelola-produk">Kelola Produk</NavLink></li>
          <li><NavLink to="/add-product">Add Product</NavLink></li>
          <li><NavLink to="/manajemen-kategori">Kategori</NavLink></li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;