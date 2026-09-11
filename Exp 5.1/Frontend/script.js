const API_URL = "http://localhost:8080/api/users";

const userForm = document.getElementById("userForm");
const uidInput = document.getElementById("uid");
const nameInput = document.getElementById("name");
const submitBtn = document.getElementById("submitBtn");
const clearBtn = document.getElementById("clearBtn");
const refreshBtn = document.getElementById("refreshBtn");
const message = document.getElementById("message");
const userTableBody = document.getElementById("userTableBody");

let editingUid = null;


// Display message
function showMessage(text, success = true) {

    message.textContent = text;

    message.className = success
        ? "success"
        : "error";
}


// Add or Update User
userForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const uid = uidInput.value.trim();
    const name = nameInput.value.trim();

    if (!uid || !name) {
        showMessage("Please enter UID and Name.", false);
        return;
    }

    try {

        let response;

        if (editingUid === null) {

            response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    uid: uid,
                    name: name
                })

            });

        } else {

            response = await fetch(
                `${API_URL}/${editingUid}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        uid: editingUid,
                        name: name
                    })

                }
            );
        }

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


// Load all users
async function loadUsers() {

    try {

        const response = await fetch(API_URL);

        const result = await response.json();

        userTableBody.innerHTML = "";

        if (!result.success) {

            showMessage(result.message, false);

            return;
        }

        result.data.forEach(user => {

            const row = document.createElement("tr");

            // UID
            const uidCell = document.createElement("td");
            uidCell.textContent = user.uid;

            // Name
            const nameCell = document.createElement("td");
            nameCell.textContent = user.name;

            // Actions
            const actionCell = document.createElement("td");

            // Edit button
            const editButton =
                document.createElement("button");

            editButton.textContent = "Edit";
            editButton.className = "action-btn edit-btn";

            editButton.addEventListener(
                "click",
                function () {

                    editingUid = user.uid;

                    uidInput.value = user.uid;
                    nameInput.value = user.name;

                    uidInput.disabled = true;

                    submitBtn.textContent = "Update User";

                    showMessage(
                        "Edit the name and click Update User.",
                        true
                    );

                    nameInput.focus();
                }
            );

            // Delete button
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


// Delete User
async function deleteUser(uid) {

    const confirmed = confirm(
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


// Clear form
function clearForm() {

    userForm.reset();

    editingUid = null;

    uidInput.disabled = false;

    submitBtn.textContent = "Add User";
}


// Clear button
clearBtn.addEventListener(
    "click",
    function () {

        clearForm();

        message.textContent = "";
        message.className = "";
    }
);


// Refresh button
refreshBtn.addEventListener(
    "click",
    function () {

        loadUsers();
    }
);


// Initial load
loadUsers();