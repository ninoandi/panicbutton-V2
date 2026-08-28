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
            <span>Tambah Perumahan</span>
        </button>
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