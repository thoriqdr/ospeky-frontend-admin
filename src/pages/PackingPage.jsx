import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getOrders, updatePackingStatus, generateSequenceNumbers, getPrefixes, resetSequence } from '../api/api';
import QRCode from 'qrcode';

const PackingPage = () => {
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortOrder, setSortOrder] = useState('newest');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedOrders, setSelectedOrders] = useState(new Set());

    const [generatePrefix, setGeneratePrefix] = useState('A');
    const [isGenerating, setIsGenerating] = useState(false);
    const [availablePrefixes, setAvailablePrefixes] = useState([]);
    const [selectedPrefixToReset, setSelectedPrefixToReset] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const selectAllCheckboxRef = useRef(null);

    const formatOrderStatus = (status) => {
        if (status === 'MENUNGGU_PELUNASAN') {
            return 'PELUNASAN';
        }
        return (status || '').replace(/_/g, ' ');
    };

    const fetchPackingOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                source: 'packing',
                sortOrder,
                searchTerm
            };
            if (statusFilter !== 'ALL') {
                params.status = statusFilter;
            }

            const response = await getOrders(params);
            setAllOrders(response.data);
        } catch (err) {
            setError("Gagal memuat data. Pastikan server backend berjalan.");
        } finally {
            setLoading(false);
        }
    }, [sortOrder, searchTerm, statusFilter]);

    useEffect(() => {
        const fetchPrefixes = async () => {
            try {
                const response = await getPrefixes();
                setAvailablePrefixes(response.data);
                if (response.data.length > 0 && !selectedPrefixToReset) {
                    setSelectedPrefixToReset(response.data[0]);
                }
            } catch (error) { console.error("Gagal mengambil prefix:", error); }
        };
        fetchPrefixes();
    }, []);

    useEffect(() => { fetchPackingOrders(); }, [fetchPackingOrders]);

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            const allVisibleIds = allOrders.map(o => o.id);
            const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedOrders.has(id));
            selectAllCheckboxRef.current.checked = isAllSelected;
            selectAllCheckboxRef.current.indeterminate = !isAllSelected && selectedOrders.size > 0 && Array.from(selectedOrders).some(id => allVisibleIds.includes(id));
        }
    }, [selectedOrders, allOrders]);

    const handleGenerateId = async () => {
        if (selectedOrders.size === 0) {
            alert("Pilih setidaknya satu pesanan.");
            return;
        }

        const alreadyHasId = Array.from(selectedOrders).some(id => {
            const order = allOrders.find(o => o.id === id);
            return order && order.nomorUrutAngka;
        });

        if (alreadyHasId) {
            alert("Beberapa pesanan yang dipilih sudah memiliki Nomor Urut. Hapus centang untuk melanjutkan.");
            return;
        }

        const prefix = generatePrefix.trim().toUpperCase();
        if (!prefix) {
            alert("Prefix tidak boleh kosong.");
            return;
        }

        setIsGenerating(true);
        try {
            const orderIdsToGenerate = Array.from(selectedOrders);
            const response = await generateSequenceNumbers(orderIdsToGenerate, prefix);
            alert(response.data.message);
            setSelectedOrders(new Set());
            fetchPackingOrders();
            const prefixResponse = await getPrefixes();
            setAvailablePrefixes(prefixResponse.data);
        } catch (err) {
            alert(err.response?.data?.message || "Gagal generate ID. Coba kurangi jumlah pesanan yang dipilih atau periksa log server.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleResetSequence = async () => {
        if (!selectedPrefixToReset) {
            alert("Pilih prefix yang akan direset.");
            return;
        }
        const isConfirmed = window.confirm(`Anda YAKIN ingin mereset nomor urut untuk prefix "${selectedPrefixToReset}"? Nomor baru akan dimulai dari 1 lagi.\nTINDAKAN INI TIDAK BISA DIBATALKAN.`);
        if (!isConfirmed) return;
        const promptConfirmation = window.prompt(`Untuk konfirmasi akhir, ketik "${selectedPrefixToReset}" di bawah ini.`);
        if (promptConfirmation !== selectedPrefixToReset) {
            alert("Konfirmasi tidak cocok. Proses reset dibatalkan.");
            return;
        }
        setIsResetting(true);
        try {
            const response = await resetSequence(selectedPrefixToReset);
            alert(response.data.message);
        } catch (error) {
            alert("Gagal mereset nomor urut.");
        } finally {
            setIsResetting(false);
        }
    };

    const handleSelect = (orderId) => {
        const newSelection = new Set(selectedOrders);
        if (newSelection.has(orderId)) newSelection.delete(orderId);
        else newSelection.add(orderId);
        setSelectedOrders(newSelection);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedOrders(new Set(allOrders.map(o => o.id)));
        else setSelectedOrders(new Set());
    };

    const handleBulkUpdatePacking = async (newStatus) => {
        if (selectedOrders.size === 0) {
            alert("Pilih setidaknya satu pesanan untuk diupdate.");
            return;
        }
        const statusText = newStatus.replace(/_/g, ' ').toLowerCase();
        if (window.confirm(`Anda yakin ingin mengubah status ${selectedOrders.size} pesanan menjadi "${statusText}"?`)) {
            try {
                const orderIdsToUpdate = Array.from(selectedOrders);
                const response = await updatePackingStatus(orderIdsToUpdate, newStatus);
                alert(response.data.message);
                setSelectedOrders(new Set());
                fetchPackingOrders();
            } catch (err) {
                console.error("Gagal update status packing:", err);
                alert("Terjadi kesalahan saat mengupdate status.");
            }
        }
    };

    const handleCetakResi = async () => {
        if (selectedOrders.size === 0) {
            alert("Pilih setidaknya satu pesanan untuk mencetak resi.");
            return;
        }
        if (window.confirm(`Cetak resi untuk ${selectedOrders.size} pesanan? Pastikan printer thermal sudah siap!`)) {
            const selectedOrdersData = allOrders.filter(order => selectedOrders.has(order.id));
            let allResiHtml = '';

            const allQrCodes = await Promise.all(selectedOrdersData.map(order => {
                return QRCode.toString(order.id, { type: 'svg', margin: 1, color: { dark: '#000000FF', light: '#FFFFFFFF' } });
            }));

            for (let i = 0; i < selectedOrdersData.length; i++) {
                const order = selectedOrdersData[i];
                const svgQRCode = allQrCodes[i];
                const nomorResi = `${order.nomorUrutPrefix}${String(order.nomorUrutAngka).padStart(4, '0')}`;
                
                allResiHtml += `
                    <div class="resi-label">
                        <div class="header">
                            <img src="./icons/logo.svg" class="logo-img" alt="Ospeky Logo">
                            <div class="order-id">
                                <span>ORDER ID</span>
                                ${order.id.substring(0, 8).toUpperCase()}
                            </div>
                        </div>
                        <div class="top-content">
                            <div class="address-section">
                                <span class="section-title">PENERIMA PAKET:</span>
                                <h2>${order.alamatPengiriman?.namaPenerima || order.user.nama}</h2>
                                <p>${order.alamatPengiriman?.nomorTelepon || order.user.nomorHp || ''}</p>
                                <p>${order.alamatPengiriman?.detailAlamat || 'Ambil di Tempat'}<br>
                                   ${order.alamatPengiriman?.kecamatan || ''}, ${order.alamatPengiriman?.kota || ''}
                                </p>
                            </div>
                            <div class="shipping-info">
                                <div class="resi-code">
                                    <span class="section-title">KODE RESI:</span>
                                    <p>${nomorResi}</p>
                                </div>
                                <div class="qr-code">
                                    ${svgQRCode}
                                    <span class="scan-me">Scan Me!</span>
                                </div>
                            </div>
                        </div>
                        <div class="main-content">
                            <div class="product-list">
                                <span class="section-title">ISI PAKET:</span>
                                <ul>
                                    ${order.detailPesanan.map(item => {
                                        // --- PERBAIKAN LOGIKA FALLBACK DI SINI ---
                                        const displayName = item.namaProdukSnapshot || item.produk?.namaProduk || '[Produk Dihapus]';
                                        return `<li><span>${item.jumlah}x</span> ${displayName}</li>`;
                                    }).join('')}
                                </ul>
                            </div>
                            ${order.catatan ? `
                            <div class="customer-note-section">
                                <span class="section-title">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path></svg>
                                    CATATAN PEMBELI:
                                </span>
                                <p>${order.catatan}</p>
                            </div>` : ''}
                        </div>
                        <div class="footer">
                            <p>Makasih udah order di <strong>Ospeky!</strong> 🤘<br>Kalau paketnya udah sampe, jangan lupa pamerin & tag kita ya!</p>
                        </div>
                    </div>`;
            }

            const printWindow = window.open('', '_blank');
            // --- BLOK CSS LENGKAP UNTUK PENCETAKAN RESI DIKEMBALIKAN DI SINI ---
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Resi Pengiriman - Ospeky</title>
                        <link rel="preconnect" href="https://fonts.googleapis.com">
                        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&family=Montserrat:wght@700&display=swap" rel="stylesheet">
                        <style>
                            @page {
                                size: 100mm 150mm;
                                margin: 0;
                            }
                            html, body {
                                width: 100mm;
                                height: 150mm;
                                margin: 0;
                                padding: 0;
                                font-family: 'Poppins', Arial, sans-serif;
                                font-size: 9pt;
                                -webkit-font-smoothing: antialiased;
                                -moz-osx-font-smoothing: grayscale;
                                background-color: #eee;
                            }
                            .resi-label {
                                width: 100%;
                                height: 100%;
                                padding: 6mm;
                                box-sizing: border-box;
                                display: flex;
                                flex-direction: column;
                                background-color: #fff;
                                page-break-after: always;
                                position: relative;
                            }
                            .resi-label:last-child { page-break-after: avoid; }
                            .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 4mm; border-bottom: 2px solid #000; flex-shrink: 0; }
                            .logo-img { width: auto; height: 10mm; }
                            .order-id { text-align: right; }
                            .order-id span { font-size: 7pt; color: #555; }
                            .order-id { font-size: 11pt; font-weight: 700; }
                            .top-content { display: flex; justify-content: space-between; align-items: flex-start; padding: 4mm 0; border-bottom: 1px dashed #999; flex-shrink: 0; }
                            .address-section { flex: 1; padding-right: 4mm; }
                            .address-section h2 { margin: 0; font-size: 11pt; font-weight: 700; }
                            .address-section p { margin: 1px 0 0 0; line-height: 1.4; }
                            .shipping-info { display: flex; flex-direction: column; align-items: center; text-align: center; }
                            .resi-code { padding-right: 0; text-align: center; }
                            .resi-code p { margin: 0 0 2mm 0; font-family: 'Montserrat', sans-serif; font-size: 20pt; font-weight: 700; letter-spacing: 1px; }
                            .qr-code { text-align: center; }
                            .qr-code svg { width: 28mm; height: 28mm; }
                            .scan-me { font-size: 8pt; font-weight: 700; color: #333; display: block; margin-top: 1mm; }
                            .main-content { flex-grow: 1; overflow-y: auto; min-height: 0; padding: 3mm 0; }
                            .product-list ul { margin: 0; padding-left: 15px; }
                            .product-list li { margin-bottom: 2px; }
                            .product-list li span { font-weight: 700; }
                            .customer-note-section { padding: 2.5mm; margin-top: 3mm; border: 1px solid #ddd; border-radius: 2px; }
                            .customer-note-section p { margin: 0; font-size: 8.5pt; line-height: 1.4; font-style: normal; white-space: pre-wrap; }
                            .section-title { font-size: 7pt; font-weight: 700; color: #333; margin-bottom: 2px; display: flex; align-items: center; gap: 4px; }
                            .footer { position: absolute; bottom: 6mm; left: 6mm; right: 6mm; text-align: center; border-top: 2px solid #000; padding-top: 3mm; background-color: #fff; }
                            .footer p { margin: 0; font-size: 7.5pt; line-height: 1.5; }
                        </style>
                    </head>
                    <body>${allResiHtml}</body>
                </html>`);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 700);
        }
    };

    const isCetakResiDisabled = useMemo(() => {
        if (selectedOrders.size === 0) return true;
        return Array.from(selectedOrders).some(id => {
            const order = allOrders.find(o => o.id === id);
            return !order || !order.nomorUrutAngka;
        });
    }, [selectedOrders, allOrders]);

    return (
        <div>
            <h1 className="page-title">Packing & Ekspedisi</h1>
            <div className="page-controls-card">
                <div className="control-group">
                    <input type="text" value={generatePrefix} onChange={(e) => setGeneratePrefix(e.target.value.toUpperCase())} placeholder="Masukan Kode Awal.." />
                    <button onClick={handleGenerateId} disabled={isGenerating || selectedOrders.size === 0}>{isGenerating ? 'Memproses...' : 'Klik Buat QR dan ID'}</button>
                </div>
                <div className="control-group">
                    <select value={selectedPrefixToReset} onChange={(e) => setSelectedPrefixToReset(e.target.value)}>
                        <option value="" disabled>Pilih kode untuk direset</option>
                        {availablePrefixes.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button onClick={handleResetSequence} disabled={isResetting || !selectedPrefixToReset}>{isResetting ? 'Memproses...' : 'Klik untuk reset'}</button>
                </div>
            </div>

            <section className="deals-details">
                <div className="deals-header">
                    <div className="controls-wrapper">
                        <select className="sort-by" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="ALL">Semua Status Packing</option>
                            <option value="LUNAS">Lunas</option>
                            <option value="MENUNGGU_PELUNASAN">Pelunasan</option>
                        </select>
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cari (Nama, Produk, Resi, #ID Pesanan)..." className="search-bar" />
                    </div>
                    <div className="controls-wrapper">
                        <div className="packing-actions">
                            <button className="btn-dikemas" onClick={() => handleBulkUpdatePacking('SEDANG_DIKEMAS')}>Sedang Dikemas</button>
                            <button className="btn-belum-dikemas" onClick={() => handleBulkUpdatePacking('BELUM_DIKEMAS')}>Belum Dikemas</button>
                            <button className="btn-siap-dikirim" onClick={() => handleBulkUpdatePacking('SIAP_DIKIRIM')}>Siap Dikirim</button>
                        </div>
                        <button className="btn-cetak-resi" onClick={handleCetakResi} disabled={isCetakResiDisabled}>
                            Cetak Resi
                        </button>
                        <select className="sort-by" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                            <option value="newest">Terbaru</option>
                            <option value="oldest">Terlama</option>
                        </select>
                    </div>
                </div>
                <div className="table-container">
                    {loading ? <p style={{ textAlign: 'center', padding: '2rem' }}>Memuat pesanan...</p> : error ? <p style={{ color: 'red', textAlign: 'center', padding: '2rem' }}>{error}</p> :
                        <table>
                            <thead>
                                <tr>
                                    <th><input type="checkbox" ref={selectAllCheckboxRef} onChange={handleSelectAll} /></th>
                                    <th>Packing Status</th>
                                    <th>No. Resi</th>
                                    <th>Produk</th>
                                    <th>ID Pesanan</th>
                                    <th>Nama</th>
                                    <th>Total Harga</th>
                                    <th>Pre-Order</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allOrders.length === 0 ? (
                                    <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada pesanan yang cocok.</td></tr>
                                ) : allOrders.map(order => {
                                    const nomorResi = order.nomorUrutAngka ? `${order.nomorUrutPrefix}${String(order.nomorUrutAngka).padStart(4, '0')}` : '-';
                                    return (
                                        <tr key={order.id}>
                                            <td><input type="checkbox" checked={selectedOrders.has(order.id)} onChange={() => handleSelect(order.id)} /></td>
                                            <td><span className={`status-packing ${(order.statusPacking || 'BELUM_DIKEMAS').replace(/_/g, '-').toLowerCase()}`}>{order.statusPacking.replace(/_/g, ' ')}</span></td>
                                            <td><strong>{nomorResi}</strong></td>
                                            <td className="produk-cell">
                                                {/* --- PERBAIKAN LOGIKA FALLBACK DI SINI --- */}
                                                {order.detailPesanan.map(item => {
                                                    const displayName = item.namaProdukSnapshot || item.produk?.namaProduk || '[Produk Dihapus]';
                                                    return <div key={item.id}>{item.jumlah}x {displayName}</div>
                                                })}
                                            </td>
                                            <td>#{order.id.substring(0, 8).toUpperCase()}</td>
                                            <td>{order.user.nama}</td>
                                            <td>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total)}</td>
                                            {/* --- PERBAIKAN LOGIKA FALLBACK DI SINI --- */}
                                            <td>{order.detailPesanan.some(item => (item.tipeProdukSnapshot === 'PO_DP' || item.tipeProdukSnapshot === 'PO_LANGSUNG' || item.produk?.isPO)) ? 'Ya' : 'Tidak'}</td>
                                            <td><span className={`status ${(order.status || '').replace(/_/g, '-').toLowerCase()}`}>{formatOrderStatus(order.status)}</span></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    }
                </div>
            </section>
        </div>
    );
};

export default PackingPage;