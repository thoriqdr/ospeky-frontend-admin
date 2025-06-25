// src/context/CartContext.jsx

import React, { createContext, useState, useEffect } from 'react';

// 1. Membuat Context itu sendiri
export const CartContext = createContext();

// 2. Membuat "Provider" komponen
// Komponen ini akan menyediakan state dan fungsi ke seluruh aplikasi
export const CartProvider = ({ children }) => {
  // State utama kita: array dari item di keranjang
  // Kita coba ambil dari localStorage dulu, jika tidak ada, mulai dengan array kosong
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem('ospekyCart');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      return [];
    }
  });

  // Setiap kali cartItems berubah, simpan ke localStorage
  useEffect(() => {
    localStorage.setItem('ospekyCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Fungsi untuk menambah item ke keranjang
  const addToCart = (item) => {
    setCartItems(prevItems => {
      // Cek apakah item (berdasarkan variantId) sudah ada di keranjang
      const existingItem = prevItems.find(i => i.variantId === item.variantId);

      if (existingItem) {
        // Jika sudah ada, tambahkan quantity-nya saja
        return prevItems.map(i =>
          i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        // Jika belum ada, tambahkan item baru, plus properti 'selected'
        return [...prevItems, { ...item, selected: true }];
      }
    });
  };

  // Fungsi untuk menghapus item dari keranjang
  const removeFromCart = (variantId) => {
    setCartItems(prevItems => prevItems.filter(i => i.variantId !== variantId));
  };

  // Fungsi untuk memperbarui jumlah item
  const updateQuantity = (variantId, newQuantity) => {
    if (newQuantity < 1) return; // Jumlah tidak boleh kurang dari 1
    setCartItems(prevItems =>
      prevItems.map(i =>
        i.variantId === variantId ? { ...i, quantity: newQuantity } : i
      )
    );
  };

  // Fungsi untuk toggle status 'selected' pada satu item
  const toggleItemSelected = (variantId) => {
    setCartItems(prevItems =>
      prevItems.map(i =>
        i.variantId === variantId ? { ...i, selected: !i.selected } : i
      )
    );
  };

  // Fungsi untuk memilih atau tidak memilih semua item
  const toggleSelectAll = (isSelected) => {
    setCartItems(prevItems =>
      prevItems.map(i => ({ ...i, selected: isSelected }))
    );
  };

  // Nilai yang akan disediakan oleh Provider
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleItemSelected,
    toggleSelectAll,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};