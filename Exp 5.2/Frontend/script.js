const API_URL = "http://localhost:8081/api/users";

const userForm = document.getElementById("userForm");

const uidInput = document.getElementById("uid");
const nameInput = document.getElementById("name");

const submitBtn = document.getElementById("submitBtn");
const updateBtn = document.getElementById("updateBtn");
const clearBtn = document.getElementById("clearBtn");
const refreshBtn = document.getElementById("refreshBtn");

const searchUid = document.getElementById("searchUid");
const searchBtn = document.getElementById("searchBtn");

const searchResult = document.getElementById("searchResult");
const message = document.getElementById("message");
const userTableBody = document.getElementById("userTableBody");

let editingUid = null;


// --------------------------------------------------
// DISPLAY MESSAGE
// --------------------------------------------------

function showMessage(text, success = true) {

    message.textContent = text;

    message.className = success
        ? "success"
        : "error";
}


// --------------------------------------------------
// ADD USER
// --------------------------------------------------

userForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const uid = uidInput.value.trim();
    const name = nameInput.value.trim();

    if (!uid || !name) {

        showMessage(
            "Please enter UID and Name.",
            false
        );

        return;
    }

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                uid: uid,
                name: name
            })

        });

        const result = await response.json();

        showMessage(
            result.message,
            result.success
        );

        if (result.success) {

            clearForm();

            await loadUsers();
        }

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to connect to the server.",
            false
        );
    }
});


// --------------------------------------------------
// UPDATE USER
// --------------------------------------------------

updateBtn.addEventListener("click", async function () {

    const uid = uidInput.value.trim();
    const name = nameInput.value.trim();

    if (!uid || !name) {

        showMessage(
            "Please enter UID and Name.",
            false
        );

        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/${uid}`,
            {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    uid: uid,
                    name: name
                })
            }
        );

        const result = await response.json();

        showMessage(
            result.message,
            result.success
        );

        if (result.success) {

            clearForm();

            await loadUsers();
        }

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to connect to the server.",
            false
        );
    }
});


// --------------------------------------------------
// SEARCH USER
// --------------------------------------------------

searchBtn.addEventListener("click", async function () {

    const uid = searchUid.value.trim();

    if (!uid) {

        searchResult.innerHTML =
            `<div class="error-box">
                Please enter a UID to search.
             </div>`;

        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/${uid}`
        );

        const result = await response.json();

        if (response.ok && result.success) {

            searchResult.innerHTML =
                `<div class="success-box">
                    User found: 
                    <strong>${result.data.name}</strong>
                    (${result.data.uid})
                 </div>`;

        } else {

            searchResult.innerHTML =
                `<div class="error-box">
                    ${result.message}
                 </div>`;
        }

    } catch (error) {

        console.error(error);

        searchResult.innerHTML =
            `<div class="error-box">
                Unable to connect to the server.
             </div>`;
    }
});


// --------------------------------------------------
// LOAD ALL USERS
// --------------------------------------------------

async function loadUsers() {

    try {

        const response = await fetch(API_URL);

        const result = await response.json();

        userTableBody.innerHTML = "";

        if (!result.success) {

            showMessage(
                result.message,
                false
            );

            return;
        }

        result.data.forEach(user => {

            const row =
                document.createElement("tr");


            // UID
            const uidCell =
                document.createElement("td");

            uidCell.textContent = user.uid;


            // NAME
            const nameCell =
                document.createElement("td");

            nameCell.textContent = user.name;


            // ACTIONS
            const actionCell =
                document.createElement("td");


            // EDIT BUTTON
            const editButton =
                document.createElement("button");

            editButton.textContent = "Edit";

            editButton.className =
                "action-btn edit-btn";


            editButton.addEventListener(
                "click",
                function () {

                    editingUid = user.uid;

                    uidInput.value =
                        user.uid;

                    nameInput.value =
                        user.name;

                    uidInput.disabled = true;

                    submitBtn.disabled = true;

                    showMessage(
                        "Edit the name and click Update User.",
                        true
                    );

                    nameInput.focus();
                }
            );


            // DELETE BUTTON
            const deleteButton =
                document.createElement("button");

            deleteButton.textContent = "Delete";

            deleteButton.className =
                "action-btn delete-btn";


            deleteButton.addEventListener(
                "click",
                function () {

                    deleteUser(user.uid);
                }
            );


            actionCell.appendChild(editButton);
            actionCell.appendChild(deleteButton);

            row.appendChild(uidCell);
            row.appendChild(nameCell);
            row.appendChild(actionCell);

            userTableBody.appendChild(row);

        });

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to load users.",
            false
        );
    }
}


// --------------------------------------------------
// DELETE USER
// --------------------------------------------------

async function deleteUser(uid) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this user?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/${uid}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        showMessage(
            result.message,
            result.success
        );

        await loadUsers();

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to delete user.",
            false
        );
    }
}


// --------------------------------------------------
// CLEAR FORM
// --------------------------------------------------

function clearForm() {

    userForm.reset();

    editingUid = null;

    uidInput.disabled = false;

    submitBtn.disabled = false;
}


// --------------------------------------------------
// CLEAR BUTTON
// --------------------------------------------------

clearBtn.addEventListener(
    "click",
    function () {

        clearForm();

        message.textContent = "";
        message.className = "";
    }
);


// --------------------------------------------------
// REFRESH BUTTON
// --------------------------------------------------

refreshBtn.addEventListener(
    "click",
    function () {

        loadUsers();
    }
);


// --------------------------------------------------
// INITIAL LOAD
// --------------------------------------------------

loadUsers();