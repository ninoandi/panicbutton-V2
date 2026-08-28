@extends('layouts.app')

@section('title', 'Quick Message - Panic Button')

@section('page-title', 'Quick Message')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/quick-message.css') }}">
@endpush

@section('content')
<div class="quick-message-page">

    {{-- =========================================================
         1. HEADER BANNER
    ========================================================== --}}
    <section class="qm-header-card">
        <div class="qm-header-text">
            <div class="qm-header-badge">
                <span class="pulse-dot-blue"></span>
                <span>Template Pesan Darurat Terpusat</span>
            </div>
            <h1>Kelola Quick Message</h1>
            <p>Atur daftar template pesan singkat darurat yang dapat dipilih secara instan oleh warga saat menekan tombol Panic Button.</p>
        </div>

        <button type="button" class="btn-add-message" id="openAddModalBtn">
            <span>Tambah Pesan Baru</span>
        </button>
    </section>

    {{-- =========================================================
         2. SEARCH FILTER BAR
    ========================================================== --}}
    <section class="qm-filter-card">
        <div class="search-input-wrapper">
            <i class="fa-solid fa-search"></i>
            <input
                type="text"
                id="searchMsgInput"
                class="search-input-field"
                placeholder="Cari kata kunci pesan quick message..."
            >
        </div>
    </section>

    {{-- =========================================================
         3. MODERN REALTIME TABLE CARD
    ========================================================== --}}
    <section class="qm-table-card">
        <div class="qm-table-header">
            <div class="qm-table-header-title">
                <div class="qm-table-header-icon">
                    <i class="fa-solid fa-list-check"></i>
                </div>
                <div>
                    <h2>Daftar Pesan Quick Message</h2>
                    <p>Template pesan darurat yang langsung tersedia di aplikasi warga</p>
                </div>
            </div>

            <div class="connection-badge">
                <span class="connection-dot"></span>
                <span id="tableSyncStatus">Realtime Database</span>
            </div>
        </div>

        <div class="qm-table-wrapper">
            <table class="qm-table">
                <thead>
                    <tr>
                        <th style="width: 70px;">No</th>
                        <th>Template Pesan Darurat</th>
                        <th style="width: 140px;">Panjang</th>
                        <th style="width: 170px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="msgsTbody">
                    <tr>
                        <td colspan="4" class="qm-loading">
                            <i class="fa-solid fa-circle-notch fa-spin"></i> Memuat data quick messages...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

</div>

{{-- =========================================================
     4. MODAL TAMBAH / EDIT QUICK MESSAGE (GLASSMORPHISM)
========================================================== --}}
<div id="qmModal" class="qm-modal-overlay">
    <div class="qm-modal">
        <div class="qm-modal-header">
            <h3 id="qmModalTitle">
                <i class="fa-solid fa-comment-medical"></i>
                <span>Tambah Pesan Baru</span>
            </h3>
            <button type="button" class="qm-close-btn" id="closeQmModal" title="Tutup Modal">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="qm-modal-body">
            <input type="hidden" id="qmEditKey" value="">

            <div class="qm-form-group">
                <label for="qmMessageInput">Template Pesan Singkat Darurat</label>
                <input
                    type="text"
                    id="qmMessageInput"
                    class="qm-input-field"
                    placeholder="Contoh: Ada Maling / Butuh Ambulans / Kebakaran / Pohon Tumbang"
                    maxlength="60"
                >

                <div class="qm-hint-box">
                    <i class="fa-solid fa-circle-info"></i>
                    <span>Tuliskan pesan yang <strong>singkat, padat, dan langsung to the point</strong> (contoh: <em>Kebakaran</em>, <em>Ada Maling</em>, <em>Butuh Ambulans</em>) agar cepat dipahami warga saat kondisi darurat.</span>
                </div>
            </div>
        </div>

        <div class="qm-modal-footer">
            <button type="button" class="btn-qm btn-qm-cancel" id="btnCancelQm">Batal</button>
            <button type="button" class="btn-qm btn-qm-save" id="btnSaveQm">
                <i class="fa-solid fa-floppy-disk"></i>
                <span>Simpan Pesan</span>
            </button>
        </div>
    </div>
</div>

@endsection

@push('scripts')
<script type="module" src="{{ asset('js/quick-message.js') }}"></script>
@endpush
