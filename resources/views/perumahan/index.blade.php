@extends('layouts.app')

@section('title', 'Rekap Data Perumahan - Panic Button')

@section('page-title', 'Rekap Data Perumahan')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/rekap.css') }}">
@endpush

@section('content')
<div class="rekap-page">

    {{-- =========================================================
         1. HEADER BANNER
    ========================================================== --}}
    <section class="rekap-header-card">
        <div class="rekap-header-text">
            <div class="rekap-header-badge">
                <span class="pulse-dot-green"></span>
                <span>Rekapitulasi Wilayah & Cluster</span>
            </div>
            <h1>Rekap Data Perumahan</h1>
            <p>Daftar seluruh kawasan perumahan terdaftar, kontak darurat satpam/posko, dan titik koordinat lokasi wilayah.</p>
        </div>

        <button type="button" class="btn-add-perumahan" id="openAddModal">
            <i class="fa-solid fa-plus"></i>
            <span>Tambah Perumahan</span>
        </button>
    </section>

    {{-- =========================================================
         2. TOP METRICS SUMMARY (3 CARDS)
    ========================================================== --}}
    <section class="rekap-summary">

        {{-- Card 1: Total Perumahan --}}
        <div class="rekap-summary-card rekap-card-total">
            <div class="rekap-summary-header">
                <div class="rekap-summary-icon rekap-icon-total">
                    <i class="fa-solid fa-building-shield"></i>
                </div>
                <span class="rekap-badge-total">
                    Terdaftar
                </span>
            </div>
            <div class="rekap-summary-body">
                <span class="rekap-summary-label">Total Perumahan</span>
                <strong class="rekap-summary-count" id="totalCount">0</strong>
                <span class="rekap-summary-desc">Kawasan perumahan yang terdata</span>
            </div>
        </div>

        {{-- Card 2: Status Integrasi --}}
        <div class="rekap-summary-card rekap-card-status">
            <div class="rekap-summary-header">
                <div class="rekap-summary-icon rekap-icon-status">
                    <i class="fa-solid fa-tower-broadcast"></i>
                </div>
                <span class="rekap-badge-status">
                    <span class="pulse-dot"></span> Siaga
                </span>
            </div>
            <div class="rekap-summary-body">
                <span class="rekap-summary-label">Status Sistem</span>
                <strong class="rekap-summary-count" style="font-size: 24px;">Siaga Realtime</strong>
                <span class="rekap-summary-desc">Buzzer & alarm darurat terhubung</span>
            </div>
        </div>

        {{-- Card 3: Cloud Database --}}
        <div class="rekap-summary-card rekap-card-sync">
            <div class="rekap-summary-header">
                <div class="rekap-summary-icon rekap-icon-sync">
                    <i class="fa-solid fa-database"></i>
                </div>
                <span class="rekap-badge-sync">
                    Firebase Sync
                </span>
            </div>
            <div class="rekap-summary-body">
                <span class="rekap-summary-label">Koneksi Database</span>
                <strong class="rekap-summary-count" style="font-size: 24px;">Terhubung</strong>
                <span class="rekap-summary-desc">Sinkronisasi data otomatis</span>
            </div>
        </div>

    </section>

    {{-- =========================================================
         3. SEARCH FILTER BAR
    ========================================================== --}}
    <section class="rekap-filter-card">
        <div class="search-container">
            <i class="fa-solid fa-search"></i>
            <input
                type="text"
                id="searchInput"
                class="search-input"
                placeholder="Cari nama perumahan, kontak posko, atau lokasi..."
            >
        </div>
    </section>

    {{-- =========================================================
         4. MODERN REALTIME TABLE CARD
    ========================================================== --}}
    <section class="rekap-table-card">
        <div class="rekap-table-header">
            <div class="rekap-table-header-title">
                <div class="rekap-table-header-icon">
                    <i class="fa-solid fa-city"></i>
                </div>
                <div>
                    <h2>Daftar Kawasan Perumahan</h2>
                    <p>Informasi detail kontak dan titik wilayah perumahan</p>
                </div>
            </div>

            <div class="connection-badge">
                <span class="connection-dot"></span>
                <span>Realtime Database</span>
            </div>
        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th style="width: 60px;">No</th>
                        <th>Nama Perumahan</th>
                        <th>Kontak Posko</th>
                        <th>Lokasi Wilayah</th>
                        <th style="width: 260px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="perumahanTableBody">
                    <tr>
                        <td colspan="5" class="loading">
                            <i class="fa-solid fa-circle-notch fa-spin"></i> Memuat data perumahan...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    {{-- Mobile Card Container --}}
    <div class="card-container" id="cardContainer">
        {{-- Diisi secara realtime oleh rekap.js --}}
    </div>

    {{-- =========================================================
         5. PAGINATION
    ========================================================== --}}
    <div class="pagination">
        <div class="pagination-info" id="paginationInfo">
            Menampilkan 0 - 0 dari 0 data
        </div>

        <div class="pagination-controls">
            <button type="button" id="prevBtn" class="btn-pagination">
                <i class="fa-solid fa-chevron-left"></i>
                <span>Sebelumnya</span>
            </button>

            <button type="button" id="nextBtn" class="btn-pagination">
                <span>Berikutnya</span>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    </div>

</div>
@endsection

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script type="module" src="{{ asset('js/rekap.js') }}"></script>
@endpush