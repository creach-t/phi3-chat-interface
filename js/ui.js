export class UIManager {
  constructor(app) {
    this.app = app;
  }

  initializeListeners() {
    // Sidebars
    document
      .getElementById("settings-btn")
      ?.addEventListener("click", () => this.toggleSettingsSidebar());
    document
      .getElementById("preprompts-btn")
      ?.addEventListener("click", () => this.togglePrepromptsSidebar());
    document
      .getElementById("close-settings")
      ?.addEventListener("click", () => this.closeSettingsSidebar());
    document
      .getElementById("close-preprompts")
      ?.addEventListener("click", () => this.closePrepromptsSidebar());

    // Clics à l'extérieur
    document.addEventListener("click", (e) => this.handleOutsideClick(e));
  }

  toggleSettingsSidebar() {
    const sidebar = document.getElementById("settings-sidebar");
    const prepromptsSidebar = document.getElementById("preprompts-sidebar");

    if (!prepromptsSidebar.classList.contains("hidden")) {
      prepromptsSidebar.classList.add("hidden");
    }

    sidebar.classList.toggle("hidden");
  }

  togglePrepromptsSidebar() {
    const sidebar = document.getElementById("preprompts-sidebar");
    const settingsSidebar = document.getElementById("settings-sidebar");

    if (!settingsSidebar.classList.contains("hidden")) {
      settingsSidebar.classList.add("hidden");
    }

    sidebar.classList.toggle("hidden");
  }

  closeSettingsSidebar() {
    document.getElementById("settings-sidebar").classList.add("hidden");
  }

  closePrepromptsSidebar() {
    document.getElementById("preprompts-sidebar").classList.add("hidden");
  }

  handleOutsideClick(e) {
    const settingsSidebar = document.getElementById("settings-sidebar");
    const prepromptsSidebar = document.getElementById("preprompts-sidebar");
    const settingsBtn = document.getElementById("settings-btn");
    const prepromptsBtn = document.getElementById("preprompts-btn");

    if (
      !settingsSidebar.classList.contains("hidden") &&
      !settingsSidebar.contains(e.target) &&
      !settingsBtn.contains(e.target)
    ) {
      settingsSidebar.classList.add("hidden");
    }

    if (
      !prepromptsSidebar.classList.contains("hidden") &&
      !prepromptsSidebar.contains(e.target) &&
      !prepromptsBtn.contains(e.target)
    ) {
      prepromptsSidebar.classList.add("hidden");
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${
        type === "success"
          ? "#10b981"
          : type === "error"
          ? "#ef4444"
          : "#3b82f6"
      };
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      z-index: 9999;
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}
