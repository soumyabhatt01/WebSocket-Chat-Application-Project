const username = prompt("Enter your name:") || "Anonymous";
const ws = new WebSocket("ws://localhost:8080");

// ✅ DOM references
const chat = document.getElementById("chat");
const usersDiv = document.getElementById("users");
const emojiPicker = document.getElementById("emojiPicker");
const emojiBtn = document.getElementById("emojiBtn");

// 🎉 Emoji list
const emojis = ["😀","😁","😂","🤣","😅","😊","😍","😘","😎","🤔","😢","😭","😡","👍","👎","🙏","💪","🔥","🎉","💖"];
if (emojiPicker) {
  emojis.forEach(e => {
    const span = document.createElement("span");
    span.textContent = e;
    span.onclick = () => {
      document.getElementById("message").value += e;
      emojiPicker.style.display = "none";
    };
    emojiPicker.appendChild(span);
  });

  emojiBtn.onclick = () => {
    emojiPicker.style.display =
      emojiPicker.style.display === "flex" ? "none" : "flex";
  };
}

// 🔌 When connected
ws.onopen = () => {
  ws.send(JSON.stringify({ type: "join", sender: username }));
  console.log("Connected to server");
};

// 📩 Handle messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "users") {
    usersDiv.innerHTML = "";
    data.list.forEach(u => {
      const userDiv = document.createElement("div");
      userDiv.textContent = u;
      usersDiv.appendChild(userDiv);
    });
  } else {
    const msg = document.createElement("div");
    msg.classList.add("msg");
    msg.classList.add(data.sender === username ? "me" : "other");

    // 🗂️ File messages (detect media type)
    if (data.type === "file") {
      const mime = data.content.split(";")[0].split(":")[1];
      
      // 🖼️ Image preview
      if (mime.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = data.content;
        img.style.maxWidth = "200px";
        img.style.borderRadius = "8px";
        msg.innerHTML = `<b>${data.sender}:</b><br>`;
        msg.appendChild(img);

      // 🎧 Audio preview
      } else if (mime.startsWith("audio/")) {
        const audio = document.createElement("audio");
        audio.src = data.content;
        audio.controls = true;
        msg.innerHTML = `<b>${data.sender}:</b><br>`;
        msg.appendChild(audio);

      // 🎥 Video preview
      } else if (mime.startsWith("video/")) {
        const video = document.createElement("video");
        video.src = data.content;
        video.controls = true;
        video.style.maxWidth = "250px";
        msg.innerHTML = `<b>${data.sender}:</b><br>`;
        msg.appendChild(video);

      // 📄 Other file types (download link)
      } else {
        const link = document.createElement("a");
        link.href = data.content;
        link.download = data.fileName;
        link.textContent = `📎 ${data.sender}: ${data.fileName}`;
        link.className = "file-link";
        msg.appendChild(link);
      }

    // 💬 Normal text messages
    } else {
      msg.textContent = `${data.sender}: ${data.content}`;
    }

    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }
};

// ✉️ Sending message
document.getElementById("send").onclick = () => {
  const messageBox = document.getElementById("message");
  const msg = messageBox.value.trim();
  if (msg) {
    ws.send(JSON.stringify({ type: "text", sender: username, content: msg }));
  }
  messageBox.value = "";
};

// 📎 File sharing
document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function() {
    const fileData = reader.result;
    ws.send(JSON.stringify({
      type: "file",
      sender: username,
      content: fileData,
      fileName: file.name
    }));
  };
  reader.readAsDataURL(file);
});
