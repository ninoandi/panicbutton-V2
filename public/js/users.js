import {
    db1,
    db2
} from "./firebase-config.js";

import {
    ref,
    onValue,
    get,
    push,
    set,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


// ======================================================
// ELEMENT DOM
// ======================================================

const cardContainer = document.getElementById("cardContainer");

const perumahanFilter = document.getElementById("perumahanFilter");
const roleFilter = document.getElementById("roleFilter");
const searchInput = document.getElementById("searchInput");


const addUserModal = document.getElementById("addUserModal");
const openAddUserModal = document.getElementById("openAddUserModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const saveUserBtn = document.getElementById("saveUserBtn");

const perumahanSelect = document.getElementById("perumahanSelect");
const userNameInput = document.getElementById("userName");
const houseNumberInput = document.getElementById("houseNumber");
const passwordInput = document.getElementById("password");
const roleSelect = document.getElementById("roleSelect");
const customRoleInput = document.getElementById("customRoleInput");

const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const paginationInfo = document.getElementById("paginationInfo");


// ======================================================
// DATA & PAGINATION
// ======================================================

let allUsers = [];
let filteredUsers = [];

let currentPage = 1;

const usersPerPage = 9;


// ======================================================
// FIREBASE REFERENCE
// ======================================================

const daftarPerumahanRef = ref(db1, "daftar_perumahan");
const perumahanRef = ref(db1, "perumahan");


// ======================================================
// AMBIL DAFTAR PERUMAHAN
// ======================================================

onValue(daftarPerumahanRef, (snapshot) => {

    const data = snapshot.val();

    perumahanSelect.innerHTML =
        '<option value="">--- Pilih Perumahan ---</option>';

    if (!data) {
        return;
    }

    Object.entries(data).forEach(([key, name]) => {

        const option = document.createElement("option");

        option.value = key;
        option.textContent = name;

        perumahanSelect.appendChild(option);

    });

});


// ======================================================
// AMBIL DATA USER DARI FIREBASE
// ======================================================

onValue(perumahanRef, (snapshot) => {

    const data = snapshot.val();

    allUsers = [];

    const perumahanNames = new Set();


    if (data) {

        Object.entries(data).forEach(
            ([perumahanKey, perumahanData]) => {

                const users = perumahanData.users || {};

                const perumahanName =
                    perumahanData.info?.nama || perumahanKey;


                Object.entries(users).forEach(
                    ([userId, userInfo]) => {

                        allUsers.push({

                            id: userId,

                            ...userInfo,

                            perumahanKey,

                            perumahanName

                        });

                        perumahanNames.add(perumahanName);

                    }
                );

            }
        );

    }


    populatePerumahanOptions(
        Array.from(perumahanNames)
    );

    applyFilters();

});


// ======================================================
// DROPDOWN FILTER PERUMAHAN
// ======================================================

function populatePerumahanOptions(names) {

    perumahanFilter.innerHTML =
        '<option value="">Semua Perumahan</option>';


    names.forEach((name) => {

        const option = document.createElement("option");

        option.value = name;
        option.textContent = name;

        perumahanFilter.appendChild(option);

    });

}


// ======================================================
// RENDER USER CARD
// ======================================================

function renderCards(users) {

    cardContainer.innerHTML = "";


    if (users.length === 0) {

        cardContainer.innerHTML = `

            <div
                style="
                    grid-column: 1 / -1;
                    text-align: center;
                    color: #888;
                    padding: 40px;
                "
            >

                <i
                    class="fas fa-user-slash"
                    style="
                        font-size: 48px;
                        margin-bottom: 12px;
                        opacity: 0.5;
                    "
                ></i>

                <p>Tidak ada data pengguna.</p>

            </div>

        `;

        return;
    }


    users.forEach((user, index) => {

        const card = document.createElement("div");

        card.className = "user-card";


        // Class berdasarkan role
        if (
            (user.role || "").toUpperCase() === "ADMIN"
        ) {

            card.classList.add("admin-card");

        }
        else if (
            (user.role || "").toUpperCase() === "USER"
        ) {

            card.classList.add("user-card-role");

        }


        const role = (user.role || "").toLowerCase();


        let roleLabel = "USER";

        if (role === "admin") {
            roleLabel = "ADMIN / SATPAM";
        }
        else if (role !== "user" && role !== "") {
            roleLabel = role.toUpperCase();
        }


        card.innerHTML = `

            <div
                style="
                    font-weight: bold;
                    font-size: 1.1rem;
                    margin-bottom: 10px;
                "
            >
                ${index + 1}. ${user.name || "-"}
            </div>


            <div style="margin-bottom: 6px;">

                <i class="fas fa-home"></i>

                <span>
                    No. Rumah:
                    <strong>
                        ${user.houseNumber || "-"}
                    </strong>
                </span>

            </div>


            <div style="margin-bottom: 6px;">

                <i class="fas fa-phone"></i>

                <span>
                    No. HP:
                    <strong>
                        ${user.phoneNumber || "-"}
                    </strong>
                </span>

            </div>


            <div style="margin-bottom: 6px;">

                <i class="fas fa-lock"></i>

                <span>
                    Password:
                    <strong>
                        ${user.password || "-"}
                    </strong>
                </span>

            </div>


            <div style="margin-bottom: 6px;">

                <i class="fas fa-user-tag"></i>

                <span
                    class="role-badge ${role || "unknown"}"
                >
                    ${roleLabel}
                </span>

            </div>


            <div>

                <i class="fas fa-building"></i>

                <span>
                    ${user.perumahanName || "-"}
                </span>

            </div>

        `;


        cardContainer.appendChild(card);

    });

}


// ======================================================
// FILTER DATA
// ======================================================

function applyFilters() {

    const role =
        (roleFilter.value || "")
            .trim()
            .toLowerCase();


    const perumahan =
        (perumahanFilter.value || "")
            .trim()
            .toLowerCase();


    const keyword =
        (searchInput.value || "")
            .trim()
            .toLowerCase();


    filteredUsers = allUsers.filter((user) => {

        const userRole =
            (user.role || "")
                .toLowerCase();


        const userPerumahan =
            (user.perumahanName || "")
                .toLowerCase();


        const userName =
            (user.name || "")
                .toLowerCase();


        const userHouseNumber =
            (user.houseNumber || "")
                .toString()
                .toLowerCase();


        return (

            (!role || userRole === role) &&

            (
                !perumahan ||
                userPerumahan === perumahan
            ) &&

            (
                keyword === "" ||

                userName.includes(keyword) ||

                userHouseNumber.includes(keyword)
            )

        );

    });


    currentPage = 1;

    updatePagination();

}


// ======================================================
// PAGINATION
// ======================================================

function updatePagination() {

    const startIndex =
        (currentPage - 1) * usersPerPage;


    const endIndex =
        Math.min(
            startIndex + usersPerPage,
            filteredUsers.length
        );


    const paginatedUsers =
        filteredUsers.slice(
            startIndex,
            endIndex
        );


    renderCards(paginatedUsers);


    paginationInfo.textContent =
        `Menampilkan ${
            filteredUsers.length === 0
                ? 0
                : startIndex + 1
        } - ${endIndex} dari ${
            filteredUsers.length
        } data`;


    prevPage.disabled =
        currentPage === 1;


    nextPage.disabled =
        endIndex >= filteredUsers.length;

}


// ======================================================
// MODAL - BUKA
// ======================================================

openAddUserModal.addEventListener(
    "click",
    () => {

        addUserModal.style.display = "flex";

    }
);


// ======================================================
// MODAL - TUTUP
// ======================================================

[closeModal, cancelBtn].forEach((btn) => {

    btn.addEventListener(
        "click",
        () => {

            addUserModal.style.display = "none";

            resetForm();

        }
    );

});


// ======================================================
// KLIK DI LUAR MODAL
// ======================================================

window.addEventListener(
    "click",
    (event) => {

        if (event.target === addUserModal) {

            addUserModal.style.display = "none";

            resetForm();

        }

    }
);


// ======================================================
// ROLE SELECT
// ======================================================

roleSelect.addEventListener(
    "change",
    () => {

        if (roleSelect.value === "custom") {

            customRoleInput.style.display = "block";

        }
        else {

            customRoleInput.style.display = "none";

            customRoleInput.value = "";

        }

    }
);


// ======================================================
// RESET FORM
// ======================================================

function resetForm() {

    perumahanSelect.value = "";

    userNameInput.value = "";

    houseNumberInput.value = "";

    passwordInput.value = "";

    roleSelect.value = "admin";

    customRoleInput.value = "";

    customRoleInput.style.display = "none";

}


// ======================================================
// SIMPAN USER KE FIREBASE
// ======================================================

saveUserBtn.addEventListener(
    "click",
    async () => {

        const perumahanKey =
            perumahanSelect.value;


        const name =
            userNameInput.value.trim();


        const houseNumber =
            houseNumberInput.value.trim();


        const password =
            passwordInput.value.trim();


        const roleOption =
            roleSelect.value;


        const customRole =
            customRoleInput.value.trim();


        // Validasi
        if (
            !perumahanKey ||
            !name ||
            !houseNumber ||
            !password
        ) {

            alert(
                "Semua field wajib diisi!"
            );

            return;

        }


        const role =
            roleOption === "custom"
                ? customRole || "custom"
                : roleOption;


        try {

            const newUserRef =
                push(
                    ref(
                        db1,
                        `perumahan/${perumahanKey}/users`
                    )
                );


            await set(
                newUserRef,
                {

                    coverImage: "",

                    houseNumber:

                        houseNumber,

                    name:

                        name,

                    note: "",

                    password:

                        password,

                    phoneNumber: "",

                    profileImage: "",

                    role:

                        role.toLowerCase()

                }
            );


            alert(
                "User berhasil ditambahkan!"
            );


            addUserModal.style.display =
                "none";


            resetForm();

        }
        catch (error) {

            console.error(
                "Error adding user:",
                error
            );


            alert(
                "Gagal menambahkan user."
            );

        }

    }
);


// ======================================================
// EVENT FILTER
// ======================================================

roleFilter.addEventListener(
    "change",
    applyFilters
);


perumahanFilter.addEventListener(
    "change",
    applyFilters
);


searchInput.addEventListener(
    "input",
    applyFilters
);


// ======================================================
// PAGINATION - SEBELUMNYA
// ======================================================

prevPage.addEventListener(
    "click",
    () => {

        if (currentPage > 1) {

            currentPage--;

            updatePagination();

        }

    }
);


// ======================================================
// PAGINATION - BERIKUTNYA
// ======================================================

nextPage.addEventListener(
    "click",
    () => {

        if (
            currentPage * usersPerPage
            < filteredUsers.length
        ) {

            currentPage++;

            updatePagination();

        }

    }
);