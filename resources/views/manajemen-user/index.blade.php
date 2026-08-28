@extends('layouts.app')

@section('title', 'User Perumahan - Panic Button')

@section('page-title', 'User Perumahan')

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
                <span>Data Pengguna Perumahan Terpadu</span>
            </div>
            <h1>User Perumahan</h1>
            <p>Kelola data akun warga perumahan, nomor rumah, nomor telepon, dan penugasan perangkat IoT.</p>
        </div>

        <button type="button" class="btn-add-user" id="openAddUserModal">
            <span>Tambah Pengguna</span>
        </button>
    </section>

    {{-- =========================================================
         2. FILTER BAR (SEARCH, PERUMAHAN & BUTTON IMPORT EXCEL)
    ========================================================== --}}
    <section class="users-filter-card">
        <div class="users-filter-grid">

            {{-- 1. Search Input --}}
            <div class="filter-group filter-search-group">
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
                        placeholder="Cari nama pengguna, no rumah, no handphone, perangkat..."
                        autocomplete="off"
                    >
                </div>
            </div>

            {{-- 2. Filter Perumahan --}}
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

            {{-- 3. Button Import / Unduh Excel --}}
            <div class="filter-group filter-action-group">
                <label class="filter-label" style="opacity:0; pointer-events:none;">
                    <span>Aksi</span>
                </label>
                <button type="button" id="btnExportUserPerumahanExcel" class="btn-export-excel" title="Import / Unduh Excel Data Pengguna Perumahan">
                    <span>Eksport Data User</span>
                </button>
            </div>

        </div>
    </section>

    {{-- =========================================================
         3. TABEL DATA USER PERUMAHAN
    ========================================================== --}}
    <section class="users-table-card">
        <div class="table-wrapper">
            <table class="custom-table" id="userPerumahanTable">
                <thead>
                    <tr>
                        <th style="width: 60px; text-align: center;">No</th>
                        <th>Nama Pengguna</th>
                        <th style="width: 120px;">No Rumah</th>
                        <th>Perumahan</th>
                        <th style="width: 160px;">No Handphone</th>
                        <th style="width: 170px;">Perangkat IoT</th>
                        <th style="width: 130px;">Zona</th>
                        <th style="width: 180px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="userPerumahanTableBody">
                    <tr>
                        <td colspan="8" class="loading-state">
                            <i class="fa-solid fa-circle-notch fa-spin"></i> Memuat data user perumahan...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    {{-- =========================================================
         4. PAGINATION
    ========================================================== --}}
    <div id="paginationContainer" class="pagination-wrapper">
        <div id="paginationInfo" class="pagination-info">
            Menampilkan 0 - 0 dari 0 data
        </div>

        <div class="pagination-actions">
            <button type="button" id="prevPage" class="btn-pagination" disabled>
                <i class="fa-solid fa-chevron-left"></i>
                <span>Sebelumnya</span>
            </button>

            <button type="button" id="nextPage" class="btn-pagination" disabled>
                <span>Berikutnya</span>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    </div>

</div>

{{-- =========================================================
     5. MODAL TAMBAH / EDIT PENGGUNA PERUMAHAN
========================================================== --}}
<div id="addUserModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3>
                <i class="fa-solid fa-user-plus" style="margin-right: 8px;"></i> 
                <span id="modalTitle">Tambah Pengguna Baru</span>
            </h3>
            <button type="button" class="close-modal" id="closeModal">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="modal-body">
            <div class="form-group">
                <label for="perumahanSelect">Perumahan <span class="text-danger">*</span></label>
                <select id="perumahanSelect" class="custom-select-field">
                    <option value="">Pilih Perumahan</option>
                </select>
            </div>

            <div class="form-group">
                <label for="userName">Nama Lengkap <span class="text-danger">*</span></label>
                <input type="text" id="userName" placeholder="Masukkan nama lengkap pengguna">
            </div>

            <div class="form-group">
                <label for="houseNumber">Nomor Rumah <span class="text-danger">*</span></label>
                <input type="text" id="houseNumber" placeholder="Contoh: A-12, B-05">
            </div>

            <div class="form-group">
                <label for="userPhoneNumber">
                    <i class="fa-solid fa-phone"></i> Nomor HP / WhatsApp
                </label>
                <input 
                    type="text" 
                    id="userPhoneNumber" 
                    placeholder="Contoh: 08123456789"
                />
            </div>

            <div class="form-group">
                <label for="userEmail">
                    <i class="fa-solid fa-envelope"></i> Alamat Email
                </label>
                <input 
                    type="email" 
                    id="userEmail" 
                    placeholder="Contoh: warga@email.com"
                />
            </div>

            <div class="form-group" id="userPasswordGroup">
                <label for="password">Password Akun <span class="text-danger">*</span></label>
                <div class="password-toggle-wrapper">
                    <input type="password" id="password" placeholder="Minimal 6 karakter">
                    <button type="button" class="btn-toggle-eye" id="togglePerumahanPassword" title="Lihat/Sembunyikan Password">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                <small id="userPasswordHelp" style="font-size: 11.5px; color: var(--dash-text-muted); display: none; margin-top: 4px;">
                    *Biarkan kosong jika tidak ingin mengubah kata sandi lama.
                </small>
            </div>

            <div class="form-group" id="userPasswordConfirmGroup">
                <label for="passwordConfirm">Konfirmasi Password <span class="text-danger">*</span></label>
                <div class="password-toggle-wrapper">
                    <input type="password" id="passwordConfirm" placeholder="Ketik ulang password">
                    <button type="button" class="btn-toggle-eye" id="togglePerumahanPasswordConfirm" title="Lihat/Sembunyikan Password">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
            </div>

            <div class="form-group">
                <label for="roleSelect">Role Pengguna</label>
                <div class="role-select">
                    <select id="roleSelect" class="custom-select-field">
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
                    style="display: none; margin-top: 8px;"
                >
            </div>

            <div class="form-group">
                <label for="userDeviceSelect">
                    <i class="fa-solid fa-microchip"></i> Perangkat IoT
                </label>
                <div class="custom-select-wrapper">
                    <select class="custom-select-field" id="userDeviceSelect">
                        <option value="">-- Pilih Perangkat --</option>
                    </select>
                    <i class="fa-solid fa-chevron-down select-arrow"></i>
                </div>
                <small style="font-size: 11.5px; color: var(--dash-text-muted);">
                    Pilih perangkat IoT yang ditugaskan ke pengguna ini
                </small>
            </div>

            <div class="form-group">
                <label for="userZonaInput">
                    <i class="fa-solid fa-location-dot"></i> Zona
                </label>
                <input 
                    type="text" 
                    id="userZonaInput" 
                    placeholder="Zona akan terisi otomatis saat perangkat dipilih"
                    readonly
                    style="background: var(--dash-bg); cursor: default;"
                />
            </div>
        </div>

        <div class="modal-footer">
            <button type="button" class="btn btn-cancel" id="cancelBtn">Batal</button>
            <button type="button" class="btn btn-save" id="saveUserBtn">
                <i class="fa-solid fa-floppy-disk"></i>
                <span id="saveBtnText">Simpan Pengguna</span>
            </button>
        </div>
    </div>
</div>

{{-- =========================================================
     6. MODAL DETAIL PENGGUNA PERUMAHAN
========================================================== --}}
<div id="detailUserModal" class="modal" style="display: none;">
    <div class="modal-content modal-detail-content">
        <div class="modal-header">
            <h3>
                <i class="fa-solid fa-id-card" style="margin-right: 8px;"></i>
                <span>Detail Pengguna Perumahan</span>
            </h3>
            <button type="button" class="close-modal" id="closeDetailModal">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="modal-body" id="detailUserModalBody">
            {{-- Render detail oleh users.js --}}
        </div>

        <div class="modal-footer">
            <button type="button" class="btn btn-cancel" id="closeDetailBtn">Tutup</button>
        </div>
    </div>
</div>

@endsection

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<script type="module" src="{{ asset('js/users.js') }}"></script>
@endpush