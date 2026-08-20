@extends('layouts.app')

@section('title', 'Manajemen Admin - Panic Button')

@section('page-title', 'Manajemen Admin')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/manajemen-admin.css') }}">
@endpush

@section('content')
<div class="manajemen-admin-page">

    {{-- =========================================================
         1. HEADER BANNER (TANPA CARD INFO KETERANGAN)
    ========================================================== --}}
    <section class="admin-header-card">
        <div class="admin-header-text">
            <div class="admin-header-badge">
                <span class="pulse-dot-indigo"></span>
                <span>Hak Akses & Pengelola Sistem</span>
            </div>
            <h1>Manajemen Administrator</h1>
            <p>Kelola daftar akun, nomor kontak, dan hak akses administrator pengelola sistem Panic Button.</p>
        </div>

        <button type="button" id="openAddAdminModal" class="btn-add-admin">
            <i class="fa-solid fa-user-plus"></i>
            <span>Tambah Admin</span>
        </button>
    </section>

    {{-- =========================================================
         2. SEARCH FILTER BAR
    ========================================================== --}}
    <section class="admin-filter-card">
        <div class="search-container">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input
                type="text"
                id="searchInput"
                class="search-input"
                placeholder="Cari berdasarkan nama, nomor telepon, email..."
                autocomplete="off"
            >
        </div>
    </section>

    {{-- =========================================================
         3. MODERN REALTIME TABLE CARD
    ========================================================== --}}
    <section class="admin-table-card">
        <div class="admin-table-header">
            <div class="admin-table-header-title">
                <div class="admin-table-header-icon">
                    <i class="fa-solid fa-user-shield"></i>
                </div>
                <div>
                    <h2>Daftar Administrator Sistem</h2>
                    <p>Informasi identitas dan nomor kontak administrator aktif</p>
                </div>
            </div>

            <div class="connection-badge">
                <span class="connection-dot"></span>
                <span id="syncStatus">Realtime Data</span>
            </div>
        </div>

        <div class="table-wrapper">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th style="width: 60px; text-align: center;">No</th>
                        <th>Nama</th>
                        <th style="width: 200px; text-align: center;">Nomor Telepon</th>
                        <th style="width: 230px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="adminTableBody">
                    <tr class="loading-row">
                        <td colspan="4">
                            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 24px; margin-bottom: 8px; display: block; color: var(--dash-primary);"></i>
                            <span>Memuat data administrator...</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    {{-- Mobile Card Container --}}
    <div class="admin-mobile-cards" id="mobileCardsContainer"></div>

    {{-- =========================================================
         4. PAGINATION
    ========================================================== --}}
    <div class="pagination">
        <div class="pagination-info" id="paginationInfo">
            Menampilkan 0 - 0 dari 0 data
        </div>

        <div class="pagination-controls">
            <button type="button" id="prevBtn" class="btn-pagination" disabled>
                <i class="fa-solid fa-chevron-left"></i>
                <span>Sebelumnya</span>
            </button>

            <button type="button" id="nextBtn" class="btn-pagination" disabled>
                <span>Berikutnya</span>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    </div>

</div>

{{-- =========================================================
     5. MODAL FORM TAMBAH / EDIT ADMIN
========================================================== --}}
<div id="adminFormModal" class="modal-overlay">
    <div class="modal-container">
        <div class="modal-header">
            <div class="modal-header-text">
                <span class="modal-badge">
                    <i class="fa-solid fa-user-shield"></i> Akun Administrator
                </span>
                <h3 id="formModalTitle">Tambah Administrator Baru</h3>
            </div>
            <button type="button" class="modal-close-btn" id="closeFormModal" title="Tutup Modal">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="modal-body">
            <input type="hidden" id="adminId">

            <div class="modal-form-group">
                <label for="adminName">Nama Lengkap <span style="color: var(--dash-emergency);">*</span></label>
                <input
                    type="text"
                    id="adminName"
                    class="modal-form-input"
                    placeholder="Contoh: Budi Prasetyo"
                    required
                >
            </div>

            <div class="modal-form-group">
                <label for="adminPhone">Nomor Telepon / WhatsApp <span style="color: var(--dash-emergency);">*</span></label>
                <input
                    type="tel"
                    id="adminPhone"
                    class="modal-form-input"
                    placeholder="Contoh: 081234567890"
                    required
                >
            </div>

            <div class="modal-form-group">
                <label for="adminEmail">Alamat Email (Opsional)</label>
                <input
                    type="email"
                    id="adminEmail"
                    class="modal-form-input"
                    placeholder="Contoh: admin@panicbutton.id"
                >
            </div>

            <div class="modal-form-group" id="passwordGroup">
                <label for="adminPassword">Kata Sandi <span id="passwordRequired" style="color: var(--dash-emergency);">*</span></label>
                <input
                    type="password"
                    id="adminPassword"
                    class="modal-form-input"
                    placeholder="Minimal 6 karakter"
                >
                <small id="passwordHelp" style="font-size: 11.5px; color: var(--dash-text-muted); display: none;">
                    *Biarkan kosong jika tidak ingin mengubah kata sandi lama.
                </small>
            </div>
        </div>

        <div class="modal-footer">
            <button type="button" class="btn-modal-cancel" id="cancelFormBtn">
                Batal
            </button>
            <button type="button" class="btn-modal-save" id="saveAdminBtn">
                <i class="fa-solid fa-check"></i>
                <span>Simpan</span>
            </button>
        </div>
    </div>
</div>

{{-- =========================================================
     6. MODAL DETAIL ADMIN
========================================================== --}}
<div id="adminDetailModal" class="modal-overlay">
    <div class="modal-container">
        <div class="modal-header">
            <div class="modal-header-text">
                <span class="modal-badge">
                    <i class="fa-solid fa-id-badge"></i> Profil Administrator
                </span>
                <h3>Rincian Identitas Admin</h3>
            </div>
            <button type="button" class="modal-close-btn" id="closeDetailModal" title="Tutup Modal">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="modal-body">
            <div class="modal-meta-grid">
                <div class="modal-meta-item full-width">
                    <span class="meta-label">Nama Lengkap</span>
                    <strong class="meta-value" id="detailName">-</strong>
                </div>

                <div class="modal-meta-item">
                    <span class="meta-label">Nomor Telepon</span>
                    <strong class="meta-value" id="detailPhone">-</strong>
                </div>

                <div class="modal-meta-item">
                    <span class="meta-label">Alamat Email</span>
                    <strong class="meta-value" id="detailEmail">-</strong>
                </div>

                <div class="modal-meta-item">
                    <span class="meta-label">Peran Akun</span>
                    <strong class="meta-value" id="detailRole">Administrator Sistem</strong>
                </div>

                <div class="modal-meta-item">
                    <span class="meta-label">Tanggal Terdaftar</span>
                    <strong class="meta-value" id="detailRegistered">-</strong>
                </div>

                <div class="modal-meta-item full-width">
                    <span class="meta-label">Domisili / Alamat</span>
                    <strong class="meta-value" id="detailFullAddress">-</strong>
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <button type="button" class="btn-modal-cancel" id="closeDetailBtn">
                Tutup
            </button>
        </div>
    </div>
</div>

@endsection

@push('scripts')
<script type="module" src="{{ asset('js/manajemen-admin.js') }}"></script>
@endpush
