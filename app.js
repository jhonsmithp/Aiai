// IMPORTANT: Put your Vercel API URL here.
const API_URL = "https://aiai-mu.vercel.app/api/chat";

const chat = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const send = document.getElementById("send");
const clearBtn = document.getElementById("clear");
const web = document.getElementById("web");

let history = [];

function add(role, text) {
  const row = document.createElement("div");
  row.className = "row " + (role === "user" ? "user" : "ai");

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  row.appendChild(bubble);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = input.value.trim();

  if (!text) return;

  // Show user's message
  add("user", text);

  history.push({
    role: "user",
    content: text
  });

  input.value = "";

  send.disabled = true;
  send.textContent = "...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: history,
        web_search: web.checked
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Request failed"
      );
    }

    const answer =
      data.answer || "কোনো উত্তর পাওয়া যায়নি।";

    add("assistant", answer);

    history.push({
      role: "assistant",
      content: answer
    });

  } catch (error) {
    add(
      "assistant",
      "সমস্যা: " + error.message
    );
  }

  send.disabled = false;
  send.textContent = "Send";
  input.focus();
});

clearBtn.addEventListener("click", () => {
  history = [];
  chat.innerHTML = "";

  add(
    "assistant",
    "চ্যাট পরিষ্কার হয়েছে। আবার বলো।"
  );
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});
