@extends('layouts.app')

@section('title', 'Dashboard Petugas - Panic Button')

@section('page-title', 'Dashboard Petugas')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/petugas/dashboard.css') }}">
@endpush

@section('content')
<div class="petugas-dashboard-page">

    {{-- 1. WELCOME HERO BANNER --}}
    <section class="welcome-card">
        <div class="welcome-text">
            <div class="welcome-badge">
                <span class="pulse-dot"></span>
                <span>Petugas Siaga Tanggap Darurat &bull; {{ session('web_petugas_type') === 'perumahan' ? 'Kategori Perumahan' : 'Kategori Public' }}</span>
            </div>
            <h2>Selamat Datang, {{ session('web_user_name', 'Petugas Lapangan') }}!</h2>
            <p>Pantau laporan darurat warga secara realtime, segera lakukan respons cepat dan verifikasi penanganan di lokasi.</p>
        </div>
        <div class="welcome-actions">
            <a href="{{ route('petugas.history') }}" class="btn-hero-emergency" id="btnCheckReports">
                <span>Periksa Laporan Sekarang</span>
            </a>
        </div>
    </section>

    {{-- 2. STATISTIK UTAMA (TOP 3 STAT CARDS) --}}
    <section class="dashboard-stats">

        {{-- Card 1: Laporan Aktif --}}
        <div class="stat-card stat-card-active">
            <div class="stat-card-header">
                <div class="stat-icon stat-icon-active">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <span class="stat-badge stat-badge-active">
                    <span class="pulse-dot"></span>
                    <span>Aktif</span>
                </span>
            </div>
            <div class="stat-card-body">
                <span class="stat-label">Jumlah Laporan Aktif</span>
                <strong class="stat-count" id="activeReportsCount">0</strong>
                <span class="stat-desc">Laporan darurat menunggu & diproses</span>
            </div>
        </div>

        {{-- Card 2: Total Laporan --}}
        <div class="stat-card stat-card-total">
            <div class="stat-card-header">
                <div class="stat-icon stat-icon-total">
                    <i class="fa-solid fa-chart-line"></i>
                </div>
                <span class="stat-badge stat-badge-total">
                    <span>Kumulatif</span>
                </span>
            </div>
            <div class="stat-card-body">
                <span class="stat-label">Total Laporan</span>
                <strong class="stat-count" id="totalReportsCount">0</strong>
                <span class="stat-desc">Seluruh laporan perumahan & public</span>
            </div>
        </div>

        {{-- Card 3: Laporan Selesai --}}
        <div class="stat-card stat-card-done">
            <div class="stat-card-header">
                <div class="stat-icon stat-icon-done">
                    <i class="fa-solid fa-circle-check"></i>
                </div>
                <span class="stat-badge stat-badge-done">
                    <span>Tuntas</span>
                </span>
            </div>
            <div class="stat-card-body">
                <span class="stat-label">Laporan Selesai</span>
                <strong class="stat-count" id="completedReportsCount">0</strong>
                <span class="stat-desc">Insiden telah berhasil ditangani</span>
            </div>
        </div>

    </section>

    {{-- 3. LIVE MONITOR SECTIONS --}}
    
    {{-- A. Laporan Terkini Panic Button Perumahan --}}
    <section class="dashboard-card status-panic-section">
        <div class="card-header">
            <div class="card-header-title">
                <div class="card-header-icon emergency">
                    <i class="fa-solid fa-building-shield"></i>
                </div>
                <div>
                    <h2>Laporan Panic Button Perumahan</h2>
                    <p>Laporan darurat aktif dari warga klaster perumahan</p>
                </div>
            </div>
            <div class="card-header-right-actions">
                <div class="card-header-badge" id="housingAlertBadge">
                    <span class="badge-dot-indicator dot-green" id="housingAlertDot"></span>
                    <span id="housingAlertBadgeText">Memeriksa Laporan...</span>
                </div>
                <a href="{{ route('petugas.history') }}" class="btn-header-shortcut" title="Buka Riwayat Laporan">
                    <span>Semua Riwayat</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>
        </div>

        <div class="reports-stream-grid" id="housingReportsGrid">
            <div class="panic-empty-state">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                <p>Menghubungkan ke server laporan perumahan...</p>
            </div>
        </div>
    </section>

    {{-- B. Laporan Terkini Panic Button Public --}}
    <section class="dashboard-card status-panic-section" style="margin-top: 24px;">
        <div class="card-header">
            <div class="card-header-title">
                <div class="card-header-icon public-icon">
                    <i class="fa-solid fa-tower-cell"></i>
                </div>
                <div>
                    <h2>Laporan Panic Button Public</h2>
                    <p>Laporan darurat aktif dari warga & perangkat IoT publik</p>
                </div>
            </div>
            <div class="card-header-right-actions">
                <div class="card-header-badge" id="publicAlertBadge">
                    <span class="badge-dot-indicator dot-green" id="publicAlertDot"></span>
                    <span id="publicAlertBadgeText">Memeriksa Laporan...</span>
                </div>
                <a href="{{ route('petugas.history') }}" class="btn-header-shortcut" title="Buka Riwayat Laporan">
                    <span>Semua Riwayat</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>
        </div>

        <div class="reports-stream-grid" id="publicReportsGrid">
            <div class="panic-empty-state">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                <p>Menghubungkan ke server laporan publik...</p>
            </div>
        </div>
    </section>

</div>

{{-- MODAL RESPON & UBAH STATUS LAPORAN DASHBOARD --}}
<div id="petugasActionModal" class="modal-petugas-overlay" style="display: none;">
    <div class="modal-petugas-card modal-detail-card">
        <div class="modal-petugas-header">
            <div class="modal-petugas-title">
                <h3 id="dashboardModalHeaderTitle">Detail & Tindak Lanjut Laporan</h3>
            </div>
            <button type="button" class="btn-close-petugas-modal" id="btnClosePetugasModal">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="modal-petugas-body">
            <input type="hidden" id="dashModalReportId">
            <input type="hidden" id="dashModalReportSource">
            <input type="hidden" id="dashModalPerumahanKey">
            <input type="hidden" id="dashModalDbTable">

            {{-- Detail Container --}}
            <div class="modal-detail-content" id="modalPetugasBody">
                {{-- Dynamic Content Injected via JS --}}
            </div>

            {{-- Status Update Section --}}
            <div class="modal-status-update-section">
                <label class="form-label-bold">
                    <i class="fa-solid fa-arrows-spin"></i> Ubah Status Penanganan <span style="color: #dc2626;">*</span>
                </label>
                <div class="status-option-grid">
                    <label class="status-radio-card" data-val="Menunggu">
                        <input type="radio" name="dashRadioStatus" value="Menunggu">
                        <span class="radio-badge badge-waiting">Menunggu</span>
                        <small>Perlu Respon / Validasi</small>
                    </label>
                    <label class="status-radio-card" data-val="Diproses">
                        <input type="radio" name="dashRadioStatus" value="Diproses">
                        <span class="radio-badge badge-process">Diproses</span>
                        <small>Sedang Ditangani</small>
                    </label>
                    <label class="status-radio-card" data-val="Selesai">
                        <input type="radio" name="dashRadioStatus" value="Selesai">
                        <span class="radio-badge badge-done">Selesai</span>
                        <small>Insiden Ditangani</small>
                    </label>
                </div>

                <div class="form-group-note" style="margin-top: 14px;">
                    <label for="dashOfficerNote" class="form-label-bold">
                        <i class="fa-regular fa-comment-dots"></i> Catatan Petugas (Opsional)
                    </label>
                    <textarea 
                        id="dashOfficerNote" 
                        rows="2" 
                        class="custom-textarea-control"
                        placeholder="Contoh: Petugas posko telah mengonfirmasi dan bergerak ke lokasi..."
                    ></textarea>
                </div>
            </div>

            <div class="modal-actions-footer">
                <a href="#" id="btnGoToFullHistory" class="btn-modal-history-link" title="Buka detail lengkap di Halaman Riwayat">
                    <span>Buka di Riwayat</span>
                </a>
                <div class="modal-footer-btns-right">
                    <button type="button" class="btn-modal-cancel" id="btnCancelPetugasModal">Tutup</button>
                    <button type="button" class="btn-modal-submit" id="btnSaveDashboardStatusChange">
                        <span>Simpan Perubahan</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script type="module" src="{{ asset('js/petugas/dashboard.js') }}"></script>
@endpush
