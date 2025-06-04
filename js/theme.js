export class ThemeManager {
  constructor(app) {
    this.app = app;
  }

  initializeListeners() {
    document
      .getElementById("theme-toggle")
      ?.addEventListener("click", () => this.toggle());
  }

  apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    this.app.state.theme = theme;
    localStorage.setItem("theme", theme);

    const themeIcon = document
      .getElementById("theme-toggle")
      ?.querySelector("i");
    if (themeIcon) {
      themeIcon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
    }
  }

  toggle() {
    const newTheme = this.app.state.theme === "light" ? "dark" : "light";
    this.apply(newTheme);
  }
}
