@extends('layouts.app')

@section('title', 'Detail Statistik - Panic Button')

@section('page-title', 'Detail Statistik')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/detail-grafik.css') }}">
@endpush

@section('content')
<div class="detail-grafik-page">

    {{-- Loading Overlay --}}
    <div id="loadingOverlay">
        <div class="spinner"></div>
        <div>Memuat data analitik realtime...</div>
    </div>

    {{-- =========================================================
         1. HEADER BANNER
    ========================================================== --}}
    <section class="detail-header-card">
        <div class="detail-header-text">
            <div class="detail-header-badge">
                <span class="pulse-dot-indigo"></span>
                <span>Visualisasi Data & Grafik Interaktif</span>
            </div>
            <h1 id="pageTitle">
                <span>Statistik Insiden:</span>
                <span class="perumahan-tag" id="perumahanTag">Memuat...</span>
            </h1>
            <p>Eksplorasi visual sebaran insiden darurat, rasio status penyelesaian, dan frekuensi penekanan tombol panic button per warga.</p>
        </div>

        <div class="detail-header-actions">
            <a href="{{ url('/statistik') }}" class="btn-back">
                <i class="fa-solid fa-arrow-left"></i>
                <span>Kembali ke Statistik</span>
            </a>
        </div>
    </section>

    {{-- =========================================================
         2. CHARTS GRID
    ========================================================== --}}
    <div class="chart-grid">

        {{-- Prioritas Chart --}}
        <div class="chart-container">
            <div class="chart-header">
                <div class="chart-header-left">
                    <div class="chart-icon-badge badge-red">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div class="chart-title">
                        <h2>Prioritas Peringatan</h2>
                        <p>Distribusi insiden berdasarkan tingkat kedaruratan</p>
                    </div>
                </div>
            </div>

            <div class="chart-canvas-wrapper">
                <canvas id="barChart"></canvas>
            </div>

            <div class="chart-hint">
                <span>Klik batang grafik untuk melihat rincian pengguna</span>
            </div>
        </div>

        {{-- Status Chart --}}
        <div class="chart-container status-chart">
            <div class="chart-header">
                <div class="chart-header-left">
                    <div class="chart-icon-badge badge-blue">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>
                    <div class="chart-title">
                        <h2>Status Penanganan</h2>
                        <p>Perbandingan insiden selesai vs dalam proses</p>
                    </div>
                </div>

                <button type="button" id="lihatPerbandinganBtn" class="comparison-button">
                    <span>Lihat Perbandingan</span>
                </button>
            </div>

            <div class="chart-canvas-wrapper">
                <canvas id="pieChart"></canvas>
            </div>

            <div class="chart-hint">
                <span>Klik irisan grafik untuk melihat rincian pengguna</span>
            </div>
        </div>

        {{-- Ranking Pengguna Chart (Full Width) --}}
        <div class="chart-container chart-card-full">
            <div class="chart-header">
                <div class="chart-header-left">
                    <div class="chart-icon-badge badge-purple">
                        <i class="fa-solid fa-ranking-star"></i>
                    </div>
                    <div class="chart-title">
                        <h2>Peringkat Aktivitas Pemicu Alarm</h2>
                        <p>Frekuensi penekanan tombol panic button oleh warga kawasan</p>
                    </div>
                </div>
            </div>

            <div class="chart-canvas-wrapper">
                <canvas id="rankingChart"></canvas>
            </div>

            <div class="chart-hint">
                <span>Klik bar ranking untuk melihat detail riwayat alarm per pengguna</span>
            </div>
        </div>

    </div>

</div>

{{-- =========================================================
     3. GLASSMORPHISM MODAL DETAIL
========================================================== --}}
<div class="modal-overlay" id="customModal">
    <div class="modal">
        <div class="modal-header">
            <h2 id="modalTitle">
                <i class="fa-solid fa-circle-info" style="color: var(--dash-primary);"></i>
                <span>Rincian Pengguna</span>
            </h2>
            <button type="button" class="modal-close" id="modalCloseBtn">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="modal-body" id="modalContent">
            Isi konten akan dimuat di sini...
        </div>
    </div>
</div>
@endsection

@push('scripts')
    {{-- Chart.js CDN --}}
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    {{-- Kirim ID perumahan dari Laravel ke JavaScript --}}
    <script>
        window.perumahanId = @json(request('perumahan'));
    </script>

    {{-- JavaScript halaman --}}
    <script type="module" src="{{ asset('js/detail-grafik.js') }}"></script>
@endpush