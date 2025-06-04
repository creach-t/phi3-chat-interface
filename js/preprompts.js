import { utils } from './utils.js';

export class PrepromptsManager {
  constructor(app) {
    this.app = app;
    this.suggestions = [
      {
        title: "Assistant français",
        content: "Tu es un assistant IA qui répond toujours en français de manière polie et professionnelle.",
      },
      {
        title: "Expert en code",
        content: "Tu es un expert en programmation. Fournis des réponses techniques précises avec des exemples de code.",
      },
      {
        title: "Tuteur pédagogique",
        content: "Tu es un tuteur patient qui explique les concepts de manière simple avec des exemples concrets.",
      },
      {
        title: "Créatif et artistique",
        content: "Tu es un assistant créatif qui aide avec l'écriture, les idées artistiques et l'inspiration.",
      },
      {
        title: "Analyste de données",
        content: "Tu es un expert en analyse de données qui aide à interpréter les chiffres et les tendances.",
      },
      {
        title: "Coach personnel",
        content: "Tu es un coach bienveillant qui aide à atteindre les objectifs personnels et professionnels.",
      },
    ];
  }

  initializeListeners() {
    document.getElementById("add-preprompt-btn")?.addEventListener("click", () => this.showModal());
    document.getElementById("close-modal")?.addEventListener("click", () => this.hideModal());
    document.getElementById("cancel-preprompt")?.addEventListener("click", () => this.hideModal());
    document.getElementById("preprompt-form")?.addEventListener("submit", (e) => this.handleAddPreprompt(e));
    document.getElementById("preprompt-select")?.addEventListener("change", () => this.handlePrepromptChange());

    this.loadSuggestions();
  }

  async loadPreprompts() {
    try {
      const response = await fetch("/api/preprompts", { credentials: "include" });
      const preprompts = await response.json();
      this.app.state.preprompts = preprompts;
      this.updateUI();
      console.log("✅ Preprompts chargés:", preprompts.length);
    } catch (error) {
      console.error("Erreur lors du chargement des preprompts:", error);
    }
  }

  updateUI() {
    const select = document.getElementById("preprompt-select");
    const list = document.getElementById("preprompts-list");

    // Mettre à jour le select
    select.innerHTML = '<option value="">Aucun preprompt</option>';
    this.app.state.preprompts.forEach((preprompt) => {
      const option = document.createElement("option");
      option.value = preprompt.id;
      option.textContent = preprompt.name;
      select.appendChild(option);
    });

    // Mettre à jour la liste
    list.innerHTML = "";
    this.app.state.preprompts.forEach((preprompt) => {
      const item = this.createPrepromptItem(preprompt);
      list.appendChild(item);
    });
  }

  createPrepromptItem(preprompt) {
    const item = document.createElement("div");
    item.className = "preprompt-item";
    item.innerHTML = `
      <div class="preprompt-name">${utils.escapeHtml(preprompt.name)}</div>
      <div class="preprompt-content">${utils.escapeHtml(preprompt.content)}</div>
      <div class="preprompt-actions">
        <button class="btn-icon" onclick="window.selectPreprompt('${preprompt.id}')">
          <i class="fas fa-check"></i>
        </button>
        <button class="btn-icon delete" onclick="window.deletePreprompt('${preprompt.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    return item;
  }

  selectPreprompt(id) {
    document.getElementById("preprompt-select").value = id;
    this.handlePrepromptChange();
    this.app.ui.closePrepromptsSidebar();
  }

  async deletePreprompt(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce preprompt ?")) return;

    try {
      await fetch(`/api/preprompts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      await this.loadPreprompts();
      this.app.ui.showNotification("Preprompt supprimé !", "success");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      this.app.ui.showNotification("Erreur lors de la suppression", "error");
    }
  }

  handlePrepromptChange() {
    const select = document.getElementById("preprompt-select");
    const currentDiv = document.getElementById("current-preprompt");

    const selectedId = select.value;
    if (selectedId) {
      const preprompt = this.app.state.preprompts.find((p) => p.id === selectedId);
      if (preprompt) {
        this.app.state.currentPreprompt = preprompt.content;
        currentDiv.textContent = `Actuel: ${preprompt.name}`;
      }
    } else {
      this.app.state.currentPreprompt = "";
      currentDiv.textContent = "";
    }
  }

  loadSuggestions() {
    const container = document.getElementById("preprompt-suggestions");
    if (!container) return;

    container.innerHTML = "";
    this.suggestions.forEach((suggestion) => {
      const card = document.createElement("div");
      card.className = "suggestion-card";
      card.innerHTML = `
        <div class="suggestion-title">${utils.escapeHtml(suggestion.title)}</div>
        <div class="suggestion-content">${utils.escapeHtml(suggestion.content)}</div>
      `;
      card.onclick = () => {
        document.getElementById("preprompt-name").value = suggestion.title;
        document.getElementById("preprompt-content").value = suggestion.content;
        window.updateCharCount(document.getElementById("preprompt-content"));
      };
      container.appendChild(card);
    });
  }

  showModal() {
    document.getElementById("preprompt-modal").classList.remove("hidden");
    document.getElementById("preprompt-name").focus();
  }

  hideModal() {
    document.getElementById("preprompt-modal").classList.add("hidden");
    document.getElementById("preprompt-form").reset();
    window.updateCharCount(document.getElementById("preprompt-content"));
  }

  async handleAddPreprompt(e) {
    e.preventDefault();

    const name = document.getElementById("preprompt-name").value.trim();
    const content = document.getElementById("preprompt-content").value.trim();

    if (!name || !content) {
      this.app.ui.showNotification("Nom et contenu requis", "error");
      return;
    }

    try {
      await fetch("/api/preprompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, content }),
      });

      await this.loadPreprompts();
      this.hideModal();
      this.app.ui.showNotification("Preprompt créé !", "success");
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      this.app.ui.showNotification("Erreur lors de la création", "error");
    }
  }
}