import { AuthManager } from './auth.js';
import { ThemeManager } from './theme.js';
import { UIManager } from './ui.js';
import { ModelParamsManager } from './model-params.js';
import { PrepromptsManager } from './preprompts.js';
import { ChatManager } from './chat.js';
import { utils } from './utils.js';

class App {
  constructor() {
    this.state = {
      authenticated: false,
      preprompts: [],
      currentPreprompt: "",
      modelParams: {
        temperature: 0.7,
        maxTokens: 512,
        topP: 0.95,
        contextSize: 2048,
        repeatPenalty: 1.1,
        seed: -1,
      },
      theme: localStorage.getItem("theme") || "light",
    };

    this.managers = {};
  }

  async init() {
    console.log("🚀 Initialisation de l'application");
    
    // Initialiser les gestionnaires
    this.managers.auth = new AuthManager(this);
    this.managers.theme = new ThemeManager(this);
    this.managers.ui = new UIManager(this);
    this.managers.modelParams = new ModelParamsManager(this);
    this.managers.preprompts = new PrepromptsManager(this);
    this.managers.chat = new ChatManager(this);

    // Appliquer le thème
    this.managers.theme.apply(this.state.theme);

    // Vérifier l'authentification
    await this.managers.auth.checkAuthentication();

    // Initialiser les événements
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.managers.auth.initializeListeners();
    this.managers.theme.initializeListeners();
    this.managers.ui.initializeListeners();
    this.managers.modelParams.initializeListeners();
    this.managers.preprompts.initializeListeners();
    this.managers.chat.initializeListeners();
  }

  async loadInitialData() {
    try {
      await Promise.all([
        this.managers.preprompts.loadPreprompts(),
        this.managers.modelParams.loadParams()
      ]);
      console.log("✅ Données initiales chargées");
      this.managers.modelParams.updateStatusDisplay();
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  }

  // Getters pour accéder aux gestionnaires
  get auth() { return this.managers.auth; }
  get theme() { return this.managers.theme; }
  get ui() { return this.managers.ui; }
  get modelParams() { return this.managers.modelParams; }
  get preprompts() { return this.managers.preprompts; }
  get chat() { return this.managers.chat; }
}

// Instance globale
const app = new App();

// Initialisation au chargement
document.addEventListener("DOMContentLoaded", () => app.init());

// Export pour les autres modules
export default app;