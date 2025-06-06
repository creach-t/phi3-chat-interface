export class ChatManager {
  constructor(app) {
    this.app = app;
  }

  initializeListeners() {
    document
      .getElementById("send-btn")
      ?.addEventListener("click", () => this.sendMessage());
    document
      .getElementById("message-input")
      ?.addEventListener("keypress", (e) => this.handleKeypress(e));
    document
      .getElementById("message-input")
      ?.addEventListener("input", (e) => this.handleInput(e));
  }

  handleKeypress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  handleInput(e) {
    const input = e.target;
    const sendBtn = document.getElementById("send-btn");

    // Auto-resize
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";

    // Enable/disable send button
    sendBtn.disabled = !input.value.trim();
  }

  async sendMessage() {
    const input = document.getElementById("message-input");
    const message = input.value.trim();

    if (!message) return;

    // Afficher le message de l'utilisateur
    this.addMessage("user", message);

    // Vider l'input
    input.value = "";
    input.style.height = "auto";
    document.getElementById("send-btn").disabled = true;

    // Afficher l'indicateur de frappe
    this.showTypingIndicator();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message,
          preprompt: this.app.state.currentPreprompt,
          modelParams: this.app.state.modelParams,
        }),
      });

      const data = await response.json();
      this.hideTypingIndicator();

      if (data.response) {
        this.addMessage("assistant", data.response);
      } else {
        this.addMessage(
          "assistant",
          "Désolé, je n'ai pas pu générer une réponse. " + (data.error || "")
        );
      }
    } catch (error) {
      this.hideTypingIndicator();
      console.error("Erreur lors de l'envoi du message:", error);
      this.addMessage("assistant", "Erreur de connexion au serveur.");
    }
  }

  addMessage(type, content) {
    const messagesContainer = document.getElementById("chat-messages");

    // Masquer le message de bienvenue s'il existe
    const welcomeMessage = messagesContainer.querySelector(".welcome-message");
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML =
      type === "user"
        ? '<i class="fas fa-user"></i>'
        : '<i class="fas fa-robot"></i>';

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.textContent = content;

    const timeDiv = document.createElement("div");
    timeDiv.className = "message-time";
    timeDiv.textContent = new Date().toLocaleTimeString();

    messageDiv.appendChild(avatar);
    const contentWrapper = document.createElement("div");
    contentWrapper.appendChild(contentDiv);
    contentWrapper.appendChild(timeDiv);
    messageDiv.appendChild(contentWrapper);

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  showTypingIndicator() {
    document.getElementById("typing-indicator").classList.remove("hidden");
  }

  hideTypingIndicator() {
    document.getElementById("typing-indicator").classList.add("hidden");
  }
}
