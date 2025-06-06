export class ModelParamsManager {
  constructor(app) {
    this.app = app;
  }

  initializeListeners() {
    // Sliders
    const sliders = [
      "temperature",
      "max-tokens",
      "top-p",
      "context-size",
      "repeat-penalty",
    ];
    sliders.forEach((param) => {
      const slider = document.getElementById(`${param}-slider`);
      const valueDisplay = document.getElementById(`${param}-value`);

      if (slider && valueDisplay) {
        slider.addEventListener("input", (e) => {
          valueDisplay.textContent = e.target.value;
          this.updateParam(param, parseFloat(e.target.value));
        });
      }
    });

    // Seed input
    document.getElementById("seed-input")?.addEventListener("change", (e) => {
      this.updateParam("seed", parseInt(e.target.value) || -1);
    });

    // Boutons
    document
      .getElementById("save-params")
      ?.addEventListener("click", () => this.saveParams());
    document
      .getElementById("reset-params")
      ?.addEventListener("click", () => this.resetParams());
  }

  updateParam(param, value) {
    const paramMap = {
      temperature: "temperature",
      "max-tokens": "maxTokens",
      "top-p": "topP",
      "context-size": "contextSize",
      "repeat-penalty": "repeatPenalty",
      seed: "seed",
    };

    if (paramMap[param]) {
      this.app.state.modelParams[paramMap[param]] = value;
      this.updateStatusDisplay();
    }
  }

  updateStatusDisplay() {
    const statusElement = document.getElementById("current-params");
    if (statusElement) {
      console.log("Params to display:", this.app.state.modelParams);

      statusElement.textContent = `T: ${this.app.state.modelParams.temperature} | Tokens: ${this.app.state.modelParams.maxTokens}`;
    }
  }

  async loadParams() {
    try {
      const response = await fetch("/api/model-params", {
        credentials: "include",
      });
      const data = await response.json();

      // 🔧 FIX: Extract modelParams from the response
      this.app.state.modelParams = data.modelParams || data;

      this.updateUI();
      console.log(
        "✅ Paramètres du modèle chargés:",
        this.app.state.modelParams
      );
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
    }
  }

  updateUI() {
    // 🔧 FIX: Add safety checks for modelParams
    if (!this.app.state.modelParams) {
      console.warn("No modelParams to update UI with");
      return;
    }

    const params = this.app.state.modelParams;

    // Update sliders and displays with safety checks
    this.updateSlider("temperature", params.temperature);
    this.updateSlider("max-tokens", params.maxTokens, "max-tokens");
    this.updateSlider("top-p", params.topP, "top-p");
    this.updateSlider("context-size", params.contextSize, "context-size");
    this.updateSlider("repeat-penalty", params.repeatPenalty, "repeat-penalty");

    // Update seed input
    const seedInput = document.getElementById("seed-input");
    if (seedInput) {
      seedInput.value = params.seed || -1;
    }

    // Update status display
    this.updateStatusDisplay();
  }

  // 🔧 NEW: Helper method to safely update sliders
  updateSlider(paramName, value, sliderId = null) {
    const sliderElement = document.getElementById(
      `${sliderId || paramName}-slider`
    );
    const valueElement = document.getElementById(
      `${sliderId || paramName}-value`
    );

    if (sliderElement && value !== undefined) {
      sliderElement.value = value;
    }
    if (valueElement && value !== undefined) {
      valueElement.textContent = value;
    }
  }

  async saveParams() {
    try {
      const response = await fetch("/api/model-params", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(this.app.state.modelParams),
      });

      const data = await response.json();

      // 🔧 FIX: Handle both success and error responses
      if (data.error) {
        console.error("Server error:", data);
        this.app.ui.showNotification(`Erreur: ${data.error}`, "error");
        return;
      }

      // Extract modelParams from successful response
      this.app.state.modelParams = data.modelParams || data;
      this.updateUI();
      this.updateStatusDisplay();
      this.app.ui.showNotification("Paramètres sauvegardés !", "success");
      console.log("✅ Paramètres sauvegardés:", this.app.state.modelParams);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      this.app.ui.showNotification("Erreur lors de la sauvegarde", "error");
    }
  }

  async resetParams() {
    try {
      const response = await fetch("/api/model-params/reset", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      // 🔧 FIX: Handle both success and error responses
      if (data.error) {
        console.error("Server error:", data);
        this.app.ui.showNotification(`Erreur: ${data.error}`, "error");
        return;
      }

      // Extract modelParams from successful response
      this.app.state.modelParams = data.modelParams || data;
      this.updateUI();
      this.updateStatusDisplay();
      this.app.ui.showNotification("Paramètres réinitialisés !", "success");
      console.log("✅ Paramètres réinitialisés:", this.app.state.modelParams);
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      this.app.ui.showNotification(
        "Erreur lors de la réinitialisation",
        "error"
      );
    }
  }
}
