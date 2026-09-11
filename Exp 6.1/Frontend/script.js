const API_URL = "http://localhost:8082/api/users";

let currentPage = 0;


// =================================
// Load Users
// =================================

async function loadUsers(page) {

    currentPage = page;

    const pageSize =
        document.getElementById("pageSize").value;

    const sortField =
        document.getElementById("sortField").value;

    const sortDirection =
        document.getElementById("sortDirection").value;


    const url =
        `${API_URL}?page=${currentPage}` +
        `&size=${pageSize}` +
        `&sort=${sortField},${sortDirection}`;


    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to load users");
        }

        const result = await response.json();


        const tableBody =
            document.getElementById("userTableBody");

        tableBody.innerHTML = "";


        if (result.content.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        No users found.
                    </td>
                </tr>
            `;

        } else {

            result.content.forEach(user => {

                const row =
                    document.createElement("tr");

                row.innerHTML = `
                    <td>${user.uid}</td>

                    <td>${user.name}</td>

                    <td>
                        <button
                            class="btn btn-delete"
                            onclick="deleteUser('${user.uid}')"
                        >
                            Delete
                        </button>
                    </td>
                `;

                tableBody.appendChild(row);
            });
        }


        document.getElementById("pageInfo")
            .textContent =
            `Page ${result.pageNumber + 1} of ${result.totalPages || 1}`;


        document.getElementById("totalInfo")
            .textContent =
            `Total Users: ${result.totalElements}`;


        document.getElementById("previousButton")
            .disabled = result.first;


        document.getElementById("nextButton")
            .disabled = result.last;


        showMessage("");

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to connect to the backend."
        );
    }
}


// =================================
// Previous Page
// =================================

function previousPage() {

    if (currentPage > 0) {

        loadUsers(currentPage - 1);
    }
}


// =================================
// Next Page
// =================================

function nextPage() {

    loadUsers(currentPage + 1);
}


// =================================
// Add User
// =================================

document
    .getElementById("userForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const uid =
                document
                    .getElementById("uid")
                    .value
                    .trim();


            const name =
                document
                    .getElementById("name")
                    .value
                    .trim();


            try {

                const response =
                    await fetch(
                        API_URL,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    uid: uid,
                                    name: name
                                })
                        }
                    );


                if (response.ok) {

                    showMessage(
                        "User added successfully."
                    );


                    document
                        .getElementById("userForm")
                        .reset();


                    loadUsers(0);

                } else {

                    const result =
                        await response.json();

                    showMessage(
                        result.message ||
                        "Unable to add user."
                    );
                }

            } catch (error) {

                console.error(error);

                showMessage(
                    "Unable to connect to the backend."
                );
            }
        }
    );


// =================================
// Delete User
// =================================

async function deleteUser(uid) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this user?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/${uid}`,
                {
                    method: "DELETE"
                }
            );


        if (response.ok) {

            showMessage(
                "User deleted successfully."
            );

            loadUsers(currentPage);

        } else {

            showMessage(
                "Unable to delete user."
            );
        }

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to connect to the backend."
        );
    }
}


// =================================
// Show Message
// =================================

function showMessage(message) {

    document.getElementById("message")
        .textContent = message;
}


// =================================
// Initial Load
// =================================

loadUsers(0);