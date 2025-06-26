import React, { useState, useEffect, Fragment } from 'react';
// --- PERUBAHAN 1: Hapus 'axios', impor 'api' yang sudah dikonfigurasi ---
import api from '../api/api'; // Menggunakan instance axios terpusat dari api.js
import './ManajemenKategoriPage.css';

// --- PERUBAHAN 2: Hapus konstanta API_URL yang hardcoded ---
// const API_URL = 'http://localhost:5000/api/categories'; // BARIS INI DIHAPUS

const ManajemenKategoriPage = () => {
    const [universitasList, setUniversitasList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newUnivName, setNewUnivName] = useState('');
    const [newUnivLogo, setNewUnivLogo] = useState(null);
    const [parentUniv, setParentUniv] = useState('');
    const [newFakultasName, setNewFakultasName] = useState('');
    const [isSubmittingUniv, setIsSubmittingUniv] = useState(false);
    const [isSubmittingFakultas, setIsSubmittingFakultas] = useState(false);
    
    const [expandedUnivId, setExpandedUnivId] = useState(null);
    const [fakultasDetails, setFakultasDetails] = useState([]);
    const [isFakultasDetailLoading, setIsFakultasDetailLoading] = useState(false);

    const fetchUniversitas = () => {
        setIsLoading(true);
        // --- PERUBAHAN 3: Gunakan 'api' untuk semua request ---
        api.get('/categories/universitas') // Path relatif sudah cukup
            .then(res => setUniversitasList(res.data))
            .catch(err => console.error("Gagal mengambil data universitas", err))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchUniversitas();
    }, []);

    const handleUniversitasSubmit = async (e) => {
        e.preventDefault();
        if (!newUnivName || !newUnivLogo) {
            alert("Nama dan Logo Universitas wajib diisi.");
            return;
        }
        setIsSubmittingUniv(true);
        const formData = new FormData();
        formData.append('nama', newUnivName);
        formData.append('logo', newUnivLogo);
        try {
            // --- PERUBAHAN 4: Gunakan 'api' ---
            await api.post('/categories/universitas', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert('Universitas baru berhasil ditambahkan!');
            setNewUnivName('');
            setNewUnivLogo(null);
            if(document.getElementById('univ-logo-input')) document.getElementById('univ-logo-input').value = null;
            fetchUniversitas();
        } catch (error) {
            alert(error.response?.data?.message || "Gagal menambahkan universitas.");
        } finally {
            setIsSubmittingUniv(false);
        }
    };

    const handleFakultasSubmit = async (e) => {
        e.preventDefault();
        if (!newFakultasName || !parentUniv) {
            alert("Universitas dan Nama Fakultas wajib diisi.");
            return;
        }
        setIsSubmittingFakultas(true);
        try {
            // --- PERUBAHAN 5: Gunakan 'api' ---
            await api.post('/categories/fakultas', { nama: newFakultasName, universitasId: parentUniv });
            alert('Fakultas baru berhasil ditambahkan!');
            setNewFakultasName('');
            setParentUniv('');
        } catch (error) {
            alert(error.response?.data?.message || "Gagal menambahkan fakultas.");
        } finally {
            setIsSubmittingFakultas(false);
        }
    };
    
    const handleStatusChange = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Aktif' ? 'Arsip' : 'Aktif';
        if (window.confirm(`Anda yakin ingin mengubah status universitas ini menjadi "${newStatus}"?`)) {
            try {
                // --- PERUBAHAN 6: Gunakan 'api' ---
                await api.patch(`/categories/universitas/${id}/status`, { status: newStatus });
                fetchUniversitas();
            } catch (error) { alert("Gagal mengubah status."); }
        }
    };

    const handleDelete = async (id, univName) => {
        if (window.confirm(`PERINGATAN: Anda akan menghapus "${univName}" secara permanen. Lanjutkan?`)) {
            try {
                // --- PERUBAHAN 7: Gunakan 'api' ---
                await api.delete(`/categories/universitas/${id}`);
                fetchUniversitas();
            } catch (error) { alert("Gagal menghapus universitas."); }
        }
    };

    const toggleUniversity = (univId) => {
        const nextExpandedId = expandedUnivId === univId ? null : univId;
        setExpandedUnivId(nextExpandedId);

        if (nextExpandedId) {
            setIsFakultasDetailLoading(true);
            setFakultasDetails([]);
            // --- PERUBAHAN 8: Gunakan 'api' ---
            api.get(`/categories/fakultas/${nextExpandedId}`)
                .then(res => setFakultasDetails(res.data))
                .catch(err => console.error(err))
                .finally(() => setIsFakultasDetailLoading(false));
        }
    };

    const handleDeleteFakultas = async (fakultasId, fakultasName) => {
        if (window.confirm(`Anda yakin ingin menghapus fakultas "${fakultasName}"?`)) {
            try {
                // --- PERUBAHAN 9: Gunakan 'api' ---
                await api.delete(`/categories/fakultas/${fakultasId}`);
                toggleUniversity(expandedUnivId);
                toggleUniversity(expandedUnivId);
            } catch (error) { alert('Gagal menghapus fakultas.'); }
        }
    };

    return (
        <div>
            <div className="kategori-container">
                <div className="kategori-forms">
                    <div className="form-card">
                        <h3>Tambah Universitas Baru</h3>
                        <form onSubmit={handleUniversitasSubmit}>
                            <div className="form-group"><label>Nama Universitas</label><input type="text" value={newUnivName} onChange={e => setNewUnivName(e.target.value)} placeholder="Contoh: Universitas Indonesia" /></div>
                            <div className="form-group"><label>Logo Universitas</label><div className="file-input-wrapper"><label htmlFor="univ-logo-input" className="btn-file-input">Pilih File</label><input type="file" id="univ-logo-input" onChange={e => setNewUnivLogo(e.target.files[0])} accept="image/*" style={{ display: 'none' }}/><span className="file-name-display">{newUnivLogo ? newUnivLogo.name : 'Belum ada file dipilih'}</span></div></div>
                            <button type="submit" className="btn-primary" disabled={isSubmittingUniv}>{isSubmittingUniv ? 'Menyimpan...' : 'Simpan Universitas'}</button>
                        </form>
                    </div>
                    <div className="form-card">
                        <h3>Tambah Fakultas Baru</h3>
                        <form onSubmit={handleFakultasSubmit}>
                            <div className="form-group"><label>Induk Universitas</label><select value={parentUniv} onChange={e => setParentUniv(e.target.value)}><option value="">-- Pilih Universitas --</option>{universitasList.filter(u => u.status === 'Aktif').map(u => ( <option key={u.id} value={u.id}>{u.nama}</option> ))}</select></div>
                            <div className="form-group"><label>Nama Fakultas</label><input type="text" value={newFakultasName} onChange={e => setNewFakultasName(e.target.value)} placeholder="Contoh: Fakultas Hukum" /></div>
                            <button type="submit" className="btn-primary" disabled={isSubmittingFakultas}>{isSubmittingFakultas ? 'Menyimpan...' : 'Simpan Fakultas'}</button>
                        </form>
                    </div>
                </div>
                <div className="kategori-list">
                    <div className="form-card">
                        <h3 style={{marginBottom: '1.5rem'}}>Daftar Universitas</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{width: '20px'}}></th>
                                        <th>Logo</th>
                                        <th>Nama Universitas</th>
                                        <th>Status</th>
                                        <th>Opsi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (<tr><td colSpan="5" style={{textAlign: 'center'}}>Memuat...</td></tr>) : (
                                        universitasList.map(u => (
                                            <Fragment key={u.id}>
                                                <tr className="univ-row" onClick={() => toggleUniversity(u.id)}>
                                                    <td><span className={`expander ${expandedUnivId === u.id ? 'expanded' : ''}`}>▼</span></td>
                                                    {/* --- PERUBAHAN 10: Ambil baseURL dari api --- */}
                                                    <td>{u.logoUrl && <img src={`${api.defaults.baseURL.replace('/api', '')}/${u.logoUrl}`} alt={u.nama} className="univ-logo-table" />}</td>
                                                    <td>{u.nama}</td>
                                                    <td><span className={`status ${u.status.toLowerCase()}`}>{u.status}</span></td>
                                                    <td onClick={e => e.stopPropagation()}>
                                                        <div className="kategori-opsi">
                                                            <button onClick={() => handleStatusChange(u.id, u.status)} className="btn-secondary-small">{u.status === 'Aktif' ? 'Arsipkan' : 'Aktifkan'}</button>
                                                            <button onClick={() => handleDelete(u.id, u.nama)} className="btn-delete-small">Hapus</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {expandedUnivId === u.id && (
                                                    <tr className="fakultas-detail-row">
                                                        <td></td>
                                                        <td colSpan="4">
                                                            <div className="fakultas-list-wrapper">
                                                                {isFakultasDetailLoading ? (<p className="fakultas-loading">Memuat fakultas...</p>) : (
                                                                    <ul>
                                                                        {fakultasDetails.length > 0 ? fakultasDetails.map(fak => (
                                                                            <li key={fak.id}>
                                                                                <span>{fak.nama}</span>
                                                                                <button onClick={() => handleDeleteFakultas(fak.id, fak.nama)} className="btn-delete-fakultas" title="Hapus Fakultas">×</button>
                                                                            </li>
                                                                        )) : (<li>Belum ada fakultas untuk universitas ini.</li>)}
                                                                    </ul>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManajemenKategoriPage;