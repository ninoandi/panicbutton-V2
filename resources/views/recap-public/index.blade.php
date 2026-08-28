@extends('layouts.app')

@section('title', 'Recap Data Public - Panic Button')

@section('page-title', 'Recap Data Public')

@push('styles')
{{-- Leaflet CSS --}}
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
{{-- Custom Page CSS --}}
<link rel="stylesheet" href="{{ asset('css/recap-public.css') }}">
@endpush

@section('content')
<div class="recap-public-page">

    {{-- =========================================================
         1. HEADER BANNER
    ========================================================== --}}
    <section class="recap-header-card">
        <div class="recap-header-text">
            <div class="recap-header-badge">
                <span class="pulse-dot-red"></span>
                <span>Monitoring Panic Publik</span>
            </div>
            <h1>Recap Data Public</h1>
            <p>Daftar seluruh rekaman panggilan darurat panic button dari pengguna publik (splash screen / landing page) secara realtime.</p>
        </div>

        <div class="recap-header-actions">
            <button type="button" class="btn-header-action" onclick="window.location.reload();" title="Segarkan Halaman">
                <span>Segarkan Data</span>
            </button>
        </div>
    </section>



    {{-- =========================================================
         3. SEARCH & FILTER CONTROLS BAR
    ========================================================== --}}
    <section class="recap-filter-card">
        <div class="recap-filter-grid">

            {{-- 1. Search Input --}}
            <div class="filter-group">
                <label for="searchInput" class="filter-label">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span>Pencarian Data</span>
                </label>
                <div class="search-input-wrapper">
                    <i class="fa-solid fa-search"></i>
                    <input
                        type="text"
                        id="searchInput"
                        class="search-input-field"
                        placeholder="Cari alamat lokasi, perangkat IoT, zona, atau ID..."
                        autocomplete="off"
                    >
                </div>
            </div>

            {{-- 2. Status Filter --}}
            <div class="filter-group">
                <label for="statusFilter" class="filter-label">
                    <i class="fa-solid fa-filter"></i>
                    <span>Filter Status</span>
                </label>
                <div class="custom-select-wrapper">
                    <select id="statusFilter" class="custom-select-field">
                        <option value="">Semua Status</option>
                        <option value="active">Panic Aktif (Merah)</option>
                        <option value="completed">Laporan Selesai (Hijau)</option>
                    </select>
                    <i class="fa-solid fa-chevron-down select-arrow"></i>
                </div>
            </div>

            {{-- 3. Sort Order --}}
            <div class="filter-group">
                <label for="sortOrder" class="filter-label">
                    <i class="fa-solid fa-arrow-down-wide-short"></i>
                    <span>Urutan Waktu</span>
                </label>
                <div class="custom-select-wrapper">
                    <select id="sortOrder" class="custom-select-field">
                        <option value="desc">Waktu: Terbaru</option>
                        <option value="asc">Waktu: Terlama</option>
                    </select>
                    <i class="fa-solid fa-chevron-down select-arrow"></i>
                </div>
            </div>

            {{-- 4. Reset Button --}}
            <div class="filter-group">
                <label class="filter-label" style="visibility: hidden;">Reset</label>
                <button type="button" id="resetFilterBtn" class="btn-reset-filter" title="Reset semua filter">
                    <i class="fa-solid fa-rotate-left"></i>
                    <span>Reset</span>
                </button>
            </div>

        </div>
    </section>

    {{-- =========================================================
         4. MODERN REALTIME TABLE CARD
    ========================================================== --}}
    <section class="recap-table-card">
        <div class="recap-table-header">
            <div class="recap-table-header-title">
                <div class="recap-table-header-icon">
                    <i class="fa-solid fa-bullhorn"></i>
                </div>
                <div>
                    <h2>Daftar Riwayat Panic Publik</h2>
                    <p>Sinkronisasi data panggilan darurat tanpa login via Firebase Config 2</p>
                </div>
            </div>

            <div class="connection-badge">
                <span class="connection-dot"></span>
                <span id="syncStatus">Menghubungkan Firebase...</span>
            </div>
        </div>

        {{-- Desktop Realtime Table --}}
        <div class="table-wrapper">
            <table class="recap-public-table">
                <thead>
                    <tr>
                        <th style="width: 60px; text-align: center;">No</th>
                        <th style="width: 140px; text-align: center;">Tanggal</th>
                        <th style="width: 110px; text-align: center;">Waktu</th>
                        <th>Lokasi</th>
                        <th style="width: 160px; text-align: center;">Lihat Lokasi</th>
                        <th style="width: 130px; text-align: center;">Status</th>
                        <th style="width: 160px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="recapTableBody">
                    <tr class="loading-row">
                        <td colspan="7">
                            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 24px; margin-bottom: 8px; display: block; color: var(--dash-primary);"></i>
                            <span>Memuat rekapan data panic publik dari Firebase...</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    {{-- Mobile Card Container (Visible on Mobile) --}}
    <div class="mobile-cards-container" id="mobileCardsContainer">
        {{-- Diisi secara dinamis oleh recap-public.js --}}
    </div>

    {{-- =========================================================
         5. PAGINATION
    ========================================================== --}}
    <div class="pagination">
        <div class="pagination-info" id="paginationInfo">
            Menampilkan 0 - 0 dari 0 data
        </div>

        <div class="pagination-controls">
            <button type="button" id="prevBtn" class="btn-pagination" disabled>
                <i class="fa-solid fa-chevron-left"></i>
                <span>Sebelumnya</span>
            </button>

            <button type="button" id="nextBtn" class="btn-pagination" disabled>
                <span>Berikutnya</span>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    </div>

</div>

{{-- =========================================================
     6. MODAL PETA LOKASI INTERAKTIF (LEAFLET DUA KOLOM)
========================================================== --}}
<div id="locationModal" class="modal-overlay">
    <div class="modal-container modal-container-large">
        <div class="modal-header">
            <div class="modal-header-text">
                <span class="modal-badge">
                    <i class="fa-solid fa-map-pin"></i> Peta Lokasi Kejadian
                </span>
                <h3 id="modalLocationTitle">Titik Kejadian Panic Button</h3>
            </div>
            <button type="button" class="modal-close-btn" id="closeLocationModal" title="Tutup Modal">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="modal-body-split">
            {{-- Bagian Kiri: Rincian Informasi Lokasi & Kejadian --}}
            <div class="location-popup-left">
                <div class="location-info-card">
                    <span class="info-card-label">Alamat / Titik Lokasi</span>
                    <strong class="info-card-value" id="modalAddress">-</strong>
                </div>

                <div class="location-info-card">
                    <span class="info-card-label">Koordinat Presisi</span>
                    <strong class="info-card-value" id="modalCoords">-</strong>
                </div>

                <div class="location-info-card">
                    <span class="info-card-label">Waktu Kejadian</span>
                    <strong class="info-card-value" id="modalTime">-</strong>
                </div>

                <div class="location-info-card">
                    <span class="info-card-label">Perangkat IoT Terdekat</span>
                    <strong class="info-card-value" id="modalDevice">-</strong>
                </div>

                <div class="location-info-card">
                    <span class="info-card-label">Wilayah Zona</span>
                    <strong class="info-card-value" id="modalZone">-</strong>
                </div>
            </div>

            {{-- Bagian Kanan: Maps Kejadian --}}
            <div class="location-popup-right">
                <div class="map-container-box">
                    <div id="mapElement"></div>
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <a href="#" target="_blank" id="gmapsLinkBtn" class="btn-gmaps">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
                <span>Buka di Google Maps</span>
            </a>

            <button type="button" class="btn-close-modal" id="closeModalBtn">
                <span>Tutup</span>
            </button>
        </div>
    </div>
</div>

{{-- =========================================================
     7. MODAL DETAIL LAPORAN
========================================================== --}}
<div id="detailModal" class="modal-overlay">
    <div class="modal-container" style="max-width: 620px;">
        <div class="modal-header">
            <div class="modal-header-text">
                <span class="modal-badge">
                 Rincian Lengkap
                </span>
                <h3 id="detailModalTitle">Detail Recap Laporan</h3>
            </div>
            <button type="button" class="modal-close-btn" id="closeDetailModal" title="Tutup Modal">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="modal-body">
            <div class="location-meta-grid">
                <div class="location-meta-item">
                    <span class="meta-label">Tipe Pengguna</span>
                    <strong class="meta-value" id="detailUserType">-</strong>
                </div>

                <div class="location-meta-item">
                    <span class="meta-label">Status Penanganan</span>
                    <div id="detailStatus" style="margin-top: 4px;">-</div>
                </div>

                <div class="location-meta-item full-width">
                    <span class="meta-label">Identitas Kontak</span>
                    <strong class="meta-value" id="detailContact">-</strong>
                </div>

                <div class="location-meta-item full-width">
                    <span class="meta-label">Waktu Panggilan Masuk</span>
                    <strong class="meta-value" id="detailTime">-</strong>
                </div>

                <div class="location-meta-item full-width">
                    <span class="meta-label">Alamat Lengkap</span>
                    <strong class="meta-value" id="detailAddress">-</strong>
                </div>

                <div class="location-meta-item">
                    <span class="meta-label">Perangkat IoT Terpicu</span>
                    <strong class="meta-value" id="detailDevice">-</strong>
                </div>

                <div class="location-meta-item">
                    <span class="meta-label">Zona Wilayah</span>
                    <strong class="meta-value" id="detailZone">-</strong>
                </div>

                <div class="location-meta-item">
                    <span class="meta-label">Jarak ke Hardware</span>
                    <strong class="meta-value" id="detailDistance">-</strong>
                </div>

                <div class="location-meta-item">
                    <span class="meta-label">Koordinat GPS</span>
                    <strong class="meta-value" id="detailCoords">-</strong>
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <button type="button" id="detailToggleStatusBtn" class="btn-action-status btn-mark-done">
                <i class="fa-solid fa-circle-check"></i>
                <span>Tandai Selesai</span>
            </button>

            <button type="button" class="btn-close-modal" id="closeDetailBtn">
                <span>Tutup</span>
            </button>
        </div>
    </div>
</div>

@endsection

@push('scripts')
{{-- Leaflet JS --}}
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
{{-- SweetAlert2 --}}
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
{{-- Controller JS --}}
<script type="module" src="{{ asset('js/recap-public.js') }}"></script>
@endpush
