@extends('layouts.app')

@section('title', 'Statistik Insiden - Panic Button')

@section('page-title', 'Statistik Insiden')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/statistik.css') }}">
@endpush

@section('content')
<div class="statistik-page">

    {{-- =========================================================
         1. HEADER BANNER (TANPA CARD KETERANGAN SESUAI REQUEST)
    ========================================================== --}}
    <section class="statistik-header-card">
        <div class="statistik-header-text">
            <div class="statistik-header-badge">
                <span class="pulse-dot-indigo"></span>
                <span>Analitik & Statistik Insiden</span>
            </div>
            <h1>Statistik Insiden Perumahan</h1>
            <p>Pilih kawasan perumahan untuk meninjau grafik analitik frekuensi alarm darurat, sebaran prioritas, dan peringkat aktivitas penanganan.</p>
        </div>
    </section>

    {{-- =========================================================
         2. SEARCH FILTER BAR
    ========================================================== --}}
    <section class="statistik-filter-card">
        <div class="search-container">
            <i class="fa-solid fa-search"></i>
            <input
                type="text"
                id="searchInput"
                class="search-input"
                placeholder="Cari perumahan, kontak posko, lokasi..."
                autocomplete="off"
            >
        </div>
    </section>

    {{-- =========================================================
         3. MODERN REALTIME TABLE CARD
    ========================================================== --}}
    <section class="statistik-table-card">
        <div class="statistik-table-header">
            <div class="statistik-table-header-title">
                <div class="statistik-table-header-icon">
                    <i class="fa-solid fa-chart-pie"></i>
                </div>
                <div>
                    <h2>Daftar Analitik Kawasan Perumahan</h2>
                    <p>Pilih perumahan untuk menampilkan visualisasi grafik interaktif</p>
                </div>
            </div>

            <div class="connection-badge">
                <span class="connection-dot"></span>
                <span>Realtime Data</span>
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
                        <th style="width: 170px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="perumahanTableBody">
                    <tr>
                        <td colspan="5" class="loading">
                            <i class="fa-solid fa-circle-notch fa-spin"></i> Memuat data statistik perumahan...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    {{-- Mobile Card Container --}}
    <div class="card-container" id="cardContainer"></div>

    {{-- =========================================================
         4. PAGINATION
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
<script type="module" src="{{ asset('js/statistik.js') }}"></script>
@endpush