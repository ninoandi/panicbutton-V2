@extends('layouts.app')

@section('title', 'Daftar Pengguna')

@section('content')

<div class="users-page">

    {{-- Header halaman --}}

    {{-- Filter --}}
    <div class="filters">

        <div class="custom-select-wrapper">
            <select id="perumahanFilter">
                <option value="">Semua Perumahan</option>
            </select>
        </div>

        <div class="custom-select-wrapper">
            <select id="roleFilter">
                <option value="">Semua Role</option>
                <option value="user">User</option>
                <option value="admin">Admin/Satpam</option>
            </select>
        </div>

        <input
            type="text"
            id="searchInput"
            placeholder="Cari nama atau nomor rumah..."
        >

    </div>


    {{-- Daftar user --}}
    <div
        class="card-container"
        id="cardContainer"
    >
        {{-- Diisi oleh users.js --}}
    </div>


    {{-- Pagination --}}
    <div id="paginationContainer">

        <div id="paginationInfo">
            Menampilkan 0 - 0 dari 0 data
        </div>

        <div>
            <button
                type="button"
                id="prevPage"
            >
                Sebelumnya
            </button>

            <button
                type="button"
                id="nextPage"
            >
                Berikutnya
            </button>
        </div>

    </div>

</div>

@endsection


@push('styles')
    <link rel="stylesheet" href="{{ asset('css/users.css') }}">
@endpush

@push('scripts')
    <script type="module" src="{{ asset('js/users.js') }}"></script>
@endpush