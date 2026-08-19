@extends('layouts.user')

@section('title', 'Profil Pengguna - Panic Button')

@section('page-title', 'Profil Pengguna')

@push('styles')
<!-- Cropper.js CSS -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css">
<!-- Flatpickr CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<link rel="stylesheet" href="{{ asset('css/users/profil.css') }}">
@endpush

@section('content')
<div class="profile-page">

    {{-- 1. HEADER CARD (AVATAR, BASIC INFO, & EDIT TOGGLE) --}}
    <section class="profile-header-card">
        <div class="profile-header-left">
            <div class="avatar-upload-wrapper">
                <div class="profile-avatar-container" id="avatarContainer">
                    <img id="avatarImage" src="" alt="Foto Profil" class="avatar-img" style="display: none;">
                    <div id="avatarFallback" class="avatar-fallback">
                        {{ strtoupper(substr(session('web_user_name', 'U'), 0, 1)) }}
                    </div>
                    <label for="profilePhotoInput" class="avatar-upload-badge" title="Ganti & Sesuaikan Foto dari Galeri">
                        <i class="fa-solid fa-camera"></i>
                    </label>
                </div>
                <input type="file" id="profilePhotoInput" accept="image/*" style="display: none;">
            </div>

            <div class="profile-header-info">
                <div class="profile-badge-row">
                    <span class="user-role-badge">User Publik</span>
                    <span id="profileStatusBadge" class="profile-completeness-badge badge-warning">
                        <i class="fa-solid fa-circle-notch"></i> Memeriksa Kelengkapan...
                    </span>
                </div>
                <h2 id="headerUserName">{{ session('web_user_name', '-') }}</h2>
                <p id="headerUserEmail"><i class="fa-solid fa-envelope"></i> {{ session('web_user_email', '-') }}</p>
                <p id="headerUserPhone"><i class="fa-solid fa-phone"></i> {{ session('web_user_phone', '-') }}</p>
            </div>
        </div>

        <div class="profile-header-right">
            <button type="button" id="toggleEditFormBtn" class="btn-toggle-edit">
                <i class="fa-solid fa-pen-to-square"></i>
                <span>Lengkapi / Edit Profil</span>
            </button>
        </div>
    </section>

    {{-- 2. TAMPILAN DATA PROFIL LENGKAP (DISPLAY VIEW) --}}
    <div id="profileDisplayView" class="profile-display-view">

        {{-- SEKSI 1: INFORMASI PRIBADI TAMBAHAN --}}
        <section class="profile-section-card">
            <div class="section-title-wrapper">
                <div class="section-icon-badge icon-personal">
                    <i class="fa-solid fa-id-card"></i>
                </div>
                <div>
                    <h3>1. Informasi Pribadi</h3>
                    <p>Identitas diri dan kontak dasar pengguna</p>
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

        {{-- SEKSI 2: ALAMAT LENGKAP --}}
        <section class="profile-section-card">
            <div class="section-title-wrapper">
                <div class="section-icon-badge icon-address">
                    <i class="fa-solid fa-map-location-dot"></i>
                </div>
                <div>
                    <h3>2. Informasi Alamat</h3>
                    <p>Domisili tempat tinggal untuk verifikasi respon darurat</p>
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

        {{-- SEKSI 3: KONTAK DARURAT (2 KONTAK) --}}
        <section class="profile-section-card">
            <div class="section-title-wrapper">
                <div class="section-icon-badge icon-emergency">
                    <i class="fa-solid fa-phone-volume"></i>
                </div>
                <div>
                    <h3>3. Kontak Darurat (Emergency Contacts)</h3>
                    <p>Pihak keluarga atau kerabat yang segera dihubungi saat situasi genting</p>
                </div>
            </div>

            <div class="emergency-contacts-grid">
                {{-- Kontak 1 --}}
                <div class="emergency-subcard">
                    <div class="emergency-subcard-header">
                        <span class="emergency-badge primary-contact">
                            <i class="fa-solid fa-star"></i> Kontak Darurat 1 (Utama)
                        </span>
                    </div>
                    <div class="emergency-subcard-body">
                        <div class="data-field-item">
                            <span class="data-label">Nama Kontak</span>
                            <strong class="data-value" id="display_emergency_name_1">-</strong>
                        </div>
                        <div class="data-field-item">
                            <span class="data-label">Hubungan / Relasi</span>
                            <strong class="data-value" id="display_emergency_relation_1">-</strong>
                        </div>
                        <div class="data-field-item">
                            <span class="data-label">Nomor Telepon</span>
                            <div class="phone-action-wrap">
                                <strong class="data-value" id="display_emergency_phone_1">-</strong>
                                <a href="#" id="call_emergency_1" class="btn-phone-call" style="display: none;" title="Telepon Sekarang">
                                    <i class="fa-solid fa-phone"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Kontak 2 --}}
                <div class="emergency-subcard">
                    <div class="emergency-subcard-header">
                        <span class="emergency-badge secondary-contact">
                            <i class="fa-solid fa-user-plus"></i> Kontak Darurat 2 (Sekunder)
                        </span>
                    </div>
                    <div class="emergency-subcard-body">
                        <div class="data-field-item">
                            <span class="data-label">Nama Kontak</span>
                            <strong class="data-value" id="display_emergency_name_2">-</strong>
                        </div>
                        <div class="data-field-item">
                            <span class="data-label">Hubungan / Relasi</span>
                            <strong class="data-value" id="display_emergency_relation_2">-</strong>
                        </div>
                        <div class="data-field-item">
                            <span class="data-label">Nomor Telepon</span>
                            <div class="phone-action-wrap">
                                <strong class="data-value" id="display_emergency_phone_2">-</strong>
                                <a href="#" id="call_emergency_2" class="btn-phone-call" style="display: none;" title="Telepon Sekarang">
                                    <i class="fa-solid fa-phone"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {{-- SEKSI 4: INFORMASI KESEHATAN --}}
        <section class="profile-section-card">
            <div class="section-title-wrapper">
                <div class="section-icon-badge icon-health">
                    <i class="fa-solid fa-heart-pulse"></i>
                </div>
                <div>
                    <h3>4. Informasi Kesehatan & Medis</h3>
                    <p>Catatan penting untuk penanganan medis pertama oleh tim penyelamat</p>
                </div>
            </div>

            <div class="profile-data-grid">
                <div class="data-field-item">
                    <span class="data-label"><i class="fa-solid fa-droplet"></i> Golongan Darah</span>
                    <div class="blood-type-wrap">
                        <span id="display_blood_type_badge" class="blood-type-badge">-</span>
                    </div>
                </div>

                <div class="data-field-item field-span-2">
                    <span class="data-label"><i class="fa-solid fa-notes-medical"></i> Alergi / Kondisi Khusus / Riwayat Penyakit</span>
                    <div id="display_allergies_condition" class="medical-condition-box">
                        -
                    </div>
                </div>
            </div>
        </section>

    </div>

    {{-- 3. FORM LENGKAPI / EDIT PROFIL (EDIT FORM) --}}
    <section id="profileFormSection" class="profile-form-section" style="display: none;">
        <div class="form-section-header">
            <div class="form-header-title">
                <div class="section-icon-badge icon-edit">
                    <i class="fa-solid fa-user-pen"></i>
                </div>
                <div>
                    <h2>Formulir Lengkapi Data Profil</h2>
                    <p>Lengkapi informasi berikut untuk memastikan akurasi data respon Panic Button</p>
                </div>
            </div>
            <button type="button" id="closeFormTopBtn" class="btn-close-form" title="Tutup Formulir">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <form id="userProfileForm" class="user-profile-form">
            
            {{-- FIELDSET 1: INFORMASI PRIBADI --}}
            <div class="form-fieldset">
                <h4 class="fieldset-legend"><i class="fa-solid fa-id-card"></i> 1. Informasi Pribadi</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="input_name" class="form-label">Nama Lengkap <span class="required-star">*</span></label>
                        <input type="text" id="input_name" class="form-input" placeholder="Masukkan nama lengkap" required>
                    </div>

                    <div class="form-group">
                        <label for="input_email" class="form-label">Email <span class="badge-lock">Terkunci</span></label>
                        <input type="email" id="input_email" class="form-input readonly-input" readonly>
                    </div>

                    <div class="form-group">
                        <label for="input_phone" class="form-label">Nomor Telepon / WhatsApp <span class="required-star">*</span></label>
                        <input type="tel" id="input_phone" class="form-input" placeholder="Contoh: 081234567890" required>
                    </div>

                    <div class="form-group">
                        <label for="input_birth_date" class="form-label">Tanggal Lahir</label>
                        <div class="input-date-wrapper">
                            <input type="text" id="input_birth_date" class="form-input custom-datepicker" placeholder="Pilih tanggal lahir (contoh: 17 Agustus 1998)">
                            <i class="fa-solid fa-calendar-days input-date-icon"></i>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="input_gender" class="form-label">Jenis Kelamin</label>
                        <select id="input_gender" class="form-select">
                            <option value="">-- Pilih Jenis Kelamin --</option>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                        </select>
                    </div>
                </div>
            </div>

            {{-- FIELDSET 2: ALAMAT LENGKAP --}}
            <div class="form-fieldset">
                <h4 class="fieldset-legend"><i class="fa-solid fa-map-location-dot"></i> 2. Informasi Alamat</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="input_province" class="form-label">Provinsi</label>
                        <input type="text" id="input_province" class="form-input" placeholder="Contoh: D.I. Yogyakarta">
                    </div>

                    <div class="form-group">
                        <label for="input_city" class="form-label">Kota / Kabupaten</label>
                        <input type="text" id="input_city" class="form-input" placeholder="Contoh: Kab. Sleman">
                    </div>

                    <div class="form-group">
                        <label for="input_district" class="form-label">Kecamatan</label>
                        <input type="text" id="input_district" class="form-input" placeholder="Contoh: Depok">
                    </div>

                    <div class="form-group">
                        <label for="input_subdistrict" class="form-label">Kelurahan / Desa</label>
                        <input type="text" id="input_subdistrict" class="form-input" placeholder="Contoh: Caturtunggal">
                    </div>

                    <div class="form-group form-span-2">
                        <label for="input_full_address" class="form-label">Alamat Lengkap (Nama Jalan, No. Rumah, RT/RW, Perumahan)</label>
                        <textarea id="input_full_address" class="form-textarea" rows="2" placeholder="Tuliskan alamat lengkap..."></textarea>
                    </div>

                    <div class="form-group">
                        <label for="input_postal_code" class="form-label">Kode Pos</label>
                        <input type="text" id="input_postal_code" class="form-input" placeholder="Contoh: 55281">
                    </div>
                </div>
            </div>

            {{-- FIELDSET 3: KONTAK DARURAT (2 KONTAK) --}}
            <div class="form-fieldset">
                <h4 class="fieldset-legend"><i class="fa-solid fa-phone-volume"></i> 3. Kontak Darurat (Wajib Disiapkan)</h4>
                <div class="emergency-form-dual">
                    
                    {{-- Kontak Darurat 1 --}}
                    <div class="emergency-form-box">
                        <h5 class="sub-legend primary-label"><i class="fa-solid fa-star"></i> Kontak Darurat 1 (Utama)</h5>
                        <div class="form-group">
                            <label for="input_emergency_name_1" class="form-label">Nama Kontak 1</label>
                            <input type="text" id="input_emergency_name_1" class="form-input" placeholder="Nama lengkap kontak">
                        </div>
                        <div class="form-group">
                            <label for="input_emergency_relation_1" class="form-label">Hubungan / Relasi</label>
                            <select id="input_emergency_relation_1" class="form-select">
                                <option value="">-- Pilih Hubungan --</option>
                                <option value="Orang Tua">Orang Tua</option>
                                <option value="Pasangan (Suami/Istri)">Pasangan (Suami/Istri)</option>
                                <option value="Saudara Kandung">Saudara Kandung</option>
                                <option value="Anak">Anak</option>
                                <option value="Kerabat Keluarga">Kerabat Keluarga</option>
                                <option value="Teman Dekat">Teman Dekat</option>
                                <option value="Tetangga">Tetangga</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="input_emergency_phone_1" class="form-label">Nomor Telepon Kontak 1</label>
                            <input type="tel" id="input_emergency_phone_1" class="form-input" placeholder="08xxxxxxxxxx">
                        </div>
                    </div>

                    {{-- Kontak Darurat 2 --}}
                    <div class="emergency-form-box">
                        <h5 class="sub-legend secondary-label"><i class="fa-solid fa-user-plus"></i> Kontak Darurat 2 (Sekunder)</h5>
                        <div class="form-group">
                            <label for="input_emergency_name_2" class="form-label">Nama Kontak 2</label>
                            <input type="text" id="input_emergency_name_2" class="form-input" placeholder="Nama lengkap kontak">
                        </div>
                        <div class="form-group">
                            <label for="input_emergency_relation_2" class="form-label">Hubungan / Relasi</label>
                            <select id="input_emergency_relation_2" class="form-select">
                                <option value="">-- Pilih Hubungan --</option>
                                <option value="Orang Tua">Orang Tua</option>
                                <option value="Pasangan (Suami/Istri)">Pasangan (Suami/Istri)</option>
                                <option value="Saudara Kandung">Saudara Kandung</option>
                                <option value="Anak">Anak</option>
                                <option value="Kerabat Keluarga">Kerabat Keluarga</option>
                                <option value="Teman Dekat">Teman Dekat</option>
                                <option value="Tetangga">Tetangga</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="input_emergency_phone_2" class="form-label">Nomor Telepon Kontak 2</label>
                            <input type="tel" id="input_emergency_phone_2" class="form-input" placeholder="08xxxxxxxxxx">
                        </div>
                    </div>

                </div>
            </div>

            {{-- FIELDSET 4: INFORMASI KESEHATAN --}}
            <div class="form-fieldset">
                <h4 class="fieldset-legend"><i class="fa-solid fa-heart-pulse"></i> 4. Informasi Kesehatan & Medis</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="input_blood_type" class="form-label">Golongan Darah</label>
                        <select id="input_blood_type" class="form-select">
                            <option value="">-- Pilih Golongan Darah --</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="AB">AB</option>
                            <option value="O">O</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="Belum Diketahui">Belum Diketahui</option>
                        </select>
                    </div>

                    <div class="form-group form-span-2">
                        <label for="input_allergies_condition" class="form-label">Alergi / Kondisi Khusus / Riwayat Medis Penting</label>
                        <textarea id="input_allergies_condition" class="form-textarea" rows="2" placeholder="Contoh: Asma kronis, Alergi Penisilin, Diabetes Melitus, dsb. (Kosongkan jika tidak ada)"></textarea>
                    </div>
                </div>
            </div>

            {{-- BUTTONS: SIMPAN & BATAL --}}
            <div class="form-actions-footer">
                <button type="button" id="cancelFormBtn" class="btn-cancel-action">
                    <i class="fa-solid fa-xmark"></i>
                    <span>Batal</span>
                </button>
                <button type="button" id="saveProfileBtn" class="btn-save-action">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Simpan Perubahan</span>
                </button>
            </div>

        </form>
    </section>

    {{-- 4. MODAL CROP & SESUAIKAN FOTO PROFIL --}}
    <div id="cropperModal" class="cropper-modal-overlay" style="display: none;">
        <div class="cropper-modal-container">
            <div class="cropper-modal-header">
                <div class="cropper-modal-title">
                    <i class="fa-solid fa-crop-simple"></i>
                    <h3>Sesuaikan & Crop Foto Profil</h3>
                </div>
                <button type="button" id="closeCropperModalBtn" class="btn-cropper-close" title="Tutup">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="cropper-modal-body">
                <div class="cropper-image-wrapper">
                    <img id="cropperSourceImage" src="" alt="Crop Source">
                </div>

                <div class="cropper-toolbar">
                    <button type="button" id="cropZoomInBtn" class="cropper-tool-btn" title="Perbesar">
                        <i class="fa-solid fa-magnifying-glass-plus"></i>
                    </button>
                    <button type="button" id="cropZoomOutBtn" class="cropper-tool-btn" title="Perkecil">
                        <i class="fa-solid fa-magnifying-glass-minus"></i>
                    </button>
                    <button type="button" id="cropRotateLeftBtn" class="cropper-tool-btn" title="Putar Kiri 90°">
                        <i class="fa-solid fa-rotate-left"></i>
                    </button>
                    <button type="button" id="cropRotateRightBtn" class="cropper-tool-btn" title="Putar Kanan 90°">
                        <i class="fa-solid fa-rotate-right"></i>
                    </button>
                    <button type="button" id="cropResetBtn" class="cropper-tool-btn" title="Reset Posisi">
                        <i class="fa-solid fa-arrows-rotate"></i>
                    </button>
                </div>
                <p class="cropper-hint-text">
                    <i class="fa-solid fa-circle-info"></i> Geser, perbesar, dan putar foto untuk mendapatkan posisi avatar terbaik.
                </p>
            </div>

            <div class="cropper-modal-footer">
                <button type="button" id="cancelCropperBtn" class="btn-cancel-action">
                    <i class="fa-solid fa-xmark"></i>
                    <span>Batal</span>
                </button>
                <button type="button" id="applyCropBtn" class="btn-save-action">
                    <i class="fa-solid fa-check"></i>
                    <span>Terapkan & Simpan Foto</span>
                </button>
            </div>
        </div>
    </div>

</div>
@endsection

@push('scripts')
<!-- Cropper.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js"></script>
<!-- Flatpickr JS & Locale ID -->
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
<script src="https://npmcdn.com/flatpickr/dist/l10n/id.js"></script>

<script>
    window.currentUser = {
        id: @json(session('web_user_id')),
        name: @json(session('web_user_name')),
        email: @json(session('web_user_email')),
        phone: @json(session('web_user_phone'))
    };
</script>
<script type="module" src="{{ asset('js/users/profil.js') }}"></script>
@endpush