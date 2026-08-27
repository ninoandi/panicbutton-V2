@extends('layouts.app')

@section('title', 'User Public - Panic Button')

@section('page-title', 'User Public')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/users-public.css') }}">
@endpush

@section('content')
<div class="users-page">

    {{-- =========================================================
         1. HEADER BANNER (HARMONIZED DESIGN FORMAT)
    ========================================================== --}}
    <section class="users-header-card">
        <div class="users-header-text">
            <div class="users-header-badge">
                <span class="pulse-dot-public"></span>
                <span>Manajemen User Publik Terpusat</span>
            </div>
            <h1>User Public</h1>
            <p>Kelola data akun pengguna publik, informasi kontak, data medis & kesehatan, serta penugasan perangkat IoT.</p>
        </div>

        <button type="button" class="btn-add-user" id="openAddUserPublicModal">
            <i class="fa-solid fa-user-plus"></i>
            <span>Tambah User Public</span>
        </button>
    </section>

    {{-- =========================================================
         2. FILTER BAR (SEARCH & BUTTON IMPORT EXCEL)
    ========================================================== --}}
    <section class="users-filter-card">
        <div class="users-filter-grid">

            {{-- 1. Search Input --}}
            <div class="filter-group filter-search-group">
                <label for="searchInputPublic" class="filter-label">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span>Pencarian User Public</span>
                </label>
                <div class="search-input-wrapper">
                    <i class="fa-solid fa-search"></i>
                    <input
                        type="text"
                        id="searchInputPublic"
                        class="search-input-field"
                        placeholder="Cari nama pengguna, username, no handphone, email, perangkat..."
                        autocomplete="off"
                    >
                </div>
            </div>

            {{-- 2. Button Import / Unduh Excel --}}
            <div class="filter-group filter-action-group">
                <label class="filter-label" style="opacity:0; pointer-events:none;">
                    <span>Aksi</span>
                </label>
                <button type="button" id="btnExportUserPublicExcel" class="btn-export-excel" title="Import / Unduh Excel Data User Public">
                    <i class="fa-solid fa-file-excel"></i>
                    <span>Import Data User</span>
                </button>
            </div>

        </div>
    </section>

    {{-- =========================================================
         3. TABEL DATA USER PUBLIC
    ========================================================== --}}
    <section class="users-table-card">
        <div class="table-wrapper">
            <table class="custom-table" id="userPublicTable">
                <thead>
                    <tr>
                        <th style="width: 60px; text-align: center;">No</th>
                        <th>Nama Pengguna</th>
                        <th style="width: 170px;">No Handphone</th>
                        <th style="width: 220px;">Email</th>
                        <th style="width: 150px;">Jenis Kelamin</th>
                        <th style="width: 180px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="userPublicTableBody">
                    <tr>
                        <td colspan="6" class="loading-state">
                            <i class="fa-solid fa-circle-notch fa-spin"></i> Memuat data user public...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    {{-- =========================================================
         4. PAGINATION
    ========================================================== --}}
    <div id="paginationContainerPublic" class="pagination-wrapper">
        <div id="paginationInfoPublic" class="pagination-info">
            Menampilkan 0 - 0 dari 0 data
        </div>

        <div class="pagination-actions">
            <button type="button" id="prevPagePublic" class="btn-pagination" disabled>
                <i class="fa-solid fa-chevron-left"></i>
                <span>Sebelumnya</span>
            </button>

            <button type="button" id="nextPagePublic" class="btn-pagination" disabled>
                <span>Berikutnya</span>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    </div>

</div>

{{-- =========================================================
     5. MODAL TAMBAH / EDIT USER PUBLIC
========================================================== --}}
<div id="addUserPublicModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3>
                <i class="fa-solid fa-user-plus" style="margin-right: 8px;"></i>
                <span id="modalTitle">Tambah User Public</span>
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

            {{-- Jenis Kelamin --}}
            <div class="form-group">
                <label for="userPublicGender">Jenis Kelamin</label>
                <select id="userPublicGender" class="custom-select-field">
                    <option value="">-- Pilih Jenis Kelamin --</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                </select>
            </div>

            {{-- PERANGKAT IOT --}}
            <div class="form-group">
                <label for="userPublicDevice">
                    <i class="fa-solid fa-microchip"></i> Perangkat IoT
                </label>
                <select id="userPublicDevice" class="custom-select-field">
                    <option value="">-- Pilih Perangkat --</option>
                </select>
                <small style="color: var(--dash-text-muted); font-size: 11.5px; display: block; margin-top: 4px;">
                    Pilih perangkat IoT fisik yang ditugaskan ke pengguna ini.
                </small>
            </div>

            {{-- Zona --}}
            <div class="form-group">
                <label for="userPublicZona">
                    <i class="fa-solid fa-location-dot"></i> Zona
                </label>
                <input 
                    type="text" 
                    id="userPublicZona" 
                    placeholder="Zona akan terisi otomatis dari perangkat" 
                    readonly 
                    style="background: var(--dash-bg); cursor: default;"
                />
            </div>

            {{-- Password --}}
            <div class="form-group" id="userPublicPasswordGroup">
                <label for="userPublicPassword">Password Akun <span style="color: var(--dash-emergency);">*</span></label>
                <div class="password-toggle-wrapper">
                    <input type="password" id="userPublicPassword" placeholder="Minimal 6 karakter">
                    <button type="button" class="btn-toggle-eye" id="toggleUserPublicPassword" title="Lihat/Sembunyikan Password">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                <small id="userPublicPasswordHelp" style="color: var(--dash-text-muted); font-size: 11.5px; display: none; margin-top: 4px;">
                    *Biarkan kosong jika tidak ingin mengubah kata sandi lama.
                </small>
            </div>

            {{-- Konfirmasi Password --}}
            <div class="form-group" id="userPublicPasswordConfirmGroup">
                <label for="userPublicPasswordConfirm">Konfirmasi Password <span style="color: var(--dash-emergency);">*</span></label>
                <div class="password-toggle-wrapper">
                    <input type="password" id="userPublicPasswordConfirm" placeholder="Ketik ulang password">
                    <button type="button" class="btn-toggle-eye" id="toggleUserPublicPasswordConfirm" title="Lihat/Sembunyikan Password">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
            </div>

            {{-- Role default: user --}}
            <input type="hidden" id="userPublicStatus" value="user">
        </div>

        <div class="modal-footer">
            <button type="button" class="btn btn-cancel" id="cancelPublicBtn">Batal</button>
            <button type="button" class="btn btn-save" id="saveUserPublicBtn">
                <i class="fa-solid fa-floppy-disk"></i>
                <span id="saveBtnText">Simpan User Public</span>
            </button>
        </div>
    </div>
</div>

{{-- =========================================================
     6. MODAL DETAIL USER PUBLIC (LENGKAP: PERSONAL, MEDIS & KONTAK)
========================================================== --}}
<div id="detailUserPublicModal" class="modal" style="display: none;">
    <div class="modal-content modal-detail-public-content">
        <div class="modal-header">
            <h3>
                <i class="fa-solid fa-id-card-clip" style="margin-right: 8px;"></i>
                <span>Detail Profil Lengkap User Public</span>
            </h3>
            <button type="button" class="close-modal" id="closeDetailPublicModal">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="modal-body" id="detailUserPublicModalBody">
            {{-- Diisi secara dinamis oleh users-public.js --}}
        </div>

        <div class="modal-footer">
            <button type="button" class="btn btn-cancel" id="closeDetailPublicBtn">Tutup</button>
        </div>
    </div>
</div>

@endsection

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<script type="module" src="{{ asset('js/users-public.js') }}"></script>
@endpush