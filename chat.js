const socket = io();

// Get 'to' and 'from' query parameters from the URL
const urlParams = new URLSearchParams(window.location.search);
const to = urlParams.get("to");
const from = urlParams.get("from");

const chatBox = document.querySelector(".chat-box");
chatBox.innerHTML = "";
const imageUser = document.getElementsByTagName("img")[0];
let spanFLname = document.getElementsByTagName("span")[0];
let paraStatus = document.getElementsByTagName("p")[0];

let getdata =[];
let isSend = false;

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const response = await fetch(`/chat?from=${from}&to=${to}`);
    const data = await response.json();
    getdata = data;
    if (response.status === 401) {
      alert(data.error);

      window.location.href = "/login.html";
    }
    if (response.status === 404) {
      alert(data.error);
      window.location.href = "/404.html";
    }
    imageUser.src = data.incoming_user.image;
    spanFLname.textContent = `${data.incoming_user.firstname} ${data.incoming_user.lastname}`;
    paraStatus.textContent = `active!`
    if (response.ok) {
      if (data.messages.length === 0) {
        chatBox.innerHTML =
          '<div class="text">No messages are available. Once you send a message they will appear here.</div>';
      } else {
        displayChats(data);
      }
    }
  } catch (error) {
    console.log("Network error from GET CHAT. Please try again.", error);
    //alert("Network error from GET CHAT. Please try again.", error);
  }
});

function displayChats(data) {
  if (data.messages.length > 0) {
    data.messages.forEach((message) => {
      if (message.outgoing_msg_id === data.currentUser.user_id) {
        displayOutgoingMessage(message.msg);
      } else {
        displayIncomingMessage(data.incoming_user.image, message.msg);
      }
    });
  }
}

function displayOutgoingMessage(message) {
  const outgoingChat = document.createElement("div");
  outgoingChat.className = "chat outgoing";

  const outgoingDetails = document.createElement("div");
  outgoingDetails.className = "details";

  const outgoingParagraph = document.createElement("p");
  outgoingParagraph.textContent = message;

  outgoingDetails.appendChild(outgoingParagraph);
  outgoingChat.appendChild(outgoingDetails);
  chatBox.appendChild(outgoingChat);
}

function displayIncomingMessage(imageSrc, message) {
  const incomingChat = document.createElement("div");
  incomingChat.className = "chat incoming";

  const incomingImage = document.createElement("img");
  incomingImage.src = imageSrc;
  incomingImage.alt = "user image";

  const incomingDetails = document.createElement("div");
  incomingDetails.className = "details";

  const incomingParagraph = document.createElement("p");
  incomingParagraph.textContent = message;

  incomingDetails.appendChild(incomingParagraph);
  incomingChat.appendChild(incomingImage);
  incomingChat.appendChild(incomingDetails);
  chatBox.appendChild(incomingChat);
}

// Post chats
document.getElementById("msgform").addEventListener("submit", async function (event) {
  event.preventDefault();

  const formData = new FormData(this);
  const messageData = new URLSearchParams(formData).toString();
  const msginput = document.getElementById("msginput");
  msginput.value = "";

  try {
    const response = await fetch(`/chat?from=${from}&to=${to}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: messageData,
    });
    const data = await response.json();

    if (response.ok) {
      socket.emit("receive_message", data.message);
      if (getdata.messages.length === 0 && !isSend) {
        chatBox.innerHTML = "";
      // Display the sent message immediately
      displayOutgoingMessage(data.message.msg);
      isSend = true;
      }else{
      // Display the sent message immediately
      displayOutgoingMessage(data.message.msg);
      isSend = true;
      }
      
    } else {
      imageUser.src = data.incoming_user.image;
      console.error("Error sending message");
    }
  } catch (error) {
    console.error("Network error from POST chat:", error);
    //walert("Network error from POST chat. Please try again.");
  }
});

// Handle incoming messages
socket.on("send_message", (message) => {
  if (message.incoming_msg_id === from && !isSend) {
    if (getdata.messages.length === 0) {
      chatBox.innerHTML = "";
    displayIncomingMessage(imageUser.src, message.msg);
    isSend = true;
  }else{
    displayIncomingMessage(imageUser.src, message.msg);
    isSend = true;
  }
}
});
