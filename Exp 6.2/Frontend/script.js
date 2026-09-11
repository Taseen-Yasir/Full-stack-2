const API_URL = "http://localhost:8083/api/users";

const userForm = document.getElementById("userForm");
const userTableBody = document.getElementById("userTableBody");
const resultMessage = document.getElementById("resultMessage");


// =================================
// Load Users / Run Query
// =================================

async function runQuery(type = "cached") {

    const startTime = performance.now();

    let endpoint = "";
    let label = "";

    if (type === "normal") {
        endpoint = "/normal";
        label = "NORMAL QUERY";
    }
    else if (type === "optimized") {
        endpoint = "/optimized";
        label = "JOIN FETCH";
    }
    else if (type === "cached") {
        endpoint = "/cached";
        label = "CACHED QUERY";
    }
    else if (type === "native") {
        endpoint = "/native";
        label = "NATIVE SQL";
    }

    try {

        const response = await fetch(
            API_URL + endpoint
        );

        if (!response.ok) {
            throw new Error("Request failed");
        }

        const users = await response.json();

        const endTime = performance.now();

        const time =
            (endTime - startTime).toFixed(2);

        displayUsers(users, type);

        showResult(
            `${label} completed in ${time} ms`,
            true
        );

    }
    catch (error) {

        console.error(error);

        showResult(
            "Unable to connect to backend.",
            false
        );
    }
}


// =================================
// Sort Users
// =================================

async function sortUsers(type) {

    const startTime = performance.now();

    let endpoint = "";
    let label = "";

    if (type === "id") {
        endpoint = "/sort/id";
        label = "SORT BY ID";
    }
    else {
        endpoint = "/sort/name";
        label = "SORT BY NAME";
    }

    try {

        const response = await fetch(
            API_URL + endpoint
        );

        if (!response.ok) {
            throw new Error("Request failed");
        }

        const users = await response.json();

        const endTime = performance.now();

        const time =
            (endTime - startTime).toFixed(2);

        displayUsers(users, type);

        showResult(
            `${label} completed in ${time} ms`,
            true
        );

    }
    catch (error) {

        console.error(error);

        showResult(
            "Unable to connect to backend.",
            false
        );
    }
}


// =================================
// Display Users
// =================================

function displayUsers(users, type) {

    userTableBody.innerHTML = "";

    if (!users || users.length === 0) {

        userTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    No users found.
                </td>
            </tr>
        `;

        return;
    }


    users.forEach(user => {

        let id;
        let uid;
        let name;
        let city;
        let country;


        /*
         * Native SQL returns:
         *
         * [id, uid, name, city, country]
         */

        if (type === "native") {

            id = user[0];
            uid = user[1];
            name = user[2];
            city = user[3];
            country = user[4];

        }
        else {

            id = user.id;
            uid = user.uid;
            name = user.name;

            if (user.address) {

                city = user.address.city;
                country = user.address.country;

            }
            else {

                city = "-";
                country = "-";
            }
        }


        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${id}</td>
            <td>${uid}</td>
            <td>${name}</td>
            <td>${city}</td>
            <td>${country}</td>
            <td>
                <button
                    class="btn btn-delete"
                    onclick="deleteUser(${id})"
                >
                    Delete
                </button>
            </td>
        `;

        userTableBody.appendChild(row);

    });
}


// =================================
// Add User
// =================================

userForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const user = {

            uid:
                document
                    .getElementById("uid")
                    .value
                    .trim(),

            name:
                document
                    .getElementById("name")
                    .value
                    .trim(),

            city:
                document
                    .getElementById("city")
                    .value
                    .trim(),

            country:
                document
                    .getElementById("country")
                    .value
                    .trim()
        };


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
                            JSON.stringify(user)
                    }
                );


            if (!response.ok) {
                throw new Error(
                    "Unable to add user"
                );
            }


            userForm.reset();

            showResult(
                "User added successfully.",
                true
            );

            /*
             * Creating a user clears
             * the cache in the backend.
             */
            runQuery("cached");

        }
        catch (error) {

            console.error(error);

            showResult(
                error.message ||
                "Unable to add user.",
                false
            );
        }

    }
);


// =================================
// Delete User
// =================================

async function deleteUser(id) {

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
                `${API_URL}/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to delete user"
            );
        }


        showResult(
            "User deleted successfully.",
            true
        );

        runQuery("cached");

    }
    catch (error) {

        console.error(error);

        showResult(
            error.message ||
            "Unable to delete user.",
            false
        );
    }
}


// =================================
// Show Result
// =================================

function showResult(message, success) {

    resultMessage.textContent = message;

    if (success) {

        resultMessage.style.background =
            "#ecfdf5";

        resultMessage.style.borderColor =
            "#d1fae5";

        resultMessage.style.color =
            "#166534";

    }
    else {

        resultMessage.style.background =
            "#fef2f2";

        resultMessage.style.borderColor =
            "#fecaca";

        resultMessage.style.color =
            "#b91c1c";
    }
}


// =================================
// Initial Load
// =================================

runQuery("cached");