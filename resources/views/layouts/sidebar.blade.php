<nav class="sidebar" id="sidebar">

    <div class="sidebar-header">

        <div class="sidebar-title">
            Panic Button
        </div>

    </div>


    <ul class="sidebar-menu">

        <li>
            <a href="{{ route('dashboard') }}">
                <i class="fas fa-home"></i>
                Dashboard
            </a>
        </li>


        <li>
            <a href="{{ route('monitoring-iot') }}">
                <i class="fas fa-building"></i>
                Monitoring Device
            </a>
        </li>

        <li>
            <a href="{{ route('manajemen-user') }}">
                <i class="fas fa-user"></i>
                Manajemen User
            </a>
        </li>

        <li>
            <a href="#" id="quick-message">
                <i class="fas fa-comment-dots"></i>
                Quick Message
            </a>
        </li>

        <li>
            <a href="{{ route('manajemen-user') }}">
                <i class="fas fa-user"></i>
                Panduan SOS
            </a>
        </li>

        <li>
            <a href="{{ route('perumahan') }}">
                <i class="fas fa-building"></i>
                Rekap Data
            </a>
        </li>




        <li>
            <a href="{{ route('statistik') }}">
                <i class="fas fa-chart-line"></i>
                Statistik
            </a>
        </li>


    </ul>

</nav>


<div class="sidebar-overlay" id="sidebarOverlay">
</div>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>