let userStatus = [];
document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Fetch user data from the server
        const response = await fetch("/users");
        // Parse JSON response
        const data = await response.json();
        if (response.status === 401) {
            alert(data.error);
            window.location.href = "/login.html";
        }
        if (response.status === 422) {
            alert(data.error);
        }
        if (response.status === 400) {
            alert(data.error);
        }
        if (response.ok) {
            let user_id = data.currentUser.user_id;

            const socket = io({ query: { userId: user_id } });
            // Handle user status updates
            socket.on("user_status", (userStatus) => {
                userStatus = userStatus;
                console.log( 'user connect : ',userStatus);
                console.log('data : ',data);
                
                // Update the userStatus array with the new data
                displayUsers(data, userStatus);
            });
        }
    } catch (error) {
        // Handle network errors
        console.log("Network error. Please try again.", error);
        // alert("Network error. Please try again.");
    }
});

document.querySelector(".logout").addEventListener("click", async function (e) {
    e.preventDefault();
    try {
        const response = await fetch("/logout", {
            method: "GET",
            redirect: "follow",
        });
        if (response.redirected) {
            window.location.href = response.url; // Redirect to the login page
        }
    } catch (error) {
        console.error("Error during logout:", error);
        alert("Error during logout. Please try again.");
    }
});

function displayUsers(data, userStatus) {
    const headerDetails = document.querySelector(".users header .details");
    const imgElement = document.getElementById("imgUser");
    imgElement.src = data.currentUser.image;
    console.log("Image URL:", data.currentUser.image);
    headerDetails.querySelector(
        "span"
    ).textContent = `${data.currentUser.firstname} ${data.currentUser.lastname}`;
    headerDetails.querySelector("p").textContent = "active";
    // Handle successful response
    const usersList = document.querySelector(".users-list");
    usersList.innerHTML = ""; // Clear previous results
    if (data.users.length > 0) {
        // Populate the users list with data
        data.users.forEach((user) => {
            const from = data.currentUser.user_id;
            const to = user.user_id;

            const userItem = document.createElement("a");
            userItem.href = `chat.html?to=${to}&from=${from}`;

            const contentDiv = document.createElement("div");
            contentDiv.classList.add("content");

            const image = document.createElement("img");
            image.src = user.image;

            const detailsDiv = document.createElement("div");
            detailsDiv.classList.add("details");

            const nameSpan = document.createElement("span");
            nameSpan.textContent = `${user.firstname} ${user.lastname}`;

            const messageP = document.createElement("p");
            messageP.textContent = "this is test message..."; // Modify as needed

            const statusDotDiv = document.createElement("div");
            statusDotDiv.classList.add("status-dot");

            // You can add a class or logic to display status
            const userStatusEntry = userStatus.find((userS) => userS.userId === user.user_id);
            if (userStatusEntry) {
                statusDotDiv.classList.remove("offline");
            } else {
                statusDotDiv.classList.add("offline");
            }
            // Modify according to your logic

            const statusIcon = document.createElement("i");
            statusIcon.classList.add("fas", "fa-circle");

            statusDotDiv.appendChild(statusIcon);

            detailsDiv.appendChild(nameSpan);
            detailsDiv.appendChild(messageP);
            contentDiv.appendChild(image);
            contentDiv.appendChild(detailsDiv);
            userItem.appendChild(contentDiv);
            userItem.appendChild(statusDotDiv);

            usersList.appendChild(userItem);
        });
    }
}

// // searchBar toggle
// const searchBar = document.querySelector(".search input"),
// searchIcon = document.querySelector(".search button"),
// usersList = document.querySelector(".users-list");

// searchIcon.onclick = ()=>{
//   searchBar.classList.toggle("show");
//   searchIcon.classList.toggle("active");
//   searchBar.focus();
//   if(searchBar.classList.contains("active")){
//     searchBar.value = "";
//     searchBar.classList.remove("active");
//   }
// }

// searchBar.onkeyup = ()=>{
//   let searchTerm = searchBar.value;
//   if(searchTerm != ""){
//     searchBar.classList.add("active");
//   }else{
//     searchBar.classList.remove("active");
//   }
//   let xhr = new XMLHttpRequest();
//   xhr.open("POST", "php/search.php", true);
//   xhr.onload = ()=>{
//     if(xhr.readyState === XMLHttpRequest.DONE){
//         if(xhr.status === 200){
//           let data = xhr.response;
//           usersList.innerHTML = data;
//         }
//     }
//   }
//   xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
//   xhr.send("searchTerm=" + searchTerm);
// }

// setInterval(() =>{
//   let xhr = new XMLHttpRequest();
//   xhr.open("GET", "php/users.php", true);
//   xhr.onload = ()=>{
//     if(xhr.readyState === XMLHttpRequest.DONE){
//         if(xhr.status === 200){
//           let data = xhr.response;
//           if(!searchBar.classList.contains("active")){
//             usersList.innerHTML = data;
//           }
//         }
//     }
//   }
//   xhr.send();
// }, 500);
