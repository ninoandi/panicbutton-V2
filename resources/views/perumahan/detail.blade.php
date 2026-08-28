@extends('layouts.app')

@section('title', 'Detail Perumahan - Panic Button')

@section('page-title', 'Detail Perumahan')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/detail-perumahan.css') }}">
@endpush

@section('content')
<div class="monitor-page">

    {{-- =========================================================
         1. HEADER BANNER
    ========================================================== --}}
    <section class="monitor-header-card">
        <div class="monitor-header-text">
            <div class="monitor-header-badge">
                <span class="pulse-dot-blue"></span>
                <span>Log Aktivitas & Monitor Wilayah</span>
            </div>
            <h1 id="title">Detail Perumahan</h1>
            <p>Riwayat panggilan panic button, status penanganan insiden, dan catatan monitor darurat di kawasan perumahan ini.</p>
        </div>

        <div class="monitor-header-actions">
            <a href="{{ url('/perumahan') }}" class="btn-back">
                <i class="fa-solid fa-arrow-left"></i>
                <span>Kembali</span>
            </a>

            <button type="button" id="clearAllBtn" class="btn-clear-all">
                <span>Hapus Semua Monitor</span>
            </button>
        </div>
    </section>

    {{-- =========================================================
         2. MODERN FILTER CONTROLS (NO EMOJIS)
    ========================================================== --}}
    <section class="monitor-filter-card">
        <div id="filterControls" class="filter-controls-grid">

            {{-- 1. Search Input --}}
            <div class="filter-group filter-search-group">
                <label for="search" class="filter-label">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span>Pencarian Riwayat</span>
                </label>
                <div class="search-input-wrapper">
                    <i class="fa-solid fa-search"></i>
                    <input
                        type="text"
                        id="search"
                        class="search-input-field"
                        placeholder="Cari nama warga, no rumah, pesan, atau lokasi..."
                        autocomplete="off"
                    >
                </div>
            </div>

            {{-- 2. Status Filter --}}
            <div class="filter-group">
                <label for="statusFilter" class="filter-label">
                    <i class="fa-solid fa-list-check"></i>
                    <span>Status Penanganan</span>
                </label>
                <div class="custom-select-wrapper">
                    <select id="statusFilter" class="custom-select-field">
                        <option value="">Semua Status</option>
                        <option value="Proses">Proses</option>
                        <option value="Selesai">Selesai</option>
                    </select>
                    <i class="fa-solid fa-chevron-down select-arrow"></i>
                </div>
            </div>

            {{-- 3. Prioritas Filter --}}
            <div class="filter-group">
                <label for="priorityFilter" class="filter-label">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span>Tingkat Prioritas</span>
                </label>
                <div class="custom-select-wrapper">
                    <select id="priorityFilter" class="custom-select-field">
                        <option value="">Semua Prioritas</option>
                        <option value="Biasa">Biasa</option>
                        <option value="Penting">Penting</option>
                        <option value="Darurat">Darurat</option>
                    </select>
                    <i class="fa-solid fa-chevron-down select-arrow"></i>
                </div>
            </div>

            {{-- 4. Periode Filter (Bulanan) --}}
            <div class="filter-group">
                <label for="periodFilter" class="filter-label">
                    <i class="fa-solid fa-calendar-days"></i>
                    <span>Periode</span>
                </label>
                <div class="custom-select-wrapper">
                    <select id="periodFilter" class="custom-select-field">
                        <option value="">Semua Periode</option>
                        <option value="1">Januari</option>
                        <option value="2">Februari</option>
                        <option value="3">Maret</option>
                        <option value="4">April</option>
                        <option value="5">Mei</option>
                        <option value="6">Juni</option>
                        <option value="7">Juli</option>
                        <option value="8">Agustus</option>
                        <option value="9">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                    </select>
                    <i class="fa-solid fa-chevron-down select-arrow"></i>
                </div>
            </div>

            {{-- 5. Sort Order --}}
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

        </div>
    </section>

    {{-- =========================================================
         3. MODERN REALTIME MONITOR TABLE CARD
    ========================================================== --}}
    <section class="monitor-table-card">
        <div class="monitor-table-header">
            <div class="monitor-table-header-title">
                <div class="monitor-table-header-icon">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div>
                    <h2>Log Monitor Insiden Kawasan</h2>
                    <p>Daftar aktivitas darurat perumahan yang terekam di sistem</p>
                </div>
            </div>

            <button type="button" id="btnExportExcel" class="btn-export-excel" title="Import / Unduh File Excel Recap">
                <span>Eskport Recap Data</span>
            </button>
        </div>

        <div class="table-wrapper">
            <table id="monitorTable" class="monitor-table">
                <thead>
                    <tr>
                        <th>Nama Pengguna</th>
                        <th style="width: 110px;">No Rumah</th>
                        <th>Pesan Darurat</th>
                        <th style="width: 120px;">Prioritas</th>
                        <th style="width: 120px;">Status</th>
                        <th style="width: 170px;">Waktu Kejadian</th>
                        <th>Titik Lokasi</th>
                    </tr>
                </thead>
                <tbody id="monitorTableBody">
                    <tr>
                        <td colspan="7" class="loading-state">
                            <i class="fa-solid fa-circle-notch fa-spin"></i> Memuat data monitor...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    {{-- =========================================================
         4. PAGINATION
    ========================================================== --}}
    <div id="pagination" class="pagination-wrapper"></div>

</div>
@endsection

@push('scripts')
    {{-- SweetAlert2 --}}
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    {{-- SheetJS (Excel Generator) --}}
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>

    {{-- Kirim key Laravel ke JavaScript --}}
    <script>
        window.monitorKey = @json($key);
        console.log('KEY DARI LARAVEL:', window.monitorKey);
    </script>

    {{-- JavaScript halaman --}}
    <script type="module" src="{{ asset('js/detail-perumahan.js') }}"></script>
@endpush