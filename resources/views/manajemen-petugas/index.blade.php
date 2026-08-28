@extends('layouts.app')

@section('title', 'Manajemen Petugas - Panic Button')

@section('page-title', 'Manajemen Petugas')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/manajemen-petugas.css') }}">
@endpush

@section('content')
<div class="manajemen-petugas-page">

    {{-- =========================================================
         1. HEADER BANNER
    ========================================================== --}}
    <section class="petugas-header-card">
        <div class="petugas-header-text">
            <div class="petugas-header-badge">
                <span class="pulse-dot-emerald"></span>
                <span>Respon Cepat & Tanggap Darurat</span>
            </div>
            <h1>Manajemen Petugas</h1>
            <p>Kelola data identitas, kontak respon cepat, dan hak akses petugas lapangan tanggap darurat.</p>
        </div>

        <button type="button" id="openAddPetugasModal" class="btn-add-petugas">
            <span>Tambah Petugas</span>
        </button>
    </section>

    {{-- =========================================================
         2. SEARCH FILTER BAR
    ========================================================== --}}
    <section class="petugas-filter-card">
        <div class="search-container">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input
                type="text"
                id="searchInput"
                class="search-input"
                placeholder="Cari berdasarkan nama, nomor telepon, email, status, atau perumahan..."
                autocomplete="off"
            >
        </div>
    </section>

    {{-- =========================================================
         3. MODERN REALTIME TABLE CARD
    ========================================================== --}}
    <section class="petugas-table-card">
        <div class="petugas-table-header">
            <div class="petugas-table-header-title">
                <div class="petugas-table-header-icon">
                    <i class="fa-solid fa-user-nurse"></i>
                </div>
                <div>
                    <h2>Daftar Petugas Lapangan</h2>
                    <p>Informasi identitas dan nomor kontak aktif seluruh petugas tanggap darurat</p>
                </div>
            </div>

            <div class="connection-badge">
                <span class="connection-dot"></span>
                <span id="syncStatus">Realtime Data</span>
            </div>
        </div>

        <div class="table-wrapper">
            <table class="petugas-table">
                <thead>
                    <tr>
                        <th style="width: 60px; text-align: center;">No</th>
                        <th>Nama</th>
                        <th style="width: 180px; text-align: center;">Nomor Telepon</th>
                        <th>Email</th>
                        <th style="width: 140px; text-align: center;">Status</th>
                        <th style="width: 230px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="petugasTableBody">
                    <tr class="loading-row">
                        <td colspan="6">
                            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 24px; margin-bottom: 8px; display: block; color: var(--dash-primary);"></i>
                            <span>Memuat data petugas dari seluruh database...</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    {{-- Mobile Card Container --}}
    <div class="petugas-mobile-cards" id="mobileCardsContainer"></div>

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
     5. MODAL FORM TAMBAH / EDIT PETUGAS
========================================================== --}}
<div id="petugasFormModal" class="modal-overlay">
    <div class="modal-container">
        <div class="modal-header">
            <div class="modal-header-text">
                <span class="modal-badge">
                    <i class="fa-solid fa-user-nurse"></i> Akun Petugas
                </span>
                <h3 id="formModalTitle">Tambah Petugas Baru</h3>
            </div>
            <button type="button" class="modal-close-btn" id="closeFormModal" title="Tutup Modal">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="modal-body">
            <input type="hidden" id="petugasId">
            <input type="hidden" id="petugasSource" value="public">
            <input type="hidden" id="petugasPerumahanKey">

            {{-- 1. Pilihan Kategori / Status Petugas --}}
            <div class="modal-form-group" id="petugasTypeGroup">
                <label for="petugasTypeSelect">Pilih Kategori Petugas <span style="color: var(--dash-emergency);">*</span></label>
                <select id="petugasTypeSelect" class="modal-form-input">
                    <option value="">-- Pilih Kategori Petugas --</option>
                    <option value="public">Petugas Public</option>
                    <option value="perumahan">Petugas Perumahan</option>
                </select>
                <small style="font-size: 11.5px; color: var(--dash-text-muted);">
                    Pilih kategori terlebih dahulu untuk memunculkan kolom form yang sesuai.
                </small>
            </div>

            {{-- Dynamic Fields Container (Tampil setelah memilih opsi) --}}
            <div id="dynamicFieldsContainer" style="display: none; flex-direction: column; gap: 16px;">
                
                {{-- Field Khusus Perumahan --}}
                <div class="modal-form-group" id="perumahanSelectGroup" style="display: none;">
                    <label for="petugasPerumahanSelect">Pilih Perumahan <span style="color: var(--dash-emergency);">*</span></label>
                    <select id="petugasPerumahanSelect" class="modal-form-input">
                        <option value="">-- Pilih Kawasan Perumahan --</option>
                    </select>
                </div>

                <div class="modal-form-group" id="poskoNumberGroup" style="display: none;">
                    <label for="petugasPoskoNumber">Nomor Posko / Pos Jaga</label>
                    <input
                        type="text"
                        id="petugasPoskoNumber"
                        class="modal-form-input"
                        placeholder="Contoh: Posko Keamanan Utama"
                    >
                </div>

                {{-- Fields Umum --}}
                <div class="modal-form-group">
                    <label for="petugasName">Nama Lengkap <span style="color: var(--dash-emergency);">*</span></label>
                    <input
                        type="text"
                        id="petugasName"
                        class="modal-form-input"
                        placeholder="Contoh: Budi Santoso"
                        required
                    >
                </div>

                <div class="modal-form-group">
                    <label for="petugasPhone">Nomor Telepon / WhatsApp <span style="color: var(--dash-emergency);">*</span></label>
                    <input
                        type="tel"
                        id="petugasPhone"
                        class="modal-form-input"
                        placeholder="Contoh: 081234567890"
                        required
                    >
                </div>

                <div class="modal-form-group" id="emailGroup">
                    <label for="petugasEmail">Alamat Email <span style="color: var(--dash-emergency);">*</span></label>
                    <input
                        type="email"
                        id="petugasEmail"
                        class="modal-form-input"
                        placeholder="Contoh: petugas@panicbutton.id"
                        required
                    >
                </div>

                <div class="modal-form-group" id="passwordGroup">
                    <label for="petugasPassword">Kata Sandi <span id="passwordRequired" style="color: var(--dash-emergency);">*</span></label>
                    <div class="password-toggle-wrapper">
                        <input
                            type="password"
                            id="petugasPassword"
                            class="modal-form-input"
                            placeholder="Minimal 6 karakter"
                        >
                        <button type="button" class="btn-toggle-eye" id="togglePetugasPassword" title="Lihat/Sembunyikan Password">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <small id="passwordHelp" style="font-size: 11.5px; color: var(--dash-text-muted); display: none;">
                        *Biarkan kosong jika tidak ingin mengubah kata sandi lama.
                    </small>
                </div>

                <div class="modal-form-group" id="passwordConfirmGroup">
                    <label for="petugasPasswordConfirm">Konfirmasi Kata Sandi <span id="passwordConfirmRequired" style="color: var(--dash-emergency);">*</span></label>
                    <div class="password-toggle-wrapper">
                        <input
                            type="password"
                            id="petugasPasswordConfirm"
                            class="modal-form-input"
                            placeholder="Ketik ulang kata sandi"
                        >
                        <button type="button" class="btn-toggle-eye" id="togglePetugasPasswordConfirm" title="Lihat/Sembunyikan Password">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>

            </div>
        </div>

        <div class="modal-footer">
            <button type="button" class="btn-modal-cancel" id="cancelFormBtn">
                Batal
            </button>
            <button type="button" class="btn-modal-save" id="savePetugasBtn">
                <i class="fa-solid fa-check"></i>
                <span>Simpan</span>
            </button>
        </div>
    </div>
</div>

{{-- =========================================================
     6. MODAL DETAIL PETUGAS
========================================================== --}}
<div id="petugasDetailModal" class="modal-overlay">
    <div class="modal-container">
        <div class="modal-header">
            <div class="modal-header-text">
                <span class="modal-badge">
                    <i class="fa-solid fa-id-badge"></i> Profil Petugas
                </span>
                <h3>Rincian Identitas Petugas</h3>
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
                    <span class="meta-label">Status Kategori</span>
                    <strong class="meta-value" id="detailStatus">-</strong>
                </div>

                <div class="modal-meta-item" id="detailPerumahanWrapper" style="display: none;">
                    <span class="meta-label">Kawasan Perumahan</span>
                    <strong class="meta-value" id="detailPerumahan">-</strong>
                </div>

                <div class="modal-meta-item" id="detailEmailWrapper">
                    <span class="meta-label">Alamat Email</span>
                    <strong class="meta-value" id="detailEmail">-</strong>
                </div>

                <div class="modal-meta-item">
                    <span class="meta-label">Peran Akun</span>
                    <strong class="meta-value" id="detailRole">Petugas Lapangan</strong>
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
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script type="module" src="{{ asset('js/manajemen-petugas.js') }}"></script>
@endpush
