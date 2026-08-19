<nav class="sidebar" id="sidebar">

    <div class="sidebar-header">

        <div class="sidebar-title">
            Panic Button
        </div>

    </div>


    <ul class="sidebar-menu">

        {{-- Dashboard --}}
        <li>
            <a href="{{ route('dashboard') }}">
                <i class="fas fa-home"></i>
                Dashboard
            </a>
        </li>


        {{-- Monitoring Device --}}
        <li>
            <a href="{{ route('monitoring-iot') }}">
                <i class="fas fa-building"></i>
                Monitoring Device
            </a>
        </li>


        {{-- Manajemen User --}}
        <li>
            <a href="{{ route('manajemen-user') }}">
                <i class="fas fa-user"></i>
                Manajemen User
            </a>
        </li>


        {{-- Quick Message --}}
        <li>
            <a href="#" id="quick-message">
                <i class="fas fa-comment-dots"></i>
                Quick Message
            </a>
        </li>


        {{-- Panduan SOS --}}
        <li>
            <a href="{{ route('manajemen-user') }}">
                <i class="fas fa-life-ring"></i>
                Panduan SOS
            </a>
        </li>


        {{-- Rekap Data --}}
        <li>
            <a href="{{ route('perumahan') }}">
                <i class="fas fa-building"></i>
                Rekap Data
            </a>
        </li>


        {{-- Statistik --}}
        <li>
            <a href="{{ route('statistik') }}">
                <i class="fas fa-chart-line"></i>
                Statistik
            </a>
        </li>

    </ul>


    {{-- =====================================================
        LOGOUT
    ====================================================== --}}

    <div class="sidebar-logout-container">

        <form
            action="{{ route('logout') }}"
            method="POST"
            id="adminLogoutForm"
        >

            @csrf

            <button
                type="button"
                class="sidebar-logout"
                id="adminLogoutButton"
            >

                <i class="fas fa-sign-out-alt"></i>

                <span>
                    Logout
                </span>

            </button>

        </form>

    </div>

</nav>


<div
    class="sidebar-overlay"
    id="sidebarOverlay"
>
</div>


<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>