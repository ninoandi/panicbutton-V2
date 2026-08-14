    @extends('layouts.app')

    @section('title', ' Detail Statistik')

    @push('styles')
        <link rel="stylesheet" href="{{ asset('css/detail-grafik.css') }}">
    @endpush

    @section('content')

    <div class="detail-grafik-page">

        {{-- Tombol kembali --}}
        <a href="{{ url('/statistik') }}" class="back-button">
            ← Kembali
        </a>

        {{-- Loading --}}
        <div id="loadingOverlay">
            <div class="spinner"></div>
            <div>Sedang mengambil data...</div>
        </div>

        {{-- Judul --}}
        <h1>
            Statistik
            <span class="panic-text">Panic Button</span>
        </h1>

        {{-- Grafik --}}
        <div class="chart-grid">

            {{-- Prioritas --}}
            <div class="chart-container">

                <div class="chart-title">
                    Prioritas Peringatan
                </div>

                <canvas id="barChart"></canvas>

                <small>
                    * Klik grafik untuk melihat detail pengguna
                </small>

            </div>


            {{-- Status --}}
            <div class="chart-container status-chart">

                <div class="chart-title">
                    Status Peringatan
                </div>

                <button
                    id="lihatPerbandinganBtn"
                    class="comparison-button"
                >
                    Lihat Perbandingan
                </button>

                <canvas id="pieChart"></canvas>

                <small>
                    * Klik grafik untuk melihat detail pengguna
                </small>

            </div>


            {{-- Ranking pengguna --}}
            <div class="chart-container chart-users">

                <div class="chart-title">
                    Ranking Jumlah Tekan Tombol per Pengguna
                </div>

                <canvas id="rankingChart"></canvas>

                <small>
                    * Klik grafik untuk melihat detail pengguna
                </small>

            </div>

        </div>

    </div>

    {{-- Modal --}}
    <div
        class="modal-overlay"
        id="customModal"
    >

        <div class="modal">

            <button
                class="modal-close"
                onclick="closeModal()"
            >
                ×
            </button>

            <h2 id="modalTitle">
                Judul
            </h2>

            <div id="modalContent">
                Isi konten akan dimuat di sini...
            </div>

        </div>

    </div>

    @endsection


    @push('scripts')

    {{-- Chart.js --}}
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    {{-- Kirim ID perumahan dari Laravel ke JavaScript --}}
    <script>
        window.perumahanId = @json(request('perumahan'));
    </script>

    {{-- JavaScript halaman --}}
    <script
        type="module"
        src="{{ asset('js/detail-grafik.js') }}"
    ></script>

    @endpush