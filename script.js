let chatsContainer = document.querySelector(".chats-container");
let container = chatsContainer;
let promptform = document.querySelector(".prompt-form");
let promptinput = document.querySelector(".prompt-input");
let fileInput = document.querySelector("#file-input");
let addBtn = document.getElementById("add-file-btn");
let fileUploadWrapper = document.querySelector(".file-upload-wrapper");
let themeToggle = document.querySelector("#theme-toggle-btn");

// API setup
let API_KEY = config.GEMINI_API_KEY;
let API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

let typingInterval , controller;
let chatHistory = [];
const userData = { message: "", file: {} };

// function to create message element
function createMsgElement(content, ...classes) {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
}

const scrollToBottom = () => {
  setTimeout(() => {
    const lastMessage = chatsContainer.lastElementChild;
    if (lastMessage) {
      lastMessage.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, 100);
};

// typing effect for bot response
function typingEffect(text, textElement, botMsgdiv) {
  textElement.textContent = "";
  const words = text.split(" ");
  let wordIndex = 0;

  typingInterval = setInterval(() => {
    if (wordIndex < words.length) {
      textElement.textContent +=
        (wordIndex === 0 ? "" : " ") + words[wordIndex++];
        scrollToBottom();
      } else {
        clearInterval(typingInterval);
        botMsgdiv.classList.remove("loading");
        document.body.classList.remove("bot-responding")
    }
  }, 40);
}

// generate bot response
async function generateResponse(botMsgdiv) {
  const textElement = botMsgdiv.querySelector(".message-text");
  controller = new AbortController();

  // user + file data into chat history
  chatHistory.push({
    role: "user",
    parts: [
      { text: userData.message },
      ...(userData.file.data
        ? [
            {
              inline_data: (({ fileName, isImage, ...rest }) => rest)(
                userData.file
              ),
            },
          ]
        : []),
    ],
  });

  try {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
       signal: controller.signal
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);
    console.log(data);

    // process the response text and  type effect
    const responseText = data.candidates[0].content.parts[0].text
      .replace(/(\*\*\*(.*?)\*\*\*)|(\*\_?\_?\*)|(\*\*)|(\*)/g, "$2")
      .trim();
    typingEffect(responseText, textElement, botMsgdiv);

    chatHistory.push({ role: "model", parts: [{ text: responseText }] });
    console.log(chatHistory);
  } catch (error) {
    textElement.style.color = "#d62939";
    textElement.textContent = error.name === "AbortError" ? "response generation stopped.":error.message;
    botMsgdiv.classList.remove("loading");
    document.body.classList.remove("bot-responding")
  } finally{
    userData.file={};
  }
}

// handle form submission
const handleFormSubmit = function (e) {
  e.preventDefault();
  const userMessage = promptinput.value.trim();
  if (!userMessage) return;
  promptinput.value = "";
  userData.message = userMessage; // store message for later
  document.body.classList.add("bot-responding", "chats-active")
  fileUploadWrapper.classList.remove(
    "active",
    "img-attached",
    "file-attached"
  );

  // user message
  const userMsgHTML = `
  <p class="message-text"></p>
  ${userData.file.data
    ? (
        userData.file.isImage
          ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />`
          : `<p class="file-attachment">
                <span class="material-symbols-rounded">description</span>
                ${userData.file.fileName}
             </p>`
      ): ""}`

  const userMsgdiv = createMsgElement(userMsgHTML, "user-message");
  userMsgdiv.querySelector(".message-text").textContent = userMessage;
  chatsContainer.appendChild(userMsgdiv);
  scrollToBottom();

  // bot message placeholder
  setTimeout(() => {
    const botMsgHTML = `
      <img class="avtar" src="./icon/freepik__upload__13902.png" alt="Bot">
      <p class="message-text">just a sec..</p>`;
    const botMsgdiv = createMsgElement(botMsgHTML, "bot-message", "loading");
    chatsContainer.appendChild(botMsgdiv);
    scrollToBottom();
    generateResponse(botMsgdiv);
  }, 600);
};

// file input log
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  console.log(file);
});

// file input preview + store base64 fix 
fileInput.addEventListener("change", () => {
  let file = fileInput.files[0];
  if (!file) return;

  const isImage = file.type.startsWith("image/");
  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = (e) => {
    fileInput.value = "";
    const base64String = e.target.result.split(",")[1];

    userData.file = {
      mime_type: file.type,
      data: base64String,
      fileName: file.name,
      isImage,
    };

    // preview
    fileUploadWrapper.querySelector(".file-preview").src = e.target.result;
    fileUploadWrapper.classList.add(
      "active",
      isImage ? "img-attached" : "file-attached"
    );
  };
});

// cancel file upload
document.querySelector("#cancel-file-btn").addEventListener("click", () => {
  userData.file = {}; 
  fileUploadWrapper.classList.remove(
    "active",
    "img-attached",
    "file-attached"
  );
});

//stop ongoing bot response
document.querySelector("#stop-response-btn").addEventListener("click", () => {
  userData.file = {}; 
  controller?.abort();
  clearInterval(typingInterval)
  chatsContainer.querySelector(".bot-message.loading").classList.remove("loading");
  document.body.classList.remove("bot-responding")
});

// Delete chat
document.querySelector("#delete-chats-btn").addEventListener("click", ()=>{
chatHistory.length = 0;
chatsContainer.innerHTML = "";
document.body.classList.remove("bot-responding","chats-active")
});

// suggestion list
document.querySelectorAll(".suggestions-list").forEach(item => {
  item.addEventListener("click",()=>{
    promptinput.value= item.querySelector(".text").textContent;
    promptform.dispatchEvent(new Event("submit"));
  });
});

// theme toggle light/dark
themeToggle.addEventListener("click", ()=>{
  const isLightTheme = document.body.classList.toggle("light-theme");
  localStorage.setItem("themeColor", isLightTheme ? "light_mode":"dark_mode");
  themeToggle.textContent = isLightTheme? "dark_mode" : "light_mode";
});
//initial theme
const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", isLightTheme);
 themeToggle.textContent = isLightTheme? "dark_mode" : "light_mode";

addBtn.addEventListener("click", () => fileInput.click());
promptform.addEventListener("submit", handleFormSubmit);
