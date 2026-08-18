@extends('layouts.app')

@section('title', 'Monitoring IoT')

@section('content')

<div class="iot-page">

    {{-- =========================================================
         SUMMARY
    ========================================================== --}}

    <div class="iot-summary">

        <div class="iot-summary-card">

            <div class="iot-summary-icon">
                📡
            </div>

            <div>
                <span>Total Device</span>

                <strong id="totalDevice">
                    0
                </strong>
            </div>

        </div>


        <div class="iot-summary-card">

            <div class="iot-summary-icon">
                🟢
            </div>

            <div>
                <span>Normal</span>

                <strong
                    id="totalNormal"
                    class="text-success"
                >
                    0
                </strong>
            </div>

        </div>


        <div class="iot-summary-card">

            <div class="iot-summary-icon">
                🚨
            </div>

            <div>
                <span>Panic Aktif</span>

                <strong
                    id="totalPanic"
                    class="text-danger"
                >
                    0
                </strong>
            </div>

        </div>

    </div>


    {{-- =========================================================
         FILTER
    ========================================================== --}}

    <div class="iot-filter-card">

        <div class="iot-filter">

            <div class="iot-search">

                <label for="searchDevice">
                    Cari Device
                </label>

                <input
                    type="text"
                    id="searchDevice"
                    placeholder="Cari device, zona, atau lokasi..."
                >

            </div>


            <div class="iot-zone-filter">

                <label for="filterZone">
                    Zona
                </label>

                <select id="filterZone">

                    <option value="">
                        Semua Zona
                    </option>

                </select>

            </div>


            <div class="iot-status-filter">

                <label for="filterStatus">
                    Status Panic
                </label>

                <select id="filterStatus">

                    <option value="">
                        Semua Status
                    </option>

                    <option value="normal">
                        Normal
                    </option>

                    <option value="panic">
                        Panic
                    </option>

                </select>

            </div>

        </div>

    </div>


    {{-- =========================================================
         TABLE
    ========================================================== --}}

    <div class="iot-table-card">

        <div class="iot-table-header">

            <div>

                <h2>
                    Daftar Perangkat IoT
                </h2>

                <p>
                    Data diperbarui secara realtime dari Firebase Database 2.
                </p>

            </div>


            <div
                id="firebaseConnection"
                class="iot-connection"
            >

                <span class="connection-dot"></span>

                <span id="connectionText">
                    Menghubungkan...
                </span>

            </div>

        </div>


        <div class="iot-table-wrapper">

            <table class="iot-table">

                <thead>

                    <tr>

                        <th>No</th>

                        <th>Device</th>

                        <th>Zona</th>

                        <th>Lokasi</th>

                        <th>Status Panic</th>

                        <th>Aksi</th>

                    </tr>

                </thead>


                <tbody id="iotTableBody">

                    <tr>

                        <td
                            colspan="6"
                            class="iot-loading"
                        >
                            Memuat data IoT...
                        </td>

                    </tr>

                </tbody>

            </table>

        </div>

    </div>


    {{-- =========================================================
         MESSAGE
    ========================================================== --}}

    <div
        id="iotMessage"
        class="iot-message"
    >
        Menunggu koneksi Firebase...
    </div>


</div>


{{-- =========================================================
     DETAIL MODAL
========================================================== --}}

<div
    id="iotDetailModal"
    class="iot-modal-overlay"
    style="display: none;"
>

    <div class="iot-modal">

        {{-- HEADER --}}

        <div class="iot-modal-header">

            <div>

                <span class="iot-modal-label">
                    DETAIL PERANGKAT
                </span>

                <h2 id="detailDevice">
                    -
                </h2>

                <p>
                    Zona:
                    <strong id="detailZone">
                        -
                    </strong>
                </p>

            </div>


            <button
                type="button"
                id="closeDetail"
                class="iot-close-btn"
            >
                ×
            </button>

        </div>


        {{-- BODY --}}

        <div class="iot-modal-body">

            <div class="iot-detail-grid">


                {{-- DEVICE --}}

                <div class="iot-detail-item">

                    <span>
                        Device ID
                    </span>

                    <strong id="detailDeviceId">
                        -
                    </strong>

                </div>


                {{-- ZONA --}}

                <div class="iot-detail-item">

                    <span>
                        Zona
                    </span>

                    <strong id="detailZona">
                        -
                    </strong>

                </div>


                {{-- LOKASI --}}

                <div class="iot-detail-item">

                    <span>
                        Lokasi
                    </span>

                    <strong id="detailLokasi">
                        -
                    </strong>

                </div>


                {{-- STATUS --}}

                <div class="iot-detail-item">

                    <span>
                        Status
                    </span>

                    <strong id="detailStatus">
                        -
                    </strong>

                </div>


                {{-- ACTIVE --}}

                <div class="iot-detail-item">

                    <span>
                        Panic Button
                    </span>

                    <strong id="detailActive">
                        -
                    </strong>

                </div>


                {{-- LAST UPDATE --}}

                <div class="iot-detail-item">

                    <span>
                        Last Update
                    </span>

                    <strong id="detailLastUpdate">
                        -
                    </strong>

                </div>

            </div>

        </div>


        {{-- FOOTER --}}

        <div class="iot-modal-footer">

            <button
                type="button"
                id="btnDetailPanic"
                class="iot-btn iot-btn-danger"
            >
                🚨 Kirim Panic
            </button>


            <button
                type="button"
                id="btnDetailReset"
                class="iot-btn iot-btn-success"
            >
                ✓ Reset Panic
            </button>

        </div>

    </div>

</div>

@endsection


{{-- =========================================================
     CSS
========================================================== --}}

@push('styles')

<link
    rel="stylesheet"
    href="{{ asset('css/iot.css') }}"
>

@endpush


{{-- =========================================================
     JAVASCRIPT
========================================================== --}}

@push('scripts')

<script
    type="module"
    src="{{ asset('js/IoT.js') }}"
></script>

@endpush