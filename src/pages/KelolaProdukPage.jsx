import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getProducts, updateBulkProductStatus, deleteBulkProducts, getProductById } from '../api/api';
import ProductForm from '../components/ProductForm';

const KelolaProdukPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [loading, setLoading] = useState(true);
  const selectAllCheckboxRef = useRef(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { searchTerm, sortOrder };
      const response = await getProducts(params);
      setProducts(response.data);
    } catch (err) {
      console.error("Gagal mengambil data produk!", err);
      alert(err.response?.data?.message || "Gagal mengambil data produk.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortOrder]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const allProductIds = products.map(p => p.id);
      const isAllSelected = products.length > 0 && selectedProducts.size === products.length;
      selectAllCheckboxRef.current.checked = isAllSelected;
      selectAllCheckboxRef.current.indeterminate = !isAllSelected && Array.from(selectedProducts).some(id => allProductIds.includes(id));
    }
  }, [selectedProducts, products]);

  const handleSelect = (productId) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(new Set(products.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedProducts.size === 0) {
      alert("Pilih setidaknya satu produk.");
      return;
    }
    const productIds = Array.from(selectedProducts);
    const actionText = action === 'hapus' ? 'menghapus permanen' : `mengubah status menjadi "${action}"`;
    
    if (window.confirm(`Anda yakin ingin ${actionText} ${productIds.length} produk?`)) {
      try {
        setLoading(true);
        if (action === 'hapus') {
          await deleteBulkProducts(productIds);
        } else {
          await updateBulkProductStatus(productIds, action);
        }
        alert('Aksi berhasil dijalankan!');
        fetchProducts();
        setSelectedProducts(new Set());
      } catch (error) {
        const errorMessage = error.response?.data?.message || `Gagal melakukan aksi ${action}.`;
        alert(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = async (productId) => {
    try {
      const response = await getProductById(productId);
      setProductToEdit(response.data);
      setIsModalOpen(true);
    } catch (error) {
      alert('Gagal mengambil data produk untuk diedit.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProductToEdit(null);
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div>
      <h1 className="page-title">Kelola Produk</h1>
      <section className="deals-details">
        <div className="deals-header">
          <h2>Semua Produk</h2>
          <div className="controls-wrapper">
            <input type="text" placeholder="Search ID or Name" className="search-bar" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <button className="bulk-action-btn btn-arsip" onClick={() => handleBulkAction('Arsip')}>Arsipkan</button>
            <button className="bulk-action-btn btn-aktif" onClick={() => handleBulkAction('Aktif')}>Aktifkan</button>
            <button className="bulk-action-btn btn-hapus" onClick={() => handleBulkAction('hapus')}>Hapus</button>
            <select className="sort-by" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" ref={selectAllCheckboxRef} onChange={handleSelectAll} /></th>
                <th>ID Product</th>
                <th>Nama Produk</th>
                <th>Varian</th>
                <th>Harga Varian</th>
                <th>Harga PO</th>
                <th>Stock</th>
                <th>Terjual</th>
                <th>Harga Total</th>
                <th>Status</th>
                <th>Opsi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? ( <tr><td colSpan="11" style={{ textAlign: 'center' }}>Memuat data produk...</td></tr> ) : (
                products.map(product => {
                  const isVariantProduct = product.variants.length > 1 || (product.variants.length === 1 && product.variants[0].namaVarian !== 'Default');
                  
                  return (
                    <tr key={product.id}>
                      <td><input type="checkbox" checked={selectedProducts.has(product.id)} onChange={() => handleSelect(product.id)} /></td>
                      <td>#{product.idProduk}</td>
                      <td>{product.namaProduk}</td>
                      <td>
                        {isVariantProduct ? product.variants.map(v => <div key={v.id}>{v.namaVarian}</div>) : '-'}
                      </td>
                      <td>
                        {isVariantProduct ? product.variants.map(v => <div key={v.id}>{formatCurrency(v.harga)}</div>) : '-'}
                      </td>
                      <td>{product.isPO ? formatCurrency(product.hargaPO) : '-'}</td>
                      <td>
                        {isVariantProduct ? product.variants.map(v => <div key={v.id}>{v.stok}</div>) : product.variants[0]?.stok}
                      </td>
                      <td>
                        {isVariantProduct ? product.variants.map(v => <div key={v.id}>{v.terjual || 0}</div>) : product.totalTerjual || 0}
                      </td>
                      <td>
                        {product.isPO 
                          ? formatCurrency(product.hargaTotalPO)
                          : (isVariantProduct 
                              ? product.variants.map(v => <div key={v.id}>{formatCurrency(v.harga)}</div>) 
                              : formatCurrency(product.variants[0]?.harga))
                        }
                      </td>
                      <td><span className={`status ${product.status.toLowerCase()}`}>{product.status}</span></td>
                      <td><button onClick={() => handleEdit(product.id)} className="edit-btn">Edit</button></td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Produk</h2>
              <button onClick={handleCloseModal} className="modal-close-btn">&times;</button>
            </div>
            <div className="modal-body">
              <ProductForm
                initialData={productToEdit}
                onFormSubmit={() => {
                  handleCloseModal();
                  fetchProducts();
                }}
                onClose={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaProdukPage;