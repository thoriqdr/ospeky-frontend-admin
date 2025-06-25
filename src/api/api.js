// frontend-admin/src/api/api.js (Versi Final Lengkap)

import axios from 'axios';
import { auth } from '../firebase/firebaseConfig';

// Buat instance axios baru dengan alamat dasar backend kita
const api = axios.create({
  // Mengambil alamat dasar dari environment variable dan menambahkan '/api'
  baseURL: `${import.meta.env.VITE_API_URL}/api`, 
});

// "Interceptor" ini berjalan SEBELUM setiap permintaan dikirim
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// --- FUNGSI-FUNGSI UNTUK BERINTERAKSI DENGAN API ORDERS ---

/**
 * Mengambil data pesanan dari server dengan filter dinamis.
 */
export const getOrders = (params) => {
  return api.get('/orders', { params });
};

/**
 * Memperbarui status packing untuk beberapa pesanan sekaligus.
 */
export const updatePackingStatus = (orderIds, statusPacking) => {
  return api.patch('/orders/update-packing-status', { orderIds, statusPacking });
};

/**
 * Membuat pesanan baru.
 */
export const createOrder = (orderData) => {
  return api.post('/orders', orderData);
};

/**
 * Men-generate nomor urut untuk pesanan yang sudah ada.
 */
export const generateSequenceNumbers = (orderIds, prefix) => {
  return api.patch('/orders/generate-sequence', { orderIds, prefix });
};

/**
 * Mengambil semua prefix nomor urut yang sudah ada.
 */
export const getPrefixes = () => {
  return api.get('/orders/prefixes');
};

/**
 * Mereset counter nomor urut untuk sebuah prefix.
 */
export const resetSequence = (prefix) => {
  return api.post('/orders/reset-sequence', { prefix });
};


export const getProducts = (params) => {
  return api.get('/products', { params });
};

export const getProductById = (id) => {
  return api.get(`/products/${id}`);
};

export const updateBulkProductStatus = (ids, status) => {
  return api.patch('/products/bulk-status', { ids, status });
};

export const deleteBulkProducts = (ids) => {
  // Perhatikan cara mengirim body pada request delete dengan axios
  return api.delete('/products/bulk-delete', { data: { ids } });
};

// Tambahkan DUA FUNGSI BARU ini di frontend-admin/src/api/api.js

export const getDashboardKpi = () => {
  return api.get('/orders/dashboard-kpi');
};

export const bulkUpdateOrderStatus = (orderIds, status) => {
  return api.patch('/orders/bulk-update-status', { ids: orderIds, newStatus: status });
};

// Tambahkan di src/api/api.js jika belum ada
export const getUserProfile = () => api.get('/users/profile');

export default api;