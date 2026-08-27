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
                <i class="fa-solid fa-bell"></i>
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
    
    {{-- A. Peringatan Darurat Perumahan --}}
    <section class="dashboard-card status-panic-section">
        <div class="card-header">
            <div class="card-header-title">
                <div class="card-header-icon emergency">
                    <i class="fa-solid fa-building-shield"></i>
                </div>
                <div>
                    <h2>Status Panic Button Perumahan</h2>
                    <p>Pantau alarm dan tombol darurat warga klaster perumahan</p>
                </div>
            </div>
            <div class="card-header-badge" id="housingAlertBadge">
                <span class="pulse-dot"></span>
                <span id="housingAlertBadgeText">Memeriksa Sinyal...</span>
            </div>
        </div>

        <div class="panic-grid" id="housingPanicGrid">
            <div class="panic-empty-state">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                <p>Menghubungkan ke server perumahan...</p>
            </div>
        </div>
    </section>

    {{-- B. Peringatan Darurat Public --}}
    <section class="dashboard-card status-panic-section" style="margin-top: 24px;">
        <div class="card-header">
            <div class="card-header-title">
                <div class="card-header-icon public-icon">
                    <i class="fa-solid fa-bullhorn"></i>
                </div>
                <div>
                    <h2>Status Panic Button Public</h2>
                    <p>Pantau sinyal tombol darurat dari pengguna dan perangkat IoT publik</p>
                </div>
            </div>
            <div class="card-header-badge" id="publicAlertBadge">
                <span class="pulse-dot"></span>
                <span id="publicAlertBadgeText">Memeriksa Sinyal...</span>
            </div>
        </div>

        <div class="panic-grid" id="publicPanicGrid">
            <div class="panic-empty-state">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                <p>Menghubungkan ke server publik...</p>
            </div>
        </div>
    </section>

</div>

{{-- MODAL RESPON / DETAIL LAPORAN --}}
<div id="petugasActionModal" class="modal-petugas-overlay" style="display: none;">
    <div class="modal-petugas-card">
        <div class="modal-petugas-header">
            <div class="modal-petugas-title">
                <i class="fa-solid fa-shield-halved"></i>
                <h3>Tanggapan Cepat Petugas</h3>
            </div>
            <button type="button" class="btn-close-petugas-modal" id="btnClosePetugasModal">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="modal-petugas-body" id="modalPetugasBody">
            {{-- Dynamic Content --}}
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script type="module" src="{{ asset('js/petugas/dashboard.js') }}"></script>
@endpush
