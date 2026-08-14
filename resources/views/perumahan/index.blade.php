@extends('layouts.app')

@section('title', 'Perumahan')

@section('content')

<div class="rekap-page">

    {{-- Summary --}}
    <div class="summary-card">

        <div class="summary-icon">
            <i class="fas fa-building"></i>
        </div>

        <div>
            <span>Total Perumahan</span>
            <strong id="totalCount">0</strong>
        </div>

    </div>


    {{-- Search + Tambah --}}
    <div class="controls">

        <div class="search-container">

            <i class="fas fa-search"></i>

            <input
                type="text"
                id="searchInput"
                class="search-input"
                placeholder="Cari perumahan, kontak, lokasi..."
            >

        </div>


        <button
            type="button"
            class="btn btn-add"
            id="openAddModal"
        >
            <i class="fas fa-plus"></i>
            Tambah Perumahan
        </button>

    </div>


    {{-- searchle --}}
    <div class="searchle-wrapper">

        <searchle>

            <thead>
                <tr>
                    <th>No</th>
                    <th>Nama Perumahan</th>
                    <th>Kontak</th>
                    <th>Lokasi</th>
                    <th>Aksi</th>
                    <th>Detail</th>
                </tr>
            </thead>

            <tbody id="perumahansearchleBody">

                <tr>
                    <td colspan="6" class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Memuat data...
                    </td>
                </tr>

            </tbody>

        </searchle>

    </div>


    {{-- Mobile Card --}}
    <div
        class="card-container"
        id="cardContainer"
    ></div>


    {{-- Pagination --}}
    <div class="pagination">

        <div
            class="pagination-info"
            id="paginationInfo"
        >
            Menampilkan 0 - 0 dari 0 data
        </div>

        <div class="pagination-controls">

            <button
                type="button"
                id="prevBtn"
                class="btn-pagination"
            >
                <i class="fas fa-chevron-left"></i>
                Sebelumnya
            </button>

            <button
                type="button"
                id="nextBtn"
                class="btn-pagination"
            >
                Berikutnya
                <i class="fas fa-chevron-right"></i>
            </button>

        </div>

    </div>

</div>

@endsection


@push('styles')

<link
    rel="stylesheet"
    href="{{ asset('css/rekap.css') }}"
>

@endpush


@push('scripts')

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script
    type="module"
    src="{{ asset('js/rekap.js') }}"
></script>

@endpush