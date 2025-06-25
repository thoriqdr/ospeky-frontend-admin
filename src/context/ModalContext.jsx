// src/context/ModalContext.jsx (Diperbarui)

import React, { createContext, useState, useContext } from 'react';

const ModalContext = createContext();

export function useModal() {
  return useContext(ModalContext);
}

export const ModalProvider = ({ children }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // --- STATE BARU UNTUK MODAL ONBOARDING ---
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // --- FUNGSI BARU UNTUK MODAL ONBOARDING ---
  const openOnboardingModal = () => setIsOnboardingModalOpen(true);
  const closeOnboardingModal = () => setIsOnboardingModalOpen(false);

  const value = {
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    // --- EKSPOR STATE & FUNGSI BARU ---
    isOnboardingModalOpen,
    openOnboardingModal,
    closeOnboardingModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};