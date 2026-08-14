@extends('layouts.app')

@section('title', 'Detail Perumahan')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/detail-perumahan.css') }}">
@endpush

@section('content')

<div class="monitor-page">

    {{-- Header --}}
    <div class="monitor-header">

        <div class="monitor-header-left">
            <h1 id="title">Detail Perumahan</h1>
        </div>

        <div class="monitor-header-right">
            <a href="{{ url('/perumahan') }}" class="btn-back">
                ← Kembali
            </a>

            <button id="clearAllBtn" class="btn-delete">
                🗑️ Hapus Semua Monitor
            </button>
        </div>

    </div>


    {{-- Filter --}}
    <div id="filterControls" class="filter-controls">

        <div class="search-wrapper">
            <input
                type="text"
                id="search"
                placeholder="Cari data..."
                autocomplete="off"
            >
        </div>

        <select id="statusFilter">
            <option value="">Status: Semua</option>
            <option value="Proses">Proses</option>
            <option value="Selesai">Selesai</option>
        </select>

        <select id="priorityFilter">
            <option value="">Prioritas: Semua</option>
            <option value="Biasa">Biasa</option>
            <option value="Penting">Penting</option>
            <option value="Darurat">Darurat</option>
        </select>

        <select id="sortOrder">
            <option value="desc">Waktu: Terbaru</option>
            <option value="asc">Waktu: Terlama</option>
        </select>

    </div>


    {{-- Table --}}
    <div class="table-wrapper">

        <table id="monitorTable">

            <thead>
                <tr>
                    <th>Nama</th>
                    <th>No Rumah</th>
                    <th>Pesan</th>
                    <th>Prioritas</th>
                    <th>Status</th>
                    <th>Waktu</th>
                    <th>Lokasi</th>
                </tr>
            </thead>

            <tbody id="monitorTableBody">

                <tr>
                    <td colspan="7" class="loading-state">
                        Memuat data monitor...
                    </td>
                </tr>

            </tbody>

        </table>

    </div>


    {{-- Pagination --}}
    <div id="pagination"></div>

</div>

@endsection


@push('scripts')

    {{-- SweetAlert --}}
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    {{-- Kirim key Laravel ke JavaScript --}}
    <script>
        window.monitorKey = @json($key);
        console.log('KEY DARI LARAVEL:', window.monitorKey);
    </script>

    {{-- JavaScript halaman --}}
    <script type="module" src="{{ asset('js/detail-perumahan.js') }}"></script>

@endpush