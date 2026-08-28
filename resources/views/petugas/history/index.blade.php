@extends('layouts.app')

@section('title', 'Riwayat Laporan - Petugas')

@section('page-title', 'Riwayat Laporan Darurat')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/petugas/history.css') }}">
@endpush

@section('content')
<div class="petugas-history-page">

    {{-- 1. HEADER BANNER --}}
    <section class="history-header-card">
        <div class="history-header-content">
            <div class="history-header-badge">
                <span class="pulse"></span>
                <span>Monitoring & Tanggap Insiden Terpadu</span>
            </div>
            <h2>Pusat Monitoring & Riwayat Laporan</h2>
            <p>Pantau antrean laporan masuk, proses penanganan di lapangan, dan arsip laporan selesai.</p>
        </div>
    </section>

    {{-- 2. SEARCH & FILTER BAR --}}
    <section class="history-filter-card">
        <div class="filter-controls-group">
            {{-- Search Box (Full-width expanding) --}}
            <div class="search-box-history">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input 
                    type="text" 
                    id="searchReportsInput" 
                    placeholder="Cari nama pelapor, perumahan, lokasi, atau isi keterangan laporan..."
                    autocomplete="off"
                >
            </div>

            {{-- Category Filter --}}
            <div class="select-category-box">
                <i class="fa-solid fa-filter select-icon"></i>
                <select id="categoryFilter" class="custom-select-control">
                    <option value="all">Semua Kategori</option>
                    <option value="perumahan">Perumahan</option>
                    <option value="public">Khusus Public</option>
                </select>
            </div>

            {{-- Refresh Button --}}
            <button type="button" class="btn-refresh-history" id="btnRefreshHistory" title="Perbarui Data Riwayat">
                <i class="fa-solid fa-arrows-rotate"></i>
                <span class="btn-refresh-text">Refresh</span>
            </button>
        </div>
    </section>

    {{-- 2. 3-AREA KANBAN BOARD --}}
    <section class="history-board-container">

        {{-- AREA 1: MENUNGGU --}}
        <div class="board-column column-waiting">
            <div class="board-column-header header-waiting">
                <div class="column-title-left">
                    <div class="column-status-icon icon-waiting">
                        <i class="fa-solid fa-hourglass-half"></i>
                    </div>
                    <div class="column-title-text">
                        <h3>Menunggu</h3>
                        <span>Laporan Baru / Validasi</span>
                    </div>
                </div>
                <span class="column-counter badge-waiting" id="countWaiting">0</span>
            </div>

            <div class="board-cards-wrapper" id="waitingCardsContainer">
                <div class="board-empty-state">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <p>Memuat laporan...</p>
                </div>
            </div>
        </div>

        {{-- AREA 2: DIPROSES --}}
        <div class="board-column column-process">
            <div class="board-column-header header-process">
                <div class="column-title-left">
                    <div class="column-status-icon icon-process">
                        <i class="fa-solid fa-person-running"></i>
                    </div>
                    <div class="column-title-text">
                        <h3>Diproses</h3>
                        <span>Petugas Sedang Menangani</span>
                    </div>
                </div>
                <span class="column-counter badge-process" id="countProcess">0</span>
            </div>

            <div class="board-cards-wrapper" id="processCardsContainer">
                <div class="board-empty-state">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <p>Memuat laporan...</p>
                </div>
            </div>
        </div>

        {{-- AREA 3: SELESAI --}}
        <div class="board-column column-done">
            <div class="board-column-header header-done">
                <div class="column-title-left">
                    <div class="column-status-icon icon-done">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>
                    <div class="column-title-text">
                        <h3>Selesai</h3>
                        <span>Insiden Tuntas Ditangani</span>
                    </div>
                </div>
                <span class="column-counter badge-done" id="countDone">0</span>
            </div>

            <div class="board-cards-wrapper" id="doneCardsContainer">
                <div class="board-empty-state">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <p>Memuat laporan...</p>
                </div>
            </div>
        </div>

    </section>

</div>

{{-- 3. MODAL DETAIL LAPORAN & UBAH STATUS --}}
<div id="detailReportModal" class="modal-petugas-overlay" style="display: none;">
    <div class="modal-petugas-card modal-detail-card">
        <div class="modal-petugas-header">
            <div class="modal-petugas-title">
                <i class="fa-solid fa-file-waveform"></i>
                <h3 id="modalHeaderTitle">Detail & Tindak Lanjut Laporan</h3>
            </div>
            <button type="button" class="btn-close-petugas-modal" id="btnCloseDetailModal">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="modal-petugas-body">
            <input type="hidden" id="modalReportId">
            <input type="hidden" id="modalReportSource">
            <input type="hidden" id="modalReportPerumahanKey">

            {{-- Detail Content Box --}}
            <div class="modal-detail-content" id="modalDetailContent">
                {{-- Dynamically Injected --}}
            </div>

            {{-- Status Update Form --}}
            <div class="modal-status-update-section">
                <label for="selectReportStatus" class="form-label-bold">
                    <i class="fa-solid fa-arrows-spin"></i> Ubah Status Laporan <span style="color: #dc2626;">*</span>
                </label>
                <div class="status-option-grid">
                    <label class="status-radio-card" data-val="Menunggu">
                        <input type="radio" name="radioStatus" value="Menunggu">
                        <span class="radio-badge badge-waiting">Menunggu</span>
                        <small>Belum / Validasi awal</small>
                    </label>
                    <label class="status-radio-card" data-val="Diproses">
                        <input type="radio" name="radioStatus" value="Diproses">
                        <span class="radio-badge badge-process">Diproses</span>
                        <small>Sedang ditangani</small>
                    </label>
                    <label class="status-radio-card" data-val="Selesai">
                        <input type="radio" name="radioStatus" value="Selesai">
                        <span class="radio-badge badge-done">Selesai</span>
                        <small>Tuntas ditangani</small>
                    </label>
                </div>

                <div class="form-group-note" style="margin-top: 14px;">
                    <label for="officerResponseNote" class="form-label-bold">
                        <i class="fa-regular fa-comment-dots"></i> Catatan Tindakan Petugas (Opsional)
                    </label>
                    <textarea 
                        id="officerResponseNote" 
                        rows="2" 
                        class="custom-textarea-control"
                        placeholder="Contoh: Petugas posko telah mendatangi rumah warga, situasi aman terkendali..."
                    ></textarea>
                </div>
            </div>

            <div class="modal-actions-footer">
                <button type="button" class="btn-modal-cancel" id="btnCancelDetailModal">Tutup</button>
                <button type="button" class="btn-modal-submit" id="btnSaveStatusChange">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Simpan Perubahan</span>
                </button>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script type="module" src="{{ asset('js/petugas/history.js') }}"></script>
@endpush
