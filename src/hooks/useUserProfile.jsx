// src/hooks/useUserProfile.jsx

import { useState, useEffect } from 'react';
import { getUserProfile } from '../api/api';
import { useAuth } from '../context/AuthContext';

const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data } = await getUserProfile();
        setUserProfile(data);
      } catch (error) {
        console.error("Gagal mengambil profil pengguna:", error);
        setUserProfile(null);
      }
    };

    fetchProfile();
    
  }, [currentUser]);

  return userProfile;
};

// PASTIKAN BARIS INI MENGGUNAKAN "export default"
export default useUserProfile;