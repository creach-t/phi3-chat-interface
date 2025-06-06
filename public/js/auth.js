export class AuthManager {
  constructor(app) {
    this.app = app;
  }

  initializeListeners() {
    document.getElementById("login-form")?.addEventListener("submit", (e) => this.handleLogin(e));
    document.getElementById("logout-btn")?.addEventListener("click", () => this.handleLogout());
  }

  async checkAuthentication() {
    try {
      const response = await fetch("/api/check-auth", { credentials: "include" });
      const data = await response.json();
      
      if (data.authenticated) {
        this.app.state.authenticated = true;
        this.showChatPage();
        await this.app.loadInitialData();
      } else {
        this.showLoginPage();
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'authentification:", error);
      this.showLoginPage();
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorDiv = document.getElementById("login-error");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        this.app.state.authenticated = true;
        this.showChatPage();
        await this.app.loadInitialData();
      } else {
        errorDiv.textContent = data.error || "Erreur de connexion";
        errorDiv.style.display = "block";
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      errorDiv.textContent = "Erreur de connexion au serveur";
      errorDiv.style.display = "block";
    }
  }

  async handleLogout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      this.app.state.authenticated = false;
      this.showLoginPage();
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  }

  showLoginPage() {
    document.getElementById("login-page").classList.remove("hidden");
    document.getElementById("chat-page").classList.add("hidden");
  }

  showChatPage() {
    document.getElementById("login-page").classList.add("hidden");
    document.getElementById("chat-page").classList.remove("hidden");
  }
}