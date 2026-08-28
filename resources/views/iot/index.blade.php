@extends('layouts.app')

@section('title', 'Monitoring Device IoT - Panic Button')

@section('page-title', 'Monitoring Device IoT')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/iot.css') }}">
@endpush

@section('content')
<div class="iot-page">

    {{-- =========================================================
         1. HEADER BANNER
    ========================================================== --}}
    <section class="iot-header-card">
        <div class="iot-header-text">
            <div class="iot-header-badge">
                <span class="pulse-dot-teal"></span>
                <span>Hardware Siaga & IoT Monitoring</span>
            </div>
            <h1>Monitoring Perangkat IoT Publik</h1>
            <p>Pantau status perangkat keras alarm fisik, sensor tombol darurat, dan kondisi jaringan zona secara realtime.</p>
        </div>
    </section>

    {{-- =========================================================
         2. TOP METRICS SUMMARY (3 CARDS)
    ========================================================== --}}
    <section class="iot-summary">

        {{-- Card 1: Total Device --}}
        <div class="iot-summary-card iot-card-total">
            <div class="iot-summary-header">
                <div class="iot-summary-icon iot-icon-total">
                    <i class="fa-solid fa-microchip"></i>
                </div>
                <span class="iot-badge-total">
                    Terdaftar
                </span>
            </div>
            <div class="iot-summary-body">
                <span class="iot-summary-label">Total Device</span>
                <strong class="iot-summary-count" id="totalDevice">0</strong>
                <span class="iot-summary-desc">Keseluruhan hardware IoT terhubung</span>
            </div>
        </div>

        {{-- Card 2: Normal / Siaga --}}
        <div class="iot-summary-card iot-card-normal">
            <div class="iot-summary-header">
                <div class="iot-summary-icon iot-icon-normal">
                    <i class="fa-solid fa-circle-check"></i>
                </div>
                <span class="iot-badge-normal">
                    <span class="pulse-dot"></span> Siaga
                </span>
            </div>
            <div class="iot-summary-body">
                <span class="iot-summary-label">Kondisi Normal</span>
                <strong class="iot-summary-count" id="totalNormal">0</strong>
                <span class="iot-summary-desc">Perangkat dalam kondisi standby normal</span>
            </div>
        </div>

        {{-- Card 3: Panic Aktif --}}
        <div class="iot-summary-card iot-card-panic">
            <div class="iot-summary-header">
                <div class="iot-summary-icon iot-icon-panic">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <span class="iot-badge-panic">
                    <span class="pulse-dot-red"></span> Darurat
                </span>
            </div>
            <div class="iot-summary-body">
                <span class="iot-summary-label">Panic Aktif</span>
                <strong class="iot-summary-count" id="totalPanic">0</strong>
                <span class="iot-summary-desc">Alarm darurat hardware sedang aktif</span>
            </div>
        </div>

    </section>

    {{-- =========================================================
         3. CUSTOM AESTHETIC FILTER & SEARCH BAR
    ========================================================== --}}
    <section class="iot-filter-card">
        <div class="iot-filter-grid">

            {{-- 1. Search Input --}}
            <div class="filter-group">
                <label for="searchDevice" class="filter-label">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span>Pencarian Perangkat</span>
                </label>
                <div class="search-input-wrapper">
                    <i class="fa-solid fa-search"></i>
                    <input
                        type="text"
                        id="searchDevice"
                        class="search-input-field"
                        placeholder="Cari nama device, zona, atau lokasi..."
                    >
                </div>
            </div>

            {{-- 2. Custom Zona Filter --}}
            <div class="filter-group">
                <label for="filterZone" class="filter-label">
                    <i class="fa-solid fa-map-location-dot"></i>
                    <span>Filter Zona</span>
                </label>
                <div class="custom-select-wrapper">
                    <select id="filterZone" class="custom-select-field">
                        <option value="">Semua Zona</option>
                    </select>
                    <i class="fa-solid fa-chevron-down select-arrow"></i>
                </div>
            </div>

            {{-- 3. Custom Status Panic Filter --}}
            <div class="filter-group">
                <label for="filterStatus" class="filter-label">
                    <i class="fa-solid fa-tower-broadcast"></i>
                    <span>Status Panic</span>
                </label>
                <div class="custom-select-wrapper">
                    <select id="filterStatus" class="custom-select-field">
                        <option value="">Semua Status</option>
                        <option value="normal">Normal</option>
                        <option value="panic">Panic Aktif</option>
                    </select>
                    <i class="fa-solid fa-chevron-down select-arrow"></i>
                </div>
            </div>

        </div>
    </section>

    {{-- =========================================================
         4. MODERN REALTIME IOT TABLE CARD
    ========================================================== --}}
    <section class="iot-table-card">
        <div class="iot-table-header">
            <div class="iot-table-header-title">
                <div class="iot-table-header-icon">
                    <i class="fa-solid fa-network-wired"></i>
                </div>
                <div>
                    <h2>Daftar Perangkat IoT Publik</h2>
                    <p>Sinkronisasi data perangkat realtime dari Firebase Realtime Database</p>
                </div>
            </div>

            <div id="firebaseConnection" class="connection-badge">
                <span class="connection-dot"></span>
                <span id="connectionText">Menghubungkan...</span>
            </div>
        </div>

        <div class="iot-table-wrapper">
            <table class="iot-table">
                <thead>
                    <tr>
                        <th style="width: 60px;">No</th>
                        <th>Device</th>
                        <th>Zona</th>
                        <th>Lokasi</th>
                        <th>Status Panic</th>
                        <th style="width: 120px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="iotTableBody">
                    <tr>
                        <td colspan="6" class="iot-loading">
                            <i class="fa-solid fa-circle-notch fa-spin"></i> Memuat data perangkat IoT...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    {{-- Status Log Bar --}}
    <div id="iotMessage" class="iot-message-bar">
        <i class="fa-solid fa-circle-info"></i>
        <span>Menunggu koneksi Firebase...</span>
    </div>

</div>

{{-- =========================================================
     5. DETAIL POPUP MODAL (GLASSMORPHISM)
========================================================== --}}
<div
    id="iotDetailModal"
    class="iot-modal-overlay"
    style="display: none;"
>
    <div class="iot-modal">

        {{-- Modal Header --}}
        <div class="iot-modal-header">
            <div>
                <span class="iot-modal-badge">
                    <i class="fa-solid fa-microchip"></i> INFORMASI PERANGKAT IoT
                </span>
                <h2 id="detailDevice">-</h2>
                <p class="iot-modal-zone-text">
                    Wilayah Zona: <strong id="detailZone">-</strong>
                </p>
            </div>

            <button
                type="button"
                id="closeDetail"
                class="iot-close-btn"
                title="Tutup Modal"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        {{-- Modal Body --}}
        <div class="iot-modal-body">
            <div class="iot-detail-grid">

                {{-- Device ID --}}
                <div class="iot-detail-item">
                    <span class="iot-detail-label">Device Identifier</span>
                    <strong id="detailDeviceId" class="iot-detail-value">-</strong>
                </div>

                {{-- Zona --}}
                <div class="iot-detail-item">
                    <span class="iot-detail-label">Wilayah / Zona</span>
                    <strong id="detailZona" class="iot-detail-value">-</strong>
                </div>

                {{-- Lokasi --}}
                <div class="iot-detail-item full-width">
                    <span class="iot-detail-label">Titik Lokasi Hardware</span>
                    <strong id="detailLokasi" class="iot-detail-value">-</strong>
                </div>

                {{-- Status --}}
                <div class="iot-detail-item">
                    <span class="iot-detail-label">Status Hardware</span>
                    <strong id="detailStatus" class="iot-detail-value iot-value normal">-</strong>
                </div>

                {{-- Trigger Status --}}
                <div class="iot-detail-item">
                    <span class="iot-detail-label">Kondisi Panic</span>
                    <strong id="detailActive" class="iot-detail-value iot-value normal">-</strong>
                </div>

                {{-- Last Update --}}
                <div class="iot-detail-item full-width">
                    <span class="iot-detail-label">Sinkronisasi Terakhir</span>
                    <strong id="detailLastUpdate" class="iot-detail-value">-</strong>
                </div>

            </div>
        </div>

        {{-- Modal Footer with Custom Buttons --}}
        <div class="iot-modal-footer">
            <button
                type="button"
                id="btnDetailPanic"
                class="btn-modal btn-modal-panic"
            >
                <span>Kirim Panic</span>
            </button>

            <button
                type="button"
                id="btnDetailReset"
                class="btn-modal btn-modal-reset"
            >
                <span>Reset Panic</span>
            </button>
        </div>

    </div>
</div>

@endsection

@push('scripts')
<script
    type="module"
    src="{{ asset('js/IoT.js') }}"
></script>
@endpush