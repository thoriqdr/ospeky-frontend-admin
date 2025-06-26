import React, { useState, useEffect } from 'react';
import api from '../api/api';
// Alamat base URL untuk API backend kita

const ProductManager = () => {
  // State untuk menyimpan daftar produk dari backend
  const [products, setProducts] = useState([]);
  // State untuk menyimpan data dari form input
  const [formData, setFormData] = useState({
    namaProduk: '',
    deskripsi: '',
    harga: '',
    stok: '',
  });
  // State untuk loading dan error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fungsi untuk mengambil data produk dari backend
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError('Gagal memuat data produk. Pastikan server backend berjalan.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // useEffect akan menjalankan fetchProducts() saat komponen pertama kali dimuat
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fungsi untuk menangani perubahan pada input form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Fungsi untuk menangani submit form (menambah produk baru)
  const handleSubmit = async (e) => {
    e.preventDefault(); // Mencegah form refresh halaman
    if (!formData.namaProduk || !formData.harga) {
      alert('Nama Produk dan Harga wajib diisi!');
      return;
    }
    setLoading(true);
    try {
      await api.post('/products', formData);
      // Setelah berhasil, kosongkan form dan ambil ulang data produk
      setFormData({ namaProduk: '', deskripsi: '', harga: '', stok: '' });
      fetchProducts();
    } catch (err) {
      setError('Gagal menambah produk baru.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Manajemen Produk Ospeky</h1>

      {/* Formulir untuk menambah produk baru */}
      <div className="form-container">
        <h2>Tambah Produk Baru</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="namaProduk"
            value={formData.namaProduk}
            onChange={handleInputChange}
            placeholder="Nama Produk"
            required
          />
          <textarea
            name="deskripsi"
            value={formData.deskripsi}
            onChange={handleInputChange}
            placeholder="Deskripsi Produk"
          />
          <input
            type="number"
            name="harga"
            value={formData.harga}
            onChange={handleInputChange}
            placeholder="Harga (contoh: 150000)"
            required
          />
          <input
            type="number"
            name="stok"
            value={formData.stok}
            onChange={handleInputChange}
            placeholder="Stok Awal"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Tambah Produk'}
          </button>
        </form>
      </div>

      {/* Menampilkan pesan error jika ada */}
      {error && <p className="error-message">{error}</p>}

      {/* Daftar semua produk */}
      <div className="product-list-container">
        <h2>Daftar Produk</h2>
        {loading && products.length === 0 ? (
          <p>Memuat produk...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nama Produk</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.namaProduk}</td>
                  <td>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.harga)}</td>
                  <td>{product.stok}</td>
                  <td>{product.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProductManager;