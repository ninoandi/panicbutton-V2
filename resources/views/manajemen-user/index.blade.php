@extends('layouts.app')

@section('title', 'Manajemen Pengguna - Panic Button')

@section('page-title', 'Manajemen Pengguna')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/users.css') }}">
@endpush

@section('content')
<div class="users-page">

    {{-- =========================================================
         1. HEADER BANNER
    ========================================================== --}}
    <section class="users-header-card">
        <div class="users-header-text">
            <div class="users-header-badge">
                <span class="pulse-dot-indigo"></span>
                <span>Manajemen Pengguna Terpusat</span>
            </div>
            <h1>Daftar Pengguna & Warga</h1>
            <p>Kelola data akun warga, nomor rumah, kontak darurat, serta perizinan peran sistem di setiap perumahan.</p>
        </div>

        <button type="button" class="btn-add-user" id="openAddUserModal">
            <i class="fa-solid fa-user-plus"></i>
            <span>Tambah Pengguna</span>
        </button>
    </section>

    {{-- =========================================================
         2. TOP METRICS SUMMARY (3 CARDS)
    ========================================================== --}}
    <section class="users-summary">

        {{-- Card 1: Total Pengguna --}}
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
                <span class="users-summary-label">Total Pengguna</span>
                <strong class="users-summary-count" id="totalUserCount">0</strong>
                <span class="users-summary-desc">Keseluruhan akun pengguna terdata</span>
            </div>
        </div>

        {{-- Card 2: Akun Warga --}}
        <div class="users-summary-card users-card-warga">
            <div class="users-summary-header">
                <div class="users-summary-icon users-icon-warga">
                    <i class="fa-solid fa-house-user"></i>
                </div>
                <span class="users-badge-warga">
                    Warga Aktif
                </span>
            </div>
            <div class="users-summary-body">
                <span class="users-summary-label">Akun Warga</span>
                <strong class="users-summary-count" id="totalWargaCount">0</strong>
                <span class="users-summary-desc">Akun warga penghuni perumahan</span>
            </div>
        </div>

        {{-- Card 3: Admin / Pengurus --}}
        <div class="users-summary-card users-card-admin">
            <div class="users-summary-header">
                <div class="users-summary-icon users-icon-admin">
                    <i class="fa-solid fa-user-shield"></i>
                </div>
                <span class="users-badge-admin">
                    Pengelola
                </span>
            </div>
            <div class="users-summary-body">
                <span class="users-summary-label">Admin & Petugas</span>
                <strong class="users-summary-count" id="totalAdminCount">0</strong>
                <span class="users-summary-desc">Petugas keamanan & administrator</span>
            </div>
        </div>

    </section>

    {{-- =========================================================
         3. CUSTOM AESTHETIC FILTER BAR (NO EMOJIS)
    ========================================================== --}}
    <section class="users-filter-card">
        <div class="users-filter-grid">

            {{-- 1. Search Input --}}
            <div class="filter-group">
                <label for="searchInput" class="filter-label">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span>Pencarian Pengguna</span>
                </label>
                <div class="search-input-wrapper">
                    <i class="fa-solid fa-search"></i>
                    <input
                        type="text"
                        id="searchInput"
                        class="search-input-field"
                        placeholder="Cari nama, nomor rumah, atau nomor telepon..."
                    >
                </div>
            </div>

            {{-- 2. Custom Perumahan Filter --}}
            <div class="filter-group">
                <label for="perumahanFilter" class="filter-label">
                    <i class="fa-solid fa-building-shield"></i>
                    <span>Perumahan</span>
                </label>
                <div class="custom-select-wrapper">
                    <select id="perumahanFilter" class="custom-select-field">
                        <option value="">Semua Perumahan</option>
                    </select>
                    <i class="fa-solid fa-chevron-down select-arrow"></i>
                </div>
            </div>

            {{-- 3. Custom Role Filter (No Emojis) --}}
            <div class="filter-group">
                <label for="roleFilter" class="filter-label">
                    <i class="fa-solid fa-user-tag"></i>
                    <span>Peran (Role)</span>
                </label>
                <div class="custom-select-wrapper">
                    <select id="roleFilter" class="custom-select-field">
                        <option value="">Semua Role</option>
                        <option value="user">User</option>
                        <option value="admin">Admin/Satpam</option>
                    </select>
                    <i class="fa-solid fa-chevron-down select-arrow"></i>
                </div>
            </div>

        </div>
    </section>

    {{-- =========================================================
         4. USER CARDS CONTAINER
    ========================================================== --}}
    <div class="card-container" id="cardContainer">
        {{-- Diisi secara realtime oleh users.js --}}
    </div>

    {{-- =========================================================
         5. PAGINATION
    ========================================================== --}}
    <div id="paginationContainer">
        <div id="paginationInfo">
            Menampilkan 0 - 0 dari 0 data
        </div>

        <div class="pagination-actions">
            <button type="button" id="prevPage">
                <i class="fa-solid fa-chevron-left"></i>
                <span>Sebelumnya</span>
            </button>

            <button type="button" id="nextPage">
                <span>Berikutnya</span>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    </div>

</div>

{{-- =========================================================
     6. MODAL TAMBAH PENGGUNA (GLASSMORPHISM)
========================================================== --}}
<div id="addUserModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3><i class="fa-solid fa-user-plus" style="margin-right: 8px;"></i> Tambah Pengguna Baru</h3>
            <button type="button" class="close-modal" id="closeModal">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="modal-body">
            <div class="form-group">
                <label for="perumahanSelect">Perumahan</label>
                <select id="perumahanSelect">
                    <option value="">Pilih Perumahan</option>
                </select>
            </div>

            <div class="form-group">
                <label for="userName">Nama Lengkap</label>
                <input type="text" id="userName" placeholder="Masukkan nama pengguna">
            </div>

            <div class="form-group">
                <label for="houseNumber">Nomor Rumah</label>
                <input type="text" id="houseNumber" placeholder="Contoh: A-12, B-05">
            </div>

            <div class="form-group">
                <label for="password">Password Akun</label>
                <input type="password" id="password" placeholder="Masukkan password">
            </div>

            <div class="form-group">
                <label for="roleSelect">Role Pengguna</label>
                <div class="role-select">
                    <select id="roleSelect">
                        <option value="user">User (Warga)</option>
                        <option value="admin">Admin / Satpam</option>
                        <option value="custom">Custom Role</option>
                    </select>
                </div>
                <input
                    type="text"
                    id="customRoleInput"
                    class="custom-role-input"
                    placeholder="Tuliskan nama role kustom..."
                >
            </div>


            <!-- ====================================================== -->
<!-- FIELD PERANGKAT IOT (Tambahan) -->
<!-- ====================================================== -->

<div class="form-group">
    <label for="userDeviceSelect">
        <i class="fa-solid fa-microchip"></i> Perangkat IoT
    </label>
    <div class="custom-select-wrapper">
        <select class="custom-select-field" id="userDeviceSelect">
            <option value="">-- Pilih Perangkat --</option>
            <!-- Options akan diisi oleh JavaScript -->
        </select>
        <i class="fa-solid fa-chevron-down select-arrow"></i>
    </div>
    <small style="font-size: 11px; color: var(--dash-text-muted);">
        Pilih perangkat IoT yang akan ditugaskan ke pengguna ini
    </small>
</div>

<div class="form-group">
    <label for="userZonaInput">
        <i class="fa-solid fa-location-dot"></i> Zona
    </label>
    <input 
        type="text" 
        class="form-control" 
        id="userZonaInput" 
        placeholder="Zona akan terisi otomatis saat perangkat dipilih"
        readonly
        style="background: var(--dash-bg); cursor: default;"
    />
    <small style="font-size: 11px; color: var(--dash-text-muted);">
        Zona akan terisi otomatis berdasarkan perangkat yang dipilih
    </small>
</div>

<div class="form-group">
    <label for="userPhoneNumber">
        <i class="fa-solid fa-phone"></i> Nomor HP / WhatsApp
    </label>
    <input 
        type="text" 
        class="form-control" 
        id="userPhoneNumber" 
        placeholder="Contoh: 08123456789"
    />
</div>
        </div>

        <div class="modal-footer">
            <button type="button" class="btn btn-cancel" id="cancelBtn">Batal</button>
            <button type="button" class="btn btn-save" id="saveUserBtn">
                <i class="fa-solid fa-floppy-disk"></i>
                <span>Simpan Pengguna</span>
            </button>
        </div>
    </div>
</div>

@endsection

@push('scripts')
<script type="module" src="{{ asset('js/users.js') }}"></script>
@endpush