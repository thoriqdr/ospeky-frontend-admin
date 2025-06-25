import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getOrders, getDashboardKpi, bulkUpdateOrderStatus } from '../api/api';
import KpiCard from '../components/KpiCard';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const DashboardPage = () => {
    const [kpiData, setKpiData] = useState({});
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [sortFilter, setSortFilter] = useState('newest');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrders, setSelectedOrders] = useState(new Set());
    const [bulkActionStatus, setBulkActionStatus] = useState('');

    const selectAllCheckboxRef = useRef(null);

    const formatOrderStatus = (status) => {
        if (status === 'MENUNGGU_PELUNASAN') {
            return 'PELUNASAN';
        }
        return status.replace(/_/g, ' ');
    };

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const kpiResponse = await getDashboardKpi();
            setKpiData(kpiResponse.data);

            let params = { searchTerm };
            const allStatuses = ['MENUNGGAK', 'MENUNGGU_PELUNASAN', 'LUNAS', 'DIPROSES', 'DIKIRIM', 'SELESAI', 'DIBATALKAN'];

            if (allStatuses.includes(sortFilter)) {
                params.status = sortFilter;
            } else {
                params.sortOrder = sortFilter;
            }

            const ordersResponse = await getOrders(params);
            setOrders(ordersResponse.data);

        } catch (err) {
            setError("Gagal memuat data. Pastikan server backend berjalan.");
        } finally {
            setLoading(false);
        }
    }, [sortFilter, searchTerm]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            const allVisibleIds = orders.map(o => o.id);
            const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedOrders.has(id));
            selectAllCheckboxRef.current.checked = isAllSelected;
            selectAllCheckboxRef.current.indeterminate = !isAllSelected && selectedOrders.size > 0 && Array.from(selectedOrders).some(id => allVisibleIds.includes(id));
        }
    }, [selectedOrders, orders]);

    const handleBulkUpdate = async () => {
        if (selectedOrders.size === 0 || !bulkActionStatus) {
            alert("Pilih setidaknya satu pesanan dan satu status tujuan.");
            return;
        }

        const statusText = bulkActionStatus.replace(/_/g, ' ').toLowerCase();
        if (window.confirm(`Anda yakin ingin mengubah ${selectedOrders.size} pesanan menjadi "${statusText}"?`)) {
            try {
                await bulkUpdateOrderStatus(Array.from(selectedOrders), bulkActionStatus);
                alert("Status pesanan berhasil diperbarui!");
                setSelectedOrders(new Set());
                setBulkActionStatus('');
                fetchDashboardData();
            } catch (error) {
                alert("Gagal memperbarui status pesanan.");
            }
        }
    };

    const handleSelect = (orderId) => {
        const newSelection = new Set(selectedOrders);
        if (newSelection.has(orderId)) newSelection.delete(orderId);
        else newSelection.add(orderId);
        setSelectedOrders(newSelection);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedOrders(new Set(orders.map(o => o.id)));
        else setSelectedOrders(new Set());
    };

    const formatRupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(value || 0);
    const formatDate = (dateString) => dateString ? format(new Date(dateString), 'dd.MM.yyyy - HH:mm', { locale: id }) : '-';

    return (
        <div>
            <h1 className="page-title">Dashboard</h1>

            <div className="kpi-grid">
                <KpiCard title="Total User" value={formatNumber(kpiData.totalUser)} icon={<img src="/icons/user.svg" alt="User Icon" />} />
                <KpiCard title="Total Order" value={formatNumber(kpiData.totalOrder)} icon={<img src="/icons/order.svg" alt="Order Icon" />} />
                <KpiCard title="Pendapatan (30d)" value={formatRupiah(kpiData.totalPendapatan).replace(",00", "")} icon={<img src="/icons/graph.svg" alt="Graph Icon" />} />
                <KpiCard title="Lunas" value={formatNumber(kpiData.lunasCount)} icon={<img src="/icons/rp.svg" alt="Rp Icon" />} />
                <KpiCard title="Menunggu Pelunasan" value={formatNumber(kpiData.menungguPelunasanCount)} icon={<img src="/icons/time.svg" alt="Time Icon" />} />
                <KpiCard title="Menunggak" value={formatNumber(kpiData.nunggakCount)} icon={<img src="/icons/alert.svg" alt="Alert Icon" />} />
                <KpiCard
                    title="Total Selesai"
                    value={formatNumber(kpiData.selesaiCount)}
                    icon={<img src="/icons/selesai.svg" alt="Selesai Icon" />}
                    iconWrapperClass="selesai"
                />
                <KpiCard
                    title="Total Dibatalkan"
                    value={formatNumber(kpiData.dibatalkanCount)}
                    icon={<img src="/icons/dibatalkan.svg" alt="Batal Icon" />}
                    iconWrapperClass="dibatalkan"
                />
            </div>

            <section className="deals-details">
                <div className="deals-header">
                    <h2>Deals Details</h2>
                    <div className="controls-wrapper">
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cari (#ID, Nama, Produk...)" className="search-bar" />
                        <select className="sort-by" value={sortFilter} onChange={e => setSortFilter(e.target.value)}>
                            <option value="newest">Urutkan: Terbaru</option>
                            <option value="oldest">Urutkan: Terlama</option>
                            <option disabled>──────────</option>
                            <option value="ALL">Filter: Semua Status</option>
                            <option value="LUNAS">Status: Lunas</option>
                            <option value="MENUNGGU_PELUNASAN">Status: Pelunasan</option>
                            <option value="MENUNGGAK">Status: Menunggak</option>
                            <option value="SELESAI">Status: Selesai</option>
                            <option value="DIBATALKAN">Status: Dibatalkan</option>
                        </select>
                        <select className="sort-by" value={bulkActionStatus} onChange={e => setBulkActionStatus(e.target.value)}>
                            <option value="">Ubah Status ke...</option>
                            <option value="DIBATALKAN">Dibatalkan</option>
                            <option value="MENUNGGAK">Menunggak</option>
                            <option value="MENUNGGU_PELUNASAN">Pelunasan</option>
                            <option value="LUNAS">Lunas</option>
                            <option value="DIPROSES">Diproses</option>
                            <option value="DIKIRIM">Dikirim</option>
                            <option value="SELESAI">Selesai</option>
                        </select>
                        <button className="btn-primary" onClick={handleBulkUpdate} disabled={selectedOrders.size === 0 || !bulkActionStatus}>
                            Konfirmasi Perubahan
                        </button>
                    </div>
                </div>
                <div className="table-container">
                    {loading ? <p style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</p> : error ? <p style={{ color: 'red', textAlign: 'center', padding: '2rem' }}>{error}</p> :
                        <table>
                            <thead>
                                <tr>
                                    <th><input type="checkbox" ref={selectAllCheckboxRef} onChange={handleSelectAll} /></th>
                                    <th className="th-id">ID Pesanan</th>
                                    <th>Produk</th>
                                    <th>Nama</th>
                                    <th>Total Harga</th>
                                    <th>Sudah Dibayarkan</th>
                                    <th>Pembayaran Akhir</th>
                                    <th>Barang Diterima</th>
                                    <th className="th-status">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td><input type="checkbox" checked={selectedOrders.has(order.id)} onChange={() => handleSelect(order.id)} /></td>
                                        <td className="td-id">#{order.id.substring(0, 7).toUpperCase()}</td>
                                        <td className="td-scroll-content-container">
                                            <div className="td-scroll-content">
                                                {/* --- PERBAIKAN LOGIKA FALLBACK DI SINI --- */}
                                                {order.detailPesanan.map(item => {
                                                    const displayName = item.namaProdukSnapshot || item.produk?.namaProduk || '[Produk Dihapus]';
                                                    const variantName = (item.variant && item.variant.namaVarian !== 'Default') ? ` (${item.variant.namaVarian})` : '';
                                                    // Jika nama snapshot sudah mengandung varian, kita tidak perlu menambahkannya lagi
                                                    const finalName = item.namaProdukSnapshot ? item.namaProdukSnapshot : `${displayName}${variantName}`;
                                                    return (
                                                        <div key={item.id}>
                                                            {item.jumlah}x {finalName}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </td>
                                        <td className="td-scroll-content-container">
                                            <div className="td-scroll-content">{order.user.nama}</div>
                                        </td>
                                        <td>{formatRupiah(order.total)}</td>
                                        <td className="td-payment-details">
                                            {order.jumlahDp ? formatRupiah(order.jumlahDp) : '-'}
                                            {order.tanggalDp && <span>{formatDate(order.tanggalDp)}</span>}
                                        </td>
                                        <td className="td-payment-details">
                                            {order.jumlahPelunasan ? formatRupiah(order.jumlahPelunasan) : '-'}
                                            {order.tanggalPelunasan && <span>{formatDate(order.tanggalPelunasan)}</span>}
                                        </td>
                                        <td className="td-payment-details">
                                            <span>{order.status === 'SELESAI' ? formatDate(order.updatedAt) : '-'}</span>
                                        </td>
                                        <td><span className={`status ${(order.status || '').replace(/_/g, '-').toLowerCase()}`}>{formatOrderStatus(order.status)}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    }
                </div>
            </section>
        </div>
    );
};

export default DashboardPage;