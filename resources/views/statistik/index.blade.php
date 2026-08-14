@extends('layouts.app')

@section('title', 'Statistik Perumahan')


{{-- ============================= --}}
{{-- CSS --}}
{{-- ============================= --}}
@push('styles')

<link
    rel="stylesheet"
    href="{{ asset('css/statistik.css') }}"
>

@endpush


@section('content')

<div class="statistik-page">

    {{-- ========================================= --}}
    {{-- CONTENT UTAMA --}}
    {{-- ========================================= --}}
    <div class="statistik-content">


        {{-- ========================================= --}}
        {{-- SEARCH --}}
        {{-- ========================================= --}}
        <div class="search-card">

            <div class="search-container">

                <i class="fas fa-search"></i>

                <input
                    type="text"
                    id="searchInput"
                    class="search-input"
                    placeholder="Cari perumahan, kontak, lokasi..."
                    autocomplete="off"
                >

            </div>

        </div>


        {{-- ========================================= --}}
        {{-- TABLE CARD --}}
        {{-- ========================================= --}}
        <div class="table-card">

            <div class="table-wrapper">

                <table>

                    <thead>

                        <tr>

                            <th>No</th>

                            <th>
                                Nama Perumahan
                            </th>

                            <th>
                                Kontak
                            </th>

                            <th>
                                Lokasi
                            </th>

                            <th>
                                Grafik
                            </th>

                        </tr>

                    </thead>


                    <tbody id="perumahanTableBody">

                        <tr>

                            <td
                                colspan="5"
                                class="loading"
                            >

                                <i class="fas fa-spinner fa-spin"></i>

                                Memuat data...

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        </div>


        {{-- ========================================= --}}
        {{-- MOBILE CARD --}}
        {{-- ========================================= --}}
        <div
            class="card-container"
            style="display: none;"
            id="cardContainer"
        ></div>


        {{-- ========================================= --}}
        {{-- PAGINATION --}}
        {{-- ========================================= --}}
        <div class="pagination">


            {{-- Informasi jumlah data --}}
            <div
                class="pagination-info"
                id="paginationInfo"
            >
                Menampilkan 0 - 0 dari 0 data
            </div>


            {{-- Tombol pagination --}}
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

</div>

@endsection


{{-- ============================= --}}
{{-- JAVASCRIPT --}}
{{-- ============================= --}}
@push('scripts')

<script
    type="module"
    src="{{ asset('js/statistik.js') }}"
></script>

@endpush