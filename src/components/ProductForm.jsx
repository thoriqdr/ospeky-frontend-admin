import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

console.log("--- PRODUCT FORM VERSI FINAL DIMUAT ---");

const API_PRODUCT_URL = 'http://localhost:5000/api/products';
const API_CATEGORY_URL = 'http://localhost:5000/api/categories';
const BASE_URL = 'http://localhost:5000';

const ProductForm = ({ initialData, onFormSubmit, onClose }) => {
    const navigate = useNavigate();
    const isEditMode = !!initialData;

    // Definisi semua state
    const [productName, setProductName] = useState('');
    const [description, setDescription] = useState('');
    const [isPO, setIsPO] = useState(false);
    const [hargaPO, setHargaPO] = useState('');
    const [stokPO, setStokPO] = useState('');
    const [hargaTotalTipe, setHargaTotalTipe] = useState('nanti');
    const [hargaTotalPO, setHargaTotalPO] = useState('');
    const [mainImages, setMainImages] = useState([]);
    const [pricingType, setPricingType] = useState('single');
    const [singlePrice, setSinglePrice] = useState('');
    const [singleStock, setSingleStock] = useState('');
    const [variants, setVariants] = useState([{ id: Date.now(), name: '', price: '', stock: '', imageFile: null, imagePreview: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const mainImageInputRef = useRef(null);
    const [universitasList, setUniversitasList] = useState([]);
    const [fakultasList, setFakultasList] = useState([]);
    const [selectedUniversitas, setSelectedUniversitas] = useState('');
    const [selectedFakultas, setSelectedFakultas] = useState('');
    const [isFakultasLoading, setIsFakultasLoading] = useState(false);

    useEffect(() => {
    console.log("STATE VARIANTS BERUBAH:", JSON.stringify(variants, null, 2));
    }, [variants]);

    // Mengambil daftar universitas
    useEffect(() => {
        axios.get(`${API_CATEGORY_URL}/universitas?status=Aktif`)
            .then(response => { setUniversitasList(response.data); })
            .catch(error => { console.error("Gagal memuat daftar universitas:", error); });
    }, []);

    // Mengisi data awal saat mode edit
    useEffect(() => {
        if (isEditMode && initialData) {
            setProductName(initialData.namaProduk || '');
            setDescription(initialData.deskripsi || '');

            const mainImageUrls = initialData.gambarUrls && typeof initialData.gambarUrls === 'string' ? JSON.parse(initialData.gambarUrls) : [];
            setMainImages(mainImageUrls.map(url => ({ file: null, preview: `${BASE_URL}/${url}` })));

            if (initialData.isPO) {
                setIsPO(true);
                setHargaPO(initialData.hargaPO || '');
                setStokPO(initialData.stokPO || '');
                if (initialData.hargaTotalPO) {
                    setHargaTotalTipe('langsung');
                    setHargaTotalPO(initialData.hargaTotalPO);
                } else {
                    setHargaTotalTipe('nanti');
                }
            } else {
                setIsPO(false);
                // Logika utama untuk menentukan mode harga
                if (initialData.variants && initialData.variants.length > 1 || (initialData.variants.length === 1 && initialData.variants[0].namaVarian !== 'Default')) {
                    setPricingType('variant');
                    // --- PERBAIKAN DI SINI ---
                    const variantsWithPreviews = initialData.variants.map(v => ({
                        id: v.id,
                        name: v.namaVarian,
                        price: v.harga !== null ? Number(v.harga) : '', // Pastikan ini angka
                        stock: v.stok !== null ? Number(v.stok) : '', // Pastikan ini angka
                        imageFile: null,
                        imagePreview: v.gambarUrl ? `${BASE_URL}/${v.gambarUrl}` : ''
                    }));
                    setVariants(variantsWithPreviews);
                } else {
                    setPricingType('single');
                    setSinglePrice(initialData.variants[0]?.harga || '');
                    setSingleStock(initialData.variants[0]?.stok || '');
                }
            }
            setSelectedUniversitas(initialData.universitasId || '');
        }
    }, [initialData, isEditMode]);

    // Mengambil fakultas & mengatur nilai fakultas
    useEffect(() => {
        if (!selectedUniversitas) {
            setFakultasList([]);
            setSelectedFakultas('');
            return;
        }
        let isMounted = true;
        setIsFakultasLoading(true);
        axios.get(`${API_CATEGORY_URL}/fakultas/${selectedUniversitas}`)
            .then(response => {
                if (isMounted) {
                    const umumOption = { id: 'umum', nama: 'Umum Universitas' };
                    setFakultasList([umumOption, ...response.data]);
                    if (isEditMode && initialData && initialData.universitasId === selectedUniversitas) {
                        setSelectedFakultas(initialData.fakultasId || 'umum');
                    }
                }
            })
            .catch(error => { if (isMounted) { setFakultasList([]); setSelectedFakultas(''); } })
            .finally(() => { if (isMounted) setIsFakultasLoading(false); });
        return () => { isMounted = false; };
    }, [selectedUniversitas, initialData, isEditMode]);

    // Handler untuk form
    const handleMainImageChange = (e) => { if (e.target.files && e.target.files.length > 0) { const filesArray = Array.from(e.target.files).map(file => ({ file, preview: URL.createObjectURL(file) })); setMainImages(prevImages => [...prevImages, ...filesArray]); } };
    const removeMainImage = (previewUrl) => { setMainImages(prevImages => prevImages.filter(img => img.preview !== previewUrl)); };
    const addVariant = () => { setVariants([...variants, { id: Date.now(), name: '', price: '', stock: '', imageFile: null, imagePreview: '' }]); };
    const removeVariant = (id) => { setVariants(variants.filter(v => v.id !== id)); };
    
    // --- PERBAIKAN DI SINI ---
    const handleVariantChange = (index, event) => {
        const { name, value, type } = event.target;
        const newVariants = [...variants];
        
        let finalValue = value;
        // Jika input adalah tipe number, konversi nilainya.
        // Jika kosong, biarkan string kosong agar input bisa dihapus.
        if (type === 'number' && value !== '') {
            const parsedValue = parseFloat(value);
            // Hindari NaN jika pengguna mengetik sesuatu yang bukan angka
            if (!isNaN(parsedValue)) {
                finalValue = parsedValue;
            }
        }
        
        newVariants[index][name] = finalValue;
        setVariants(newVariants);
    };

    const handleVariantImageChange = (e, index) => { const file = e.target.files?.[0]; if (file) { const newVariants = [...variants]; newVariants[index].imageFile = file; newVariants[index].imagePreview = URL.createObjectURL(file); setVariants(newVariants); } };
    const resetForm = () => { /* Implementasi reset form */ };

    // Handler utama untuk menyimpan data
    // Handler utama untuk menyimpan data (SUDAH DIPERBAIKI)
    const handleSave = async (status) => {
        if (!productName || !selectedUniversitas) { alert('Nama Produk dan Kategori Universitas wajib diisi!'); return; }
        setIsSubmitting(true);
        const formData = new FormData();

        // --- LOGIKA BARU UNTUK MENENTUKAN TIPE PRODUK ---
        let determinedTipeProduk = 'TUNGGAL'; // Default
        if (isPO) {
            // Jika ini produk PO, tentukan antara PO_DP atau PO_LANGSUNG
            determinedTipeProduk = hargaTotalTipe === 'langsung' ? 'PO_LANGSUNG' : 'PO_DP';
        } else {
            // Jika bukan produk PO, tentukan antara VARIAN atau TUNGGAL
            determinedTipeProduk = pricingType === 'variant' ? 'VARIAN' : 'TUNGGAL';
        }
        console.log("Tipe Produk yang akan dikirim:", determinedTipeProduk); // Log untuk verifikasi
        // --- AKHIR LOGIKA BARU ---

        // Menambahkan semua data ke formData
        formData.append('namaProduk', productName);
        formData.append('deskripsi', description);
        formData.append('status', status);
        formData.append('pricingType', isPO ? 'single' : pricingType);
        formData.append('isPO', String(isPO));
        formData.append('universitasId', selectedUniversitas);
        const fakultasValueToSend = selectedFakultas === 'umum' ? '' : selectedFakultas;
        formData.append('fakultasId', fakultasValueToSend);
        
        // --- TAMBAHKAN BARIS INI ---
        formData.append('tipeProduk', determinedTipeProduk);
        
        if (isPO) { formData.append('hargaPO', hargaPO); formData.append('stokPO', stokPO); formData.append('hargaTotalPO', hargaTotalTipe === 'langsung' ? hargaTotalPO : ''); }
        if (!isPO && pricingType === 'single') { formData.append('singlePrice', singlePrice); formData.append('singleStock', singleStock); }
        
        const variantDataForJson = variants.map(v => {
            const isExistingImage = v.imagePreview && v.imagePreview.startsWith(BASE_URL);
            return { name: v.name, price: v.price, stock: v.stock, existingImageUrl: v.imageFile ? '' : (isExistingImage ? v.imagePreview.replace(`${BASE_URL}/`, '') : '') };
        });

        if (!isPO && pricingType === 'variant') { formData.append('variants', JSON.stringify(variantDataForJson)); }

        const existingMainImageUrls = mainImages.filter(img => !img.file && img.preview.startsWith(BASE_URL)).map(img => img.preview.replace(`${BASE_URL}/`, ''));
        formData.append('existingImageUrls', JSON.stringify(existingMainImageUrls));
        mainImages.forEach(imageObject => { if (imageObject.file) { formData.append('productImages', imageObject.file); } });

        if (!isPO && pricingType === 'variant') {
            variants.forEach((variant, index) => {
                if (variant.imageFile) { formData.append(`variantImage_${index}`, variant.imageFile); }
            });
        }
        
        try {
            if (isEditMode) {
                await axios.patch(`${API_PRODUCT_URL}/${initialData.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                alert('Produk berhasil diperbarui!');
                if (onFormSubmit) onFormSubmit();
            } else {
                await axios.post(API_PRODUCT_URL, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                alert(`Produk berhasil disimpan dengan status: ${status}`);
                navigate('/kelola-produk');
            }
        } catch (error) {
            alert('Gagal menyimpan perubahan.');
            console.error(error.response?.data || error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="add-product-form">
            <div className="form-card">
                <h3>Foto & Informasi Produk</h3>
                <div className="form-group"><label>Foto Produk</label><div className="horizontal-image-grid">{mainImages.map((image) => (<div key={image.preview} className="image-preview-wrapper"><img src={image.preview} alt="preview" className="image-preview" /><button onClick={() => removeMainImage(image.preview)} className="remove-image-btn">×</button></div>))}<div className="image-uploader-box" onClick={() => mainImageInputRef.current.click()}><span>+</span><p>Tambah Foto</p><input type="file" multiple ref={mainImageInputRef} onChange={handleMainImageChange} style={{ display: 'none' }} accept="image/*" /></div></div></div>
                <div className="form-group"><label>Nama Produk</label><input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Masukkan nama produk..." /></div>
                <div className="form-group"><label>Deskripsi Produk</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="6" placeholder="Jelaskan detail produk di sini..."></textarea></div>
            </div>
            <div className="form-card"><h3>Harga, Stok & Pre-Order</h3><div className="form-group"><label className="checkbox-label"><input type="checkbox" checked={isPO} onChange={(e) => setIsPO(e.target.checked)} /> Aktifkan Pre-order?</label></div>{isPO ? (<div className="po-section"><div className="form-grid-2"><div className="form-group"><label>Harga Pre-Order (DP)</label><input type="number" value={hargaPO} onChange={(e) => setHargaPO(e.target.value)} placeholder="Contoh: 50000" /></div><div className="form-group"><label>Stok Pre-Order</label><input type="number" value={stokPO} onChange={(e) => setStokPO(e.target.value)} placeholder="0" /></div></div><div className="form-group"><label>Harga Total Pre-Order</label><div className="radio-group-horizontal"><label><input type="radio" name="hargaTotalTipe" value="langsung" checked={hargaTotalTipe === 'langsung'} onChange={(e) => setHargaTotalTipe(e.target.value)} /> Langsung Isi</label><label><input type="radio" name="hargaTotalTipe" value="nanti" checked={hargaTotalTipe === 'nanti'} onChange={(e) => setHargaTotalTipe(e.target.value)} /> Isi Nanti</label></div>{hargaTotalTipe === 'langsung' && ( <input type="number" value={hargaTotalPO} onChange={(e) => setHargaTotalPO(e.target.value)} placeholder="Masukkan harga total" style={{ marginTop: '1rem' }} /> )}</div></div>) : (<fieldset className="price-fieldset"><div className="pricing-toggle"><label><input type="radio" name="pricingType" value="single" checked={pricingType === 'single'} onChange={() => setPricingType('single')} /> Harga Tunggal</label><label><input type="radio" name="pricingType" value="variant" checked={pricingType === 'variant'} onChange={() => setPricingType('variant')} /> Harga Bervariasi</label></div>{pricingType === 'single' ? (<div className="form-grid-2"><div className="form-group"><label>Harga</label><input type="number" value={singlePrice} onChange={(e) => setSinglePrice(e.target.value)} placeholder="0" /></div><div className="form-group"><label>Stok</label><input type="number" value={singleStock} onChange={(e) => setSingleStock(e.target.value)} placeholder="0" /></div></div>) : (<div className="variant-section">{variants.map((variant, index) => (<div className="variant-row" key={variant.id}><div className="variant-image-uploader" onClick={() => document.getElementById(`variant-image-input-${index}`).click()}><input type="file" id={`variant-image-input-${index}`} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleVariantImageChange(e, index)} />{variant.imagePreview ? (<img src={variant.imagePreview} alt="Varian" className="image-preview" />) : (<span>+</span>)}</div><div className="variant-details"><div className="variant-group"><label>Nama Varian</label><input type="text" name="name" value={variant.name} onChange={e => handleVariantChange(index, e)} /></div><div className="variant-group"><label>Harga</label><input type="number" name="price" value={variant.price} onChange={e => handleVariantChange(index, e)} /></div><div className="variant-group"><label>Stok</label><input type="number" name="stock" value={variant.stock} onChange={e => handleVariantChange(index, e)} /></div></div>{variants.length > 1 && <button type="button" className="remove-variant-btn" onClick={() => removeVariant(variant.id)}>×</button>}</div>))}{<button type="button" className="add-variant-btn" onClick={addVariant}>+ Tambah Varian</button>}</div>)}</fieldset>)}</div>
            <div className="form-card"><h3>Kategori Universitas</h3><div className="form-grid-2"><div className="form-group"><label>Universitas</label><select value={selectedUniversitas} onChange={(e) => setSelectedUniversitas(e.target.value)}><option value="">-- Pilih Universitas --</option>{universitasList.map(univ => (<option key={univ.id} value={univ.id}>{univ.nama}</option>))}</select></div><div className="form-group"><label>Fakultas</label><select value={selectedFakultas} onChange={(e) => setSelectedFakultas(e.target.value)} disabled={!selectedUniversitas || isFakultasLoading}><option value="">{isFakultasLoading ? 'Memuat...' : '-- Pilih Fakultas --'}</option>{fakultasList.map(fak => (<option key={fak.id} value={fak.id}>{fak.nama}</option>))}</select></div></div></div>
            <div className="form-actions">{isEditMode && <button type="button" className="btn-delete" onClick={onClose} disabled={isSubmitting}>Batal</button>}{!isEditMode && <button type="button" className="btn-delete" onClick={resetForm} disabled={isSubmitting}>Reset Form</button>}<button type="button" className="btn-secondary" onClick={() => handleSave('Arsip')} disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan & Arsipkan' : 'Simpan & Arsipkan')}</button><button type="button" className="btn-primary" onClick={() => handleSave('Aktif')} disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Simpan & Tampilkan')}</button></div>
        </div>
    );
};

export default ProductForm;