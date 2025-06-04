import app from "./app.js";

// Fonctions globales nécessaires pour les événements inline du HTML
window.selectPreprompt = (id) => app.preprompts.selectPreprompt(id);
window.deletePreprompt = (id) => app.preprompts.deletePreprompt(id);
window.showSettings = () => app.ui.toggleSettingsSidebar();
window.showPreprompts = () => app.ui.togglePrepromptsSidebar();

window.updateCharCount = (textarea) => {
  const count = textarea.value.length;
  const countSpan = document.getElementById("char-count");
  const indicator = document.getElementById("length-indicator");

  if (countSpan) countSpan.textContent = count;

  if (indicator) {
    if (count <= 200) {
      indicator.textContent = "✓ Optimal";
      indicator.className = "length-good";
    } else if (count <= 500) {
      indicator.textContent = "⚠ Acceptable";
      indicator.className = "length-warning";
    } else {
      indicator.textContent = "✗ Trop long";
      indicator.className = "length-error";
    }
  }
};
