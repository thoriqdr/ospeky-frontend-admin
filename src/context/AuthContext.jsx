// src/context/AuthContext.jsx (Versi Final untuk arsitektur Prisma)

import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import api from '../api/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fungsi login standar
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Fungsi logout
  function logout() {
    return signOut(auth);
  }

  // Fungsi login Google yang berkomunikasi dengan backend Prisma
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    
    // Kirim token ke backend, backend akan menangani pembuatan/pencarian user di Prisma
    const response = await api.post('/auth/google', { token });
    
    // Kembalikan respons dari backend, yang berisi { user, isNewUser }
    return response.data;
  }

  // Fungsi manajemen password
  function changeUserPassword(oldPassword, newPassword) {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    return reauthenticateWithCredential(user, credential).then(() => {
        return updatePassword(user, newPassword);
    });
  }

  function forgotPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Listener untuk status autentikasi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Mengekspor semua fungsi yang akan digunakan di aplikasi
  const value = {
    currentUser,
    login,
    logout,
    loginWithGoogle,
    changeUserPassword,
    forgotPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};