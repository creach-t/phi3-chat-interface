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
      statusElement.textContent = `T: ${this.app.state.modelParams.temperature} | Tokens: ${this.app.state.modelParams.maxTokens}`;
    }
  }

  async loadParams() {
    try {
      const response = await fetch("/api/model-params", {
        credentials: "include",
      });
      const params = await response.json();
      this.app.state.modelParams = params;
      this.updateUI();
      console.log("✅ Paramètres du modèle chargés:", params);
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
    }
  }

  updateUI() {
    document.getElementById("temperature-slider").value =
      this.app.state.modelParams.temperature;
    document.getElementById("temperature-value").textContent =
      this.app.state.modelParams.temperature;

    document.getElementById("max-tokens-slider").value =
      this.app.state.modelParams.maxTokens;
    document.getElementById("max-tokens-value").textContent =
      this.app.state.modelParams.maxTokens;

    document.getElementById("top-p-slider").value =
      this.app.state.modelParams.topP;
    document.getElementById("top-p-value").textContent =
      this.app.state.modelParams.topP;

    document.getElementById("context-size-slider").value =
      this.app.state.modelParams.contextSize;
    document.getElementById("context-size-value").textContent =
      this.app.state.modelParams.contextSize;

    document.getElementById("repeat-penalty-slider").value =
      this.app.state.modelParams.repeatPenalty;
    document.getElementById("repeat-penalty-value").textContent =
      this.app.state.modelParams.repeatPenalty;

    document.getElementById("seed-input").value =
      this.app.state.modelParams.seed;
  }

  async saveParams() {
    try {
      const response = await fetch("/api/model-params", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(this.app.state.modelParams),
      });

      const params = await response.json();
      this.app.state.modelParams = params;
      this.updateStatusDisplay();
      this.app.ui.showNotification("Paramètres sauvegardés !", "success");
      console.log("✅ Paramètres sauvegardés:", params);
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

      const params = await response.json();
      this.app.state.modelParams = params;
      this.updateUI();
      this.updateStatusDisplay();
      this.app.ui.showNotification("Paramètres réinitialisés !", "success");
      console.log("✅ Paramètres réinitialisés:", params);
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      this.app.ui.showNotification(
        "Erreur lors de la réinitialisation",
        "error"
      );
    }
  }
}
