@extends('layouts.app')

@section('title', 'Manajemen User Publik - Panic Button')

@section('page-title', 'Manajemen User Publik')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/users-public.css') }}">
@endpush

@section('content')
<div class="users-page">

    {{-- =========================================================
         1. HEADER BANNER
    ========================================================== --}}
    <section class="users-header-card">
        <div class="users-header-text">
            <div class="users-header-badge">
                <span class="pulse-dot-public"></span>
                <span>Manajemen User Publik Terpusat</span>
            </div>
            <h1>Daftar User Publik</h1>
            <p>Kelola data akun panic button public</p>
        </div>

        {{-- ✅ TOMBOL TETAP DIRENDER, TAPI JS YANG MENGONTROL AKSES --}}
        <button type="button" class="btn-add-user" id="openAddUserPublicModal">
            <i class="fa-solid fa-user-plus"></i>
            <span>Tambah User Publik</span>
        </button>
    </section>

    {{-- =========================================================
         2. TOP METRICS SUMMARY (3 CARDS)
    ========================================================== --}}
    <section class="users-summary">

        {{-- Card 1: Total User Publik --}}
        <div class="users-summary-card users-card-total">
            <div class="users-summary-header">
                <div class="users-summary-icon users-icon-total">
                    <i class="fa-solid fa-users"></i>
                </div>
                <span class="users-badge-total">
                    Terdaftar
                </span>
            </div>
            <div class="users-summary-body">
                <span class="users-summary-label">Total User Publik</span>
                <strong class="users-summary-count" id="totalPublicUserCount">0</strong>
                <span class="users-summary-desc">Keseluruhan akun publik terdata</span>
            </div>
        </div>

        {{-- Card 2: User --}}
        <div class="users-summary-card users-card-warga">
            <div class="users-summary-header">
                <div class="users-summary-icon users-icon-warga">
                    <i class="fa-solid fa-user"></i>
                </div>
                <span class="users-badge-warga">
                    User
                </span>
            </div>
            <div class="users-summary-body">
                <span class="users-summary-label">Total User</span>
                <strong class="users-summary-count" id="totalActiveUserCount">0</strong>
                <span class="users-summary-desc">Akun user biasa</span>
            </div>
        </div>

        {{-- Card 3: Admin --}}
        <div class="users-summary-card users-card-admin">
            <div class="users-summary-header">
                <div class="users-summary-icon users-icon-admin">
                    <i class="fa-solid fa-user-shield"></i>
                </div>
                <span class="users-badge-admin">
                    Admin
                </span>
            </div>
            <div class="users-summary-body">
                <span class="users-summary-label">Total Admin</span>
                <strong class="users-summary-count" id="totalAdminUserCount">0</strong>
                <span class="users-summary-desc">Akun admin</span>
            </div>
        </div>

    </section>

    {{-- =========================================================
         3. FILTER BAR
    ========================================================== --}}
    <section class="users-filter-card">
        <div class="users-filter-grid">

            {{-- 1. Search Input --}}
            <div class="filter-group">
                <label for="searchInputPublic" class="filter-label">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span>Pencarian User Publik</span>
                </label>
                <div class="search-input-wrapper">
                    <i class="fa-solid fa-search"></i>
                    <input
                        type="text"
                        id="searchInputPublic"
                        class="search-input-field"
                        placeholder="Cari nama, email, no telp, atau perangkat..."
                    >
                </div>
            </div>

            {{-- 2. Role Filter --}}
            <div class="filter-group">
                <label for="statusFilter" class="filter-label">
                    <i class="fa-solid fa-user-tag"></i>
                    <span>Role</span>
                </label>
                <div class="custom-select-wrapper">
                    <select id="statusFilter" class="custom-select-field">
                        <option value="">Semua Role</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                    <i class="fa-solid fa-chevron-down select-arrow"></i>
                </div>
            </div>

        </div>
    </section>

    {{-- =========================================================
         4. USER PUBLIC CARDS CONTAINER
    ========================================================== --}}
    <div class="card-container" id="cardContainerPublic">
        {{-- Diisi secara realtime oleh users-public.js --}}
    </div>

    {{-- =========================================================
         5. PAGINATION
    ========================================================== --}}
    <div id="paginationContainerPublic">
        <div id="paginationInfoPublic">
            Menampilkan 0 - 0 dari 0 data
        </div>

        <div class="pagination-actions">
            <button type="button" id="prevPagePublic">
                <i class="fa-solid fa-chevron-left"></i>
                <span>Sebelumnya</span>
            </button>

            <button type="button" id="nextPagePublic">
                <span>Berikutnya</span>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    </div>

</div>

{{-- =========================================================
     6. MODAL TAMBAH / EDIT USER PUBLIK
========================================================== --}}
<div id="addUserPublicModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3>
                <i class="fa-solid fa-user-plus" style="margin-right: 8px;"></i>
                <span id="modalTitle">Tambah User Publik</span>
            </h3>
            <button type="button" class="close-modal" id="closePublicModal">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="modal-body">
            {{-- Nama Lengkap --}}
            <div class="form-group">
                <label for="userPublicName">Nama Lengkap <span class="text-danger">*</span></label>
                <input type="text" id="userPublicName" placeholder="Masukkan nama lengkap" required>
            </div>

            {{-- Username --}}
            <div class="form-group">
                <label for="userPublicUsername">Username</label>
                <input type="text" id="userPublicUsername" placeholder="Masukkan username">
            </div>

            {{-- Email --}}
            <div class="form-group">
                <label for="userPublicEmail">Email</label>
                <input type="email" id="userPublicEmail" placeholder="Masukkan email">
            </div>

            {{-- Nomor Telepon --}}
            <div class="form-group">
                <label for="userPublicPhone">Nomor Telepon</label>
                <input type="text" id="userPublicPhone" placeholder="Masukkan nomor telepon">
            </div>

            {{-- PERANGKAT IOT --}}
            <div class="form-group">
                <label for="userPublicDevice">
                    <i class="fa-solid fa-microchip"></i> Perangkat IoT
                </label>
                <select id="userPublicDevice" class="custom-select-field">
                    <option value="">-- Pilih Perangkat --</option>
                </select>
                <small style="color: var(--dash-text-muted); font-size: 12px; display: block; margin-top: 4px;">
                    <i class="fa-solid fa-info-circle"></i>
                    Pilih perangkat Panic Button fisik yang akan digunakan oleh user ini.
                    Perangkat harus sudah terdaftar di <strong>panicChannels</strong>.
                </small>
            </div>

            {{-- Zona --}}
            <div class="form-group">
                <label for="userPublicZona">Zona</label>
                <input type="text" id="userPublicZona" placeholder="Contoh: Zona A, Zona 1">
                <small style="color: var(--dash-text-muted); font-size: 12px; display: block; margin-top: 4px;">
                    <i class="fa-solid fa-info-circle"></i>
                    Zona akan otomatis terisi dari perangkat yang dipilih.
                </small>
            </div>

            {{-- Role --}}
            <div class="form-group">
                <label for="userPublicStatus">Role</label>
                <select id="userPublicStatus" class="custom-select-field">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
        </div>

        <div class="modal-footer">
            <button type="button" class="btn btn-cancel" id="cancelPublicBtn">Batal</button>
            <button type="button" class="btn btn-save" id="saveUserPublicBtn">
                <i class="fa-solid fa-floppy-disk"></i>
                <span id="saveBtnText">Simpan User Publik</span>
            </button>
        </div>
    </div>
</div>

@endsection

@push('scripts')
<script type="module" src="{{ asset('js/users-public.js') }}"></script>
@endpush