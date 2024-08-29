

const socket = io('http://localhost:5000');
//------------------------- get chats ---------------
const urlParams = new URLSearchParams(window.location.search);
const to = urlParams.get("to");
const from = urlParams.get("from");
console.log("To:", to);
console.log("From:", from);
const chatBox = document.querySelector(".chat-box");
chatBox.innerHTML = "";
const imageUser = document.getElementsByTagName("img")[0];

document.addEventListener("DOMContentLoaded", async function () {
  //---------- get ids from users -------

  try {
    const response = await fetch(`/chat?from=${from}&to=${to}`);
    const data = await response.json();
    if (response.status === 401) {
      alert(data.error);
    }
    if (response.ok) {
      console.log(data);
      displayChats(data);
    } else {
      console.log(data);
      imageUser.src = `${data.incoming_user.image}`;
      chatBox.innerHTML =
        '<div class="text">No messages are available. Once you send message they will appear here.</div>';
      console.log("Error response:", data.error);
      //alert("Error: " + data.error);
    }
  } catch (error) {
    console.log("Network error from GET CHAT. Please try again.", error);
    alert("Network error from GET CHAT. Please try again.", error);
  }
});

function displayChats(data) {
  // Create the main chat-box div

  if (data.messages.length > 0) {
    data.messages.forEach((message) => {
      // Create the outgoing chat div

      if (message.outgoing_msg_id === data.currentUser.user_id) {
        imageUser.src = `${data.incoming_user.image}`;
        const outgoingChat = document.createElement("div");
        outgoingChat.className = "chat outgoing";
        // Create the details div for outgoing chat
        const outgoingDetails = document.createElement("div");
        outgoingDetails.className = "details";

        // Create the paragraph for outgoing chat
        const outgoingParagraph = document.createElement("p");
        outgoingParagraph.textContent = `${message.msg}`;

        // Append the paragraph to the details div
        outgoingDetails.appendChild(outgoingParagraph);

        // Append the details div to the outgoing chat div
        outgoingChat.appendChild(outgoingDetails);
        chatBox.appendChild(outgoingChat);
      } else {
        // Create the incoming chat div
        const incomingChat = document.createElement("div");
        incomingChat.className = "chat incoming";

        imageUser.src = `${data.incoming_user.image}`;

        // Create the image element for incoming chat
        const incomingImage = document.createElement("img");
        incomingImage.src = `${data.incoming_user.image}`;
        incomingImage.alt = "user image";

        // Create the details div for incoming chat
        const incomingDetails = document.createElement("div");
        incomingDetails.className = "details";

        // Create the paragraph for incoming chat
        const incomingParagraph = document.createElement("p");
        incomingParagraph.textContent = `${message.msg}`;

        // Append the paragraph to the details div
        incomingDetails.appendChild(incomingParagraph);

        // Append the image and details div to the incoming chat div
        incomingChat.appendChild(incomingImage);
        incomingChat.appendChild(incomingDetails);

        chatBox.appendChild(incomingChat);
      }
      // Append the outgoing and incoming chat divs to the chat-box div
    });
  }
}

//------------------- post chats ------------------------
document.getElementById("msgform").addEventListener("submit", async function (event) {
    event.preventDefault();
    // this makes error , why??
    const formData = new FormData(this);
    const message = new URLSearchParams(formData).toString();
    const msginput = document.getElementById("msginput");
    msginput.value = "";
    try {
      const response = await fetch(`/chat?from=${from}&to=${to}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: message,
      });
      const data = await response.json();
      if (response.ok) {
        console.log('chat data: ',data)
       
        socket.emit('resive_message', message)
        
        // Handle incoming messages
        socket.on("send_message", (message) => {
          console.log('message socket: ',message);
          
        sendMessage(data,message)
        });
        console.log("Message sent successfully");
      } else {
        // Handle error response
        imageUser.src = `${data.incoming_user.image}`;
        console.error("Error sending message");
      }
    } catch (error) {
      // Handle network errors
      console.error("Network error from POST chat:", error);
      alert("Network error from POST chat. Please try again.");
    }
  });

function sendMessage(data, message) {
  if (message.outgoing_msg_id === from) {
    // Handle outgoing message
    const outgoingChat = document.createElement("div");
    outgoingChat.className = "chat outgoing";

    const outgoingDetails = document.createElement("div");
    outgoingDetails.className = "details";

    const outgoingParagraph = document.createElement("p");
    outgoingParagraph.textContent = `${message.msg}`;

    outgoingDetails.appendChild(outgoingParagraph);
    outgoingChat.appendChild(outgoingDetails);
    chatBox.appendChild(outgoingChat);
  } else {
    // Handle incoming message
    const incomingChat = document.createElement("div");
    incomingChat.className = "chat incoming";

    imageUser.src = `${data.incoming_user.image}`;

    const incomingImage = document.createElement("img");
    incomingImage.src = `${data.incoming_user.image}`;
    incomingImage.alt = "user image";

    const incomingDetails = document.createElement("div");
    incomingDetails.className = "details";

    const incomingParagraph = document.createElement("p");
    incomingParagraph.textContent = `${message.msg}`;

    incomingDetails.appendChild(incomingParagraph);
    incomingChat.appendChild(incomingImage);
    incomingChat.appendChild(incomingDetails);
    chatBox.appendChild(incomingChat);
  }
}
