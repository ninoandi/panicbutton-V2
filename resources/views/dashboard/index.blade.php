@extends('layouts.app')

@section('title', 'Dashboard Panic Button')

@section('page-title', 'Dashboard Panic Button')


@section('content')

    {{-- Loading --}}
    <div
        id="loadingOverlay"
        role="alert"
        aria-live="assertive"
        aria-busy="true"
    >
        <div
            class="spinner"
            aria-hidden="true"
        ></div>

        <div id="loadingText">
            Sedang memuat dashboard...
        </div>
    </div>


    {{-- Dashboard --}}
    <main
        class="main-content"
        id="mainContent"
    >

        {{-- Rekap Data --}}
        <a
            href="{{ route('perumahan') }}"
            class="card"
        >

            <section>

                <h2 class="card-title">

                    <i class="fas fa-table"></i>

                    Rekap Data Perumahan

                </h2>

                <div class="card-content">

                    <div
                        class="card-value"
                        id="totalPerumahan"
                    >
                        ...
                    </div>

                </div>

            </section>

        </a>


        {{-- User --}}
        <a
            href="{{ route('manajemen-user') }}"
            class="card"
        >

            <section>

                <h2 class="card-title">

                    <i class="fas fa-user"></i>

                    Manajemen User
                </h2>

                <div class="card-content">

                    <div
                        class="card-value"
                        id="totalUsers"
                    >
                        ...
                    </div>

                </div>

            </section>

        </a>


        {{-- Statistik --}}
        <a
            href="{{ route('statistik') }}"
            class="card special-card"
        >

            <section>

                <h2 class="card-title">

                    Detail Statistik

                </h2>

                <div class="card-content">

                    <div class="card-value">

                        <i class="fas fa-chart-line"></i>

                        Lihat Grafik

                    </div>

                </div>

            </section>

        </a>


        {{-- Status Button --}}
        <div
            class="card-status"
            id="statusCard"
        >

            <section>

                <h2
                    class="card-title"
                    style="font-size: 28px;"
                >
                    Status Button
                </h2>

                <div class="card-content">

                    <div
                        class="card-value"
                        id="statusText"
                    >
                        ...
                    </div>

                </div>

            </section>

        </div>


        {{-- Live Alert --}}
        <div
            id="liveAlert"
            class="live-box"
        >

            <div class="live-empty">

                🚨 Peringatan Darurat Akan Tampil Disini

            </div>

        </div>

    </main>

    <!-- =========================================
     QUICK MESSAGE MODAL
========================================= -->

<div id="quickMessageModal" class="quick-message-modal">

    <div class="quick-message-box">

        <!-- Header -->
        <div class="quick-message-header">

            <div>
                <h3>
                    <i class="fas fa-comment-dots"></i>
                    Kelola Quick Messages
                </h3>

                <p>
                    Tambahkan pesan yang dapat digunakan sebagai pesan cepat.
                </p>
            </div>

            <button
                type="button"
                id="quickMessageClose"
                class="quick-message-close">
                &times;
            </button>

        </div>

        <!-- Body -->
        <div class="quick-message-body">

            <!-- Search -->
            <input
                type="text"
                id="quickMessageSearch"
                class="quick-message-search"
                placeholder="Cari pesan..."
            >

            <!-- Table -->
            <div class="quick-message-table-wrapper">

                <table class="quick-message-table">

                    <thead>
                        <tr>
                            <th>Pesan</th>
                            <th style="width: 140px;">
                                Aksi
                            </th>
                        </tr>
                    </thead>

                    <tbody id="quickMessageTableBody">

                        <tr>
                            <td colspan="2">
                                <div class="quick-message-empty">
                                    Memuat pesan...
                                </div>
                            </td>
                        </tr>

                    </tbody>

                </table>

            </div>

            <!-- Add Message -->
            <div class="quick-message-add">

                <input
                    type="text"
                    id="newQuickMessage"
                    class="quick-message-input"
                    placeholder="Tulis pesan baru..."
                >

                <button
                    type="button"
                    id="addQuickMessage"
                    class="quick-message-add-btn">

                    <i class="fas fa-plus"></i>
                    Tambah

                </button>

            </div>

        </div>

    </div>

</div>

@endsection


@push('scripts')

    <script
    type="module"
    src="{{ asset('js/dashboard.js') }}"
></script>

@endpush