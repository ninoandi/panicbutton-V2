let emergencyMap;

let userMarker;

let facilityMarkers = [];

let allFacilities = [];

const icons = {

    user: L.divIcon({
        className: 'custom-marker user-marker',
        html: `
            <div class="marker-icon">
                <i class="fa-solid fa-user"></i>
            </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 42],
        popupAnchor: [0, -40]
    }),

    hospital: L.divIcon({
        className: 'custom-marker hospital-marker',
        html: `
            <div class="marker-icon">
                <i class="fa-solid fa-hospital"></i>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -34]
    }),

    police: L.divIcon({
        className: 'custom-marker police-marker',
        html: `
            <div class="marker-icon">
                <i class="fa-solid fa-shield-halved"></i>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -34]
    }),

    fire_station: L.divIcon({
        className: 'custom-marker fire-marker',
        html: `
            <div class="marker-icon">
                <i class="fa-solid fa-fire"></i>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -34]
    }),

    clinic: L.divIcon({
        className: 'custom-marker clinic-marker',
        html: `
            <div class="marker-icon">
                <i class="fa-solid fa-kit-medical"></i>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -34]
    }),

    default: L.divIcon({
        className: 'custom-marker default-marker',
        html: `
            <div class="marker-icon">
                <i class="fa-solid fa-location-dot"></i>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -34]
    })

};

document.addEventListener(
    'DOMContentLoaded',
    function () {

        initEmergencyMap();

    }
);


function initEmergencyMap() {

    emergencyMap = L.map(
        'emergencyMap'
    ).setView(
        [-6.200000, 106.816666],
        13
    );


    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }
    ).addTo(emergencyMap);


    getUserLocation();

}

function getUserLocation() {

    if (!navigator.geolocation) {

        alert(
            'Browser Anda tidak mendukung geolocation.'
        );

        return;

    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const lat =
                position.coords.latitude;

            const lng =
                position.coords.longitude;


            emergencyMap.setView(
                [lat, lng],
                14
            );


            userMarker = L.marker(
                [lat, lng],
                {
                    icon: icons.user
                }
            )
            .addTo(emergencyMap)
            .bindPopup(
                '<b>📍 Lokasi Anda</b>'
            )
            .openPopup();


            loadNearbyFacilities(
                lat,
                lng
            );

        },


        function () {

            document
                .getElementById('mapLoading')
                .innerHTML = `
                    <i class="fa-solid fa-location-crosshairs"></i>
                    Aktifkan izin lokasi untuk melihat instansi terdekat.
                `;

        },

        {
            enableHighAccuracy: true,
            timeout: 10000
        }

    );

}

async function loadNearbyFacilities(lat, lng) {

    try {

        const url =
            `/emergency-facilities?lat=${lat}&lng=${lng}`;

        console.log('Request URL:', url);

        const response = await fetch(url);

        console.log('Status:', response.status);
        console.log(
            'Content-Type:',
            response.headers.get('content-type')
        );

        // Cek jika response gagal
        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                'Response Server:',
                errorText
            );

            throw new Error(
                `HTTP Error ${response.status}`
            );

        }

        // Pastikan response berupa JSON
        const contentType =
            response.headers.get('content-type');

        if (
            !contentType ||
            !contentType.includes('application/json')
        ) {

            const text =
                await response.text();

            console.error(
                'Response bukan JSON:',
                text
            );

            throw new Error(
                'Server tidak mengembalikan JSON'
            );

        }

        const result = await response.json();

        if (!result.success) {

            throw new Error(
                result.message ||
                'Gagal mengambil data instansi'
            );

        }

        allFacilities = result.data;

        displayFacilities(allFacilities);

        document
            .getElementById('mapLoading')
            .innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                ${allFacilities.length}
                instansi ditemukan di sekitar Anda.
            `;

    } catch (error) {

        console.error(
            'Error Emergency Map:',
            error
        );

        document
            .getElementById('mapLoading')
            .innerHTML = `
                <i class="fa-solid fa-triangle-exclamation"></i>
                ${error.message}
            `;

    }

}

function displayFacilities(
    facilities
) {

    facilityMarkers.forEach(
        marker => {

            emergencyMap.removeLayer(
                marker
            );

        }
    );


    facilityMarkers = [];


    facilities.forEach(
        facility => {

            const marker = L.marker(
                [
                    facility.lat,
                    facility.lng
                ],
                {
                    icon:
                        icons[facility.type]
                        ?? icons.default
                }
            )
            .addTo(emergencyMap)
            .bindPopup(
                `
                <div>

                    <strong>
                        ${facility.name}
                    </strong>

                    <br>

                    <span>
                        ${getFacilityLabel(
                            facility.type
                        )}
                    </span>

                    <br>

                    <small>
                        ${facility.address}
                    </small>

                </div>
                `

            );


            facilityMarkers.push(
                marker
            );

        }
    );

}

function getFacilityLabel(type) {

    const labels = {

        hospital:
            'Rumah Sakit',

        clinic:
            'Klinik',

        police:
            'Kantor Polisi',

        fire_station:
            'Pemadam Kebakaran'

    };


    return labels[type]
        ?? 'Instansi';

}

document
    .querySelectorAll('.map-filter-btn')
    .forEach(button => {

        button.addEventListener(
            'click',
            function () {

                document
                    .querySelectorAll(
                        '.map-filter-btn'
                    )
                    .forEach(btn => {

                        btn.classList.remove(
                            'active'
                        );

                    });


                this.classList.add(
                    'active'
                );


                const type =
                    this.dataset.type;


                if (type === 'all') {

                    displayFacilities(
                        allFacilities
                    );

                    return;

                }


                const filtered =
                    allFacilities.filter(
                        facility =>
                            facility.type === type
                    );


                displayFacilities(
                    filtered
                );

            }
        );

    });