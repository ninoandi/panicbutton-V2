@extends('layouts.app')

@section('title', 'Profil Petugas - Panic Button')

@section('page-title', 'Profil Petugas')

@push('styles')
<!-- Cropper.js CSS -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css">
<!-- Flatpickr CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<link rel="stylesheet" href="{{ asset('css/petugas/profile.css') }}">
@endpush

@section('content')
<div class="petugas-profile-page">

    {{-- 1. HEADER PROFILE CARD (AVATAR & IDENTITY) --}}
    <section class="profile-header-card">
        <div class="profile-header-left">
            <div class="avatar-upload-wrapper">
                <div class="profile-avatar-container" id="avatarContainer">
                    <img id="avatarImage" src="" alt="Foto Profil" class="avatar-img" style="display: none;">
                    <div id="avatarFallback" class="avatar-fallback">
                        {{ strtoupper(substr(session('web_user_name', 'P'), 0, 1)) }}
                    </div>
                </div>
                <label for="profilePhotoInput" class="avatar-upload-badge" title="Ganti & Sesuaikan Foto Profil">
                    <i class="fa-solid fa-camera"></i>
                </label>
                <input type="file" id="profilePhotoInput" accept="image/*" style="display: none;">
            </div>

            <div class="profile-header-info">
                <div class="profile-badge-row">
                    <span class="petugas-role-badge {{ session('web_petugas_type') === 'perumahan' ? 'perumahan' : 'public' }}">
                        <i class="fa-solid fa-shield-halved"></i>
                        <span>Petugas {{ session('web_petugas_type') === 'perumahan' ? 'Perumahan' : 'Public' }}</span>
                    </span>
                    <span id="profileStatusBadge" class="profile-completeness-badge badge-warning">
                        <i class="fa-solid fa-circle-notch fa-spin"></i> Memeriksa Kelengkapan...
                    </span>
                </div>
                <h2 id="headerPetugasName">{{ session('web_user_name', 'Petugas Lapangan') }}</h2>
                <p id="headerPetugasEmail"><i class="fa-solid fa-envelope"></i> {{ session('web_user_email', '-') }}</p>
                <p id="headerPetugasPhone"><i class="fa-solid fa-phone"></i> {{ session('web_user_phone', '-') }}</p>
            </div>
        </div>

        <div class="profile-header-right">
            <button type="button" id="toggleEditFormBtn" class="btn-toggle-edit">
                <i class="fa-solid fa-pen-to-square"></i>
                <span>Lengkapi / Edit Profil</span>
            </button>
        </div>
    </section>

    {{-- 2. DISPLAY VIEW (INFORMASI PROFIL LENGKAP) --}}
    <div id="profileDisplayView" class="profile-display-view">

        {{-- Seksi: Informasi Pribadi --}}
        <section class="profile-section-card">
            <div class="section-title-wrapper">
                <div class="section-icon-badge icon-personal">
                    <i class="fa-solid fa-id-card"></i>
                </div>
                <div>
                    <h3>Informasi Pribadi</h3>
                    <p>Informasi identitas resmi petugas dan kontak tanggap darurat</p>
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
                    <span class="data-label"><i class="fa-solid fa-phone"></i> Nomor Telepon / WhatsApp</span>
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

                <div class="data-field-item full-span">
                    <span class="data-label"><i class="fa-solid fa-house-chimney"></i> Alamat Domisili / Posko</span>
                    <strong class="data-value" id="display_address">-</strong>
                </div>
            </div>
        </section>

    </div>

    {{-- 3. EDIT PROFILE FORM SECTION (COLLAPSIBLE / TOGGLE) --}}
    <section id="profileFormSection" class="profile-card profile-form-section" style="display: none;">
        <div class="profile-card-header">
            <div class="card-header-title">
                <i class="fa-solid fa-user-pen"></i>
                <h3>Lengkapi & Perbarui Data Profil</h3>
            </div>
            <button type="button" class="btn-close-form" id="closeFormTopBtn">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <form id="petugasProfileForm" class="profile-form-content">
            
            {{-- Bagian 1: Data Diri --}}
            <div class="form-section-group">
                <h4 class="form-subtitle"><i class="fa-solid fa-id-badge"></i> Data Pribadi</h4>
                
                <div class="form-row-2">
                    <div class="form-group">
                        <label for="input_name">Nama Lengkap <span style="color:#dc2626;">*</span></label>
                        <input 
                            type="text" 
                            id="input_name" 
                            value="{{ session('web_user_name', '') }}"
                            placeholder="Masukkan nama lengkap"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="input_phone">Nomor Telepon / WhatsApp <span style="color:#dc2626;">*</span></label>
                        <input 
                            type="tel" 
                            id="input_phone" 
                            value="{{ session('web_user_phone', '') }}"
                            placeholder="Contoh: 081234567890"
                            required
                        >
                    </div>
                </div>

                <div class="form-row-2">
                    <div class="form-group">
                        <label for="input_birth_date">Tanggal Lahir</label>
                        <input 
                            type="text" 
                            id="input_birth_date" 
                            placeholder="Pilih tanggal lahir"
                        >
                    </div>

                    <div class="form-group">
                        <label for="input_gender">Jenis Kelamin</label>
                        <select id="input_gender" class="custom-select-control">
                            <option value="">-- Pilih Jenis Kelamin --</option>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="input_email">Alamat Email</label>
                    <input 
                        type="email" 
                        id="input_email" 
                        value="{{ session('web_user_email', '') }}"
                        readonly
                        class="input-disabled"
                    >
                    <small class="form-hint">*Email digunakan sebagai kredensial login akun Anda.</small>
                </div>

                <div class="form-group">
                    <label for="input_address">Alamat Domisili / Keterangan Posko</label>
                    <textarea 
                        id="input_address" 
                        rows="2" 
                        class="custom-textarea-control"
                        placeholder="Contoh: Pos Satpam Gerbang Utama Cluster Flamboyan..."
                    ></textarea>
                </div>
            </div>

            {{-- Bagian 2: Kata Sandi --}}
            <div class="form-section-group" style="margin-top: 20px;">
                <h4 class="form-subtitle"><i class="fa-solid fa-lock"></i> Ganti Kata Sandi (Opsional)</h4>
                <p class="form-hint" style="margin-bottom: 12px;">Kosongkan bila Anda tidak bermaksud mengganti kata sandi saat ini.</p>

                <div class="form-row-2">
                    <div class="form-group">
                        <label for="input_new_password">Kata Sandi Baru</label>
                        <div class="password-toggle-wrapper">
                            <input 
                                type="password" 
                                id="input_new_password" 
                                placeholder="Minimal 6 karakter"
                            >
                            <button type="button" class="btn-toggle-eye" id="toggleNewPassBtn" title="Lihat/Sembunyikan">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="input_confirm_password">Konfirmasi Kata Sandi Baru</label>
                        <div class="password-toggle-wrapper">
                            <input 
                                type="password" 
                                id="input_confirm_password" 
                                placeholder="Ketik ulang kata sandi baru"
                            >
                            <button type="button" class="btn-toggle-eye" id="toggleConfirmPassBtn" title="Lihat/Sembunyikan">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {{-- Form Actions --}}
            <div class="form-actions-bar">
                <button type="button" class="btn-cancel-edit" id="cancelFormBtn">Batal</button>
                <button type="button" class="btn-save-profile" id="saveProfileBtn">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Simpan Perubahan</span>
                </button>
            </div>

        </form>
    </section>

</div>

{{-- 4. CROPPER MODAL (FOR PROFILE PICTURE ADJUSTMENT) --}}
<div id="cropperModal" class="modal-petugas-overlay" style="display: none;">
    <div class="modal-petugas-card modal-cropper-card">
        <div class="modal-petugas-header">
            <div class="modal-petugas-title">
                <i class="fa-solid fa-crop-simple"></i>
                <h3>Sesuaikan Foto Profil</h3>
            </div>
            <button type="button" class="btn-close-petugas-modal" id="closeCropperModalBtn">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="modal-petugas-body">
            <div class="cropper-container-wrapper">
                <img id="cropperSourceImage" src="" alt="Source Image">
            </div>

            <div class="cropper-toolbar">
                <button type="button" class="btn-crop-tool" id="cropZoomInBtn" title="Perbesar"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
                <button type="button" class="btn-crop-tool" id="cropZoomOutBtn" title="Perkecil"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
                <button type="button" class="btn-crop-tool" id="cropRotateLeftBtn" title="Putar Kiri"><i class="fa-solid fa-rotate-left"></i></button>
                <button type="button" class="btn-crop-tool" id="cropRotateRightBtn" title="Putar Kanan"><i class="fa-solid fa-rotate-right"></i></button>
                <button type="button" class="btn-crop-tool" id="cropResetBtn" title="Reset"><i class="fa-solid fa-arrows-rotate"></i></button>
            </div>

            <div class="modal-actions-footer">
                <button type="button" class="btn-modal-cancel" id="cancelCropperBtn">Batal</button>
                <button type="button" class="btn-modal-submit" id="applyCropBtn">
                    <i class="fa-solid fa-check"></i>
                    <span>Terapkan Foto</span>
                </button>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<!-- Cropper.js & Flatpickr -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
<script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/id.js"></script>
<script type="module" src="{{ asset('js/petugas/profile.js') }}"></script>
@endpush
