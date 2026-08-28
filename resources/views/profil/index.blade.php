@extends('layouts.app')

@section('title', 'Profil Administrator - Panic Button')

@section('page-title', 'Profil Administrator')

@push('styles')
<!-- Cropper.js CSS -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css">
<!-- Flatpickr CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<link rel="stylesheet" href="{{ asset('css/profil.css') }}">
@endpush

@section('content')
<div class="profile-page">

    {{-- =========================================================
         1. HEADER PROFILE CARD
    ========================================================== --}}
    <section class="profile-header-card">
        <div class="profile-header-left">
            <div class="avatar-upload-wrapper">
                <div class="profile-avatar-container" id="avatarContainer">
                    <img id="avatarImage" src="" alt="Foto Profil" class="avatar-img" style="display: none;">
                    <div id="avatarFallback" class="avatar-fallback">
                        {{ strtoupper(substr(session('web_user_name', 'A'), 0, 1)) }}
                    </div>
                    <label for="profilePhotoInput" class="avatar-upload-badge" title="Ganti & Sesuaikan Foto Profil">
                        <i class="fa-solid fa-camera"></i>
                    </label>
                </div>
                <input type="file" id="profilePhotoInput" accept="image/*" style="display: none;">
            </div>

            <div class="profile-header-info">
                <div class="profile-badge-row">
                    <span class="admin-role-badge">
                    Administrator
                    </span>
                </div>
                <h2 id="headerUserName">{{ session('web_user_name', 'Administrator') }}</h2>
                <p id="headerUserEmail"><i class="fa-solid fa-envelope"></i> {{ session('web_user_email', '-') }}</p>
                <p id="headerUserPhone"><i class="fa-solid fa-phone"></i> {{ session('web_user_phone', '-') }}</p>
            </div>
        </div>

        <div class="profile-header-right">
            <button type="button" id="toggleEditFormBtn" class="btn-toggle-edit">
                <span>Lengkapi / Edit Profil</span>
            </button>
        </div>
    </section>

    {{-- =========================================================
         2. TAMPILAN DATA PROFIL (DISPLAY VIEW)
    ========================================================== --}}
    <div id="profileDisplayView" class="profile-display-view">

        {{-- SEKSI 1: INFORMASI PRIBADI --}}
        <section class="profile-section-card">
            <div class="section-title-wrapper">
                <div class="section-icon-badge icon-personal">
                    <i class="fa-solid fa-id-card"></i>
                </div>
                <div>
                    <h3>Informasi Pribadi</h3>
                    <p>Identitas diri dan kontak dasar administrator</p>
                </div>
            </div>

            <div class="profile-data-grid">
                <div class="data-field-item">
                    <span class="data-label"><i class="fa-solid fa-user"></i> Nama Lengkap</span>
                    <strong class="data-value" id="display_name">{{ session('web_user_name', '-') }}</strong>
                </div>

                <div class="data-field-item">
                    <span class="data-label"><i class="fa-solid fa-envelope"></i> Alamat Email</span>
                    <strong class="data-value" id="display_email">{{ session('web_user_email', '-') }}</strong>
                </div>

                <div class="data-field-item">
                    <span class="data-label"><i class="fa-solid fa-phone"></i> Nomor Telepon</span>
                    <strong class="data-value" id="display_phone">{{ session('web_user_phone', '-') }}</strong>
                </div>

                <div class="data-field-item">
                    <span class="data-label"><i class="fa-solid fa-calendar-days"></i> Tanggal Lahir</span>
                    <strong class="data-value" id="display_birth_date">-</strong>
                </div>

                <div class="data-field-item">
                    <span class="data-label"><i class="fa-solid fa-venus-mars"></i> Jenis Kelamin</span>
                    <strong class="data-value" id="display_gender">-</strong>
                </div>
            </div>
        </section>

        {{-- SEKSI 2: INFORMASI ALAMAT --}}
        <section class="profile-section-card">
            <div class="section-title-wrapper">
                <div class="section-icon-badge icon-address">
                    <i class="fa-solid fa-map-location-dot"></i>
                </div>
                <div>
                    <h3>Informasi Alamat & Domisili</h3>
                    <p>Lokasi tempat tinggal dan wilayah operasional administrator</p>
                </div>
            </div>

            <div class="profile-data-grid">
                <div class="data-field-item">
                    <span class="data-label"><i class="fa-solid fa-earth-asia"></i> Provinsi</span>
                    <strong class="data-value" id="display_province">-</strong>
                </div>

                <div class="data-field-item">
                    <span class="data-label"><i class="fa-solid fa-city"></i> Kota / Kabupaten</span>
                    <strong class="data-value" id="display_city">-</strong>
                </div>

                <div class="data-field-item">
                    <span class="data-label"><i class="fa-solid fa-building"></i> Kecamatan</span>
                    <strong class="data-value" id="display_district">-</strong>
                </div>

                <div class="data-field-item">
                    <span class="data-label"><i class="fa-solid fa-house-chimney"></i> Kelurahan / Desa</span>
                    <strong class="data-value" id="display_subdistrict">-</strong>
                </div>

                <div class="data-field-item field-span-2">
                    <span class="data-label"><i class="fa-solid fa-road"></i> Alamat Lengkap</span>
                    <strong class="data-value" id="display_full_address">-</strong>
                </div>

                <div class="data-field-item">
                    <span class="data-label"><i class="fa-solid fa-envelopes-bulk"></i> Kode Pos</span>
                    <strong class="data-value" id="display_postal_code">-</strong>
                </div>
            </div>
        </section>

    </div>

    {{-- =========================================================
         3. FORM EDIT PROFIL (COLLAPSIBLE EDIT FORM)
    ========================================================== --}}
    <section id="profileFormSection" class="profile-form-section" style="display: none;">
        <div class="form-section-header">
            <div class="form-header-title">
                <div class="section-icon-badge icon-edit">
                    <i class="fa-solid fa-user-pen"></i>
                </div>
                <div>
                    <h3>Perbarui Profil Administrator</h3>
                    <p>Lengkapi dan sesuaikan data diri akun Anda</p>
                </div>
            </div>
            <button type="button" id="closeFormTopBtn" class="btn-close-form" title="Tutup Form">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        {{-- SUBSECTION 1: DATA PRIBADI --}}
        <div class="form-subsection">
            <h4 class="subsection-heading">
                <i class="fa-solid fa-id-badge"></i> Data Pribadi
            </h4>

            <div class="form-grid-2">
                <div class="form-field-group">
                    <label for="input_name">Nama Lengkap <span style="color: var(--dash-emergency);">*</span></label>
                    <input type="text" id="input_name" class="form-input-text" placeholder="Nama Lengkap" required>
                </div>

                <div class="form-field-group">
                    <label for="input_phone">Nomor Telepon / WhatsApp <span style="color: var(--dash-emergency);">*</span></label>
                    <input type="tel" id="input_phone" class="form-input-text" placeholder="0812xxxxxxxx" required>
                </div>
            </div>

            <div class="form-grid-3">
                <div class="form-field-group">
                    <label for="input_email">Alamat Email</label>
                    <input type="email" id="input_email" class="form-input-text" placeholder="email@contoh.com">
                </div>

                <div class="form-field-group">
                    <label for="input_birth_date">Tanggal Lahir</label>
                    <input type="text" id="input_birth_date" class="form-input-text" placeholder="Pilih Tanggal Lahir">
                </div>

                <div class="form-field-group">
                    <label for="input_gender">Jenis Kelamin</label>
                    <select id="input_gender" class="form-select">
                        <option value="">Pilih Jenis Kelamin</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                    </select>
                </div>
            </div>
        </div>

        {{-- SUBSECTION 2: INFORMASI ALAMAT --}}
        <div class="form-subsection">
            <h4 class="subsection-heading">
                <i class="fa-solid fa-location-dot"></i> Informasi Alamat & Domisili
            </h4>

            <div class="form-grid-2">
                <div class="form-field-group">
                    <label for="input_province">Provinsi</label>
                    <input type="text" id="input_province" class="form-input-text" placeholder="Contoh: D.I. Yogyakarta">
                </div>

                <div class="form-field-group">
                    <label for="input_city">Kota / Kabupaten</label>
                    <input type="text" id="input_city" class="form-input-text" placeholder="Contoh: Sleman">
                </div>
            </div>

            <div class="form-grid-3">
                <div class="form-field-group">
                    <label for="input_district">Kecamatan</label>
                    <input type="text" id="input_district" class="form-input-text" placeholder="Contoh: Depok">
                </div>

                <div class="form-field-group">
                    <label for="input_subdistrict">Kelurahan / Desa</label>
                    <input type="text" id="input_subdistrict" class="form-input-text" placeholder="Contoh: Caturtunggal">
                </div>

                <div class="form-field-group">
                    <label for="input_postal_code">Kode Pos</label>
                    <input type="text" id="input_postal_code" class="form-input-text" placeholder="Contoh: 55281">
                </div>
            </div>

            <div class="form-field-group full-width">
                <label for="input_full_address">Alamat Lengkap</label>
                <textarea id="input_full_address" class="form-textarea" placeholder="Jalan, Nomor Bangunan, RT/RW..."></textarea>
            </div>
        </div>

        <div class="form-actions-bar">
            <button type="button" id="cancelFormBtn" class="btn-form-cancel">
                Batal
            </button>
            <button type="button" id="saveProfileBtn" class="btn-form-save">
                <i class="fa-solid fa-floppy-disk"></i>
                <span>Simpan Perubahan</span>
            </button>
        </div>
    </section>

</div>

{{-- =========================================================
     4. CROPPER MODAL (SESUAIKAN FOTO PROFIL)
========================================================== --}}
<div id="cropperModal" class="cropper-modal-overlay">
    <div class="cropper-modal-container">
        <div class="cropper-modal-header">
            <h4>Sesuaikan Foto Profil</h4>
            <button type="button" id="closeCropperModalBtn" class="btn-close-form" title="Tutup">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="cropper-image-wrapper">
            <img id="cropperSourceImage" src="" alt="Foto Asli">
        </div>

        <div class="cropper-controls">
            <button type="button" id="cropZoomInBtn" class="btn-cropper-tool" title="Perbesar">
                <i class="fa-solid fa-magnifying-glass-plus"></i>
            </button>
            <button type="button" id="cropZoomOutBtn" class="btn-cropper-tool" title="Perkecil">
                <i class="fa-solid fa-magnifying-glass-minus"></i>
            </button>
            <button type="button" id="cropRotateLeftBtn" class="btn-cropper-tool" title="Putar Kiri">
                <i class="fa-solid fa-rotate-left"></i>
            </button>
            <button type="button" id="cropRotateRightBtn" class="btn-cropper-tool" title="Putar Kanan">
                <i class="fa-solid fa-rotate-right"></i>
            </button>
            <button type="button" id="cropResetBtn" class="btn-cropper-tool" title="Reset">
                <i class="fa-solid fa-arrows-rotate"></i>
            </button>
        </div>

        <div class="cropper-modal-footer">
            <button type="button" id="cancelCropperBtn" class="btn-form-cancel">
                Batal
            </button>
            <button type="button" id="applyCropBtn" class="btn-form-save">
                <i class="fa-solid fa-check"></i>
                <span>Terapkan Foto</span>
            </button>
        </div>
    </div>
</div>

@endsection

@push('scripts')
<!-- Cropper.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js"></script>
<!-- Flatpickr JS -->
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
<script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/id.js"></script>
<!-- Controller JS -->
<script type="module" src="{{ asset('js/profil.js') }}"></script>
@endpush
