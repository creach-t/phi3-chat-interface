const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT;
const IP_ADDRESS = process.env.IP_ADDRESS;

// Configuration
const config = {
  username: "admin",
  passwordHash: "password123",
  llamaCppPath: "../../llama.cpp/build/bin/llama-cli",
  modelPath: "../../llama.cpp/models/Phi-3-mini-4k-instruct-Q2_K.gguf",
};

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  cors({
    origin: `http://${IP_ADDRESS}:${PORT}`,
    credentials: true,
  })
);
app.use(
  session({
    secret: "phi3-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24h
  })
);

// Charger les preprompts
function loadPreprompts() {
  try {
    if (fs.existsSync("preprompts.json")) {
      return JSON.parse(fs.readFileSync("preprompts.json", "utf8"));
    }
  } catch (error) {
    console.error("Erreur lors du chargement des preprompts:", error);
  }
  return [];
}

// Sauvegarder les preprompts
function savePreprompts(preprompts) {
  try {
    fs.writeFileSync("preprompts.json", JSON.stringify(preprompts, null, 2));
    return true;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des preprompts:", error);
    return false;
  }
}

// Middleware d'authentification
function requireAuth(req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    res.status(401).json({ error: "Non authentifié" });
  }
}

// Routes d'authentification
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (username === config.username && password === config.passwordHash) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Identifiants incorrects" });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get("/api/check-auth", (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

// Routes pour les preprompts
app.get("/api/preprompts", requireAuth, (req, res) => {
  const preprompts = loadPreprompts();
  res.json(preprompts);
});

app.post("/api/preprompts", requireAuth, (req, res) => {
  const { name, content } = req.body;

  if (!name || !content) {
    return res.status(400).json({ error: "Nom et contenu requis" });
  }

  const preprompts = loadPreprompts();
  const newPreprompt = {
    id: Date.now().toString(),
    name,
    content,
    createdAt: new Date().toISOString(),
  };

  preprompts.push(newPreprompt);

  if (savePreprompts(preprompts)) {
    res.json(newPreprompt);
  } else {
    res.status(500).json({ error: "Erreur lors de la sauvegarde" });
  }
});

app.delete("/api/preprompts/:id", requireAuth, (req, res) => {
  const preprompts = loadPreprompts();
  const filteredPreprompts = preprompts.filter((p) => p.id !== req.params.id);

  if (savePreprompts(filteredPreprompts)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// Route pour le chat (VERSION AVEC DÉTECTION AUTO DE FIN)
app.post("/api/chat", requireAuth, (req, res) => {
  const { message, preprompt = "" } = req.body;

  console.log("🚀 Nouvelle requête chat:", { message, preprompt });

  if (!message) {
    return res.status(400).json({ error: "Message requis" });
  }

  let responseSent = false;

  const sendResponse = (statusCode, data) => {
    if (!responseSent) {
      responseSent = true;
      console.log("📤 Envoi réponse:", { statusCode, data });
      res.status(statusCode).json(data);
    }
  };

  // Construire le prompt complet
  const fullPrompt = preprompt ? `${preprompt}\n\nUser: ${message}` : message;
  console.log("📝 Prompt final:", fullPrompt);

  // Arguments pour llama.cpp
  const args = [
    "-m",
    config.modelPath,
    "-p",
    fullPrompt,
    "-c",
    "2048",
    "-n",
    "512",
    "--temp",
    "0.7",
    "--no-display-prompt",
  ];

  console.log("🔧 Commande llama.cpp:", config.llamaCppPath, args);

  // Lancer llama.cpp
  const llamaProcess = spawn(config.llamaCppPath, args);

  let response = "";
  let errorOutput = "";
  let hasStartedGenerating = false;
  let lastChunkTime = Date.now();

  llamaProcess.stdout.on("data", (data) => {
    const chunk = data.toString();
    response += chunk;
    lastChunkTime = Date.now();

    console.log("📥 STDOUT chunk:", JSON.stringify(chunk));

    // Détecter le début de la génération de contenu utile
    if (!hasStartedGenerating && chunk.includes("<|assistant|>")) {
      hasStartedGenerating = true;
      console.log("✨ Début de génération détecté");
    }

    // Détecter la fin : prompt interactif ">" ou double saut de ligne
    if (
      hasStartedGenerating &&
      (chunk.includes("\n>") || chunk.endsWith(">\n") || chunk.trim() === ">")
    ) {
      console.log("🔚 Fin de génération détectée, arrêt du processus");
      llamaProcess.kill("SIGTERM");

      // Traiter et envoyer la réponse
      processAndSendResponse();
    }
  });

  llamaProcess.stderr.on("data", (data) => {
    const chunk = data.toString();
    errorOutput += chunk;

    // Ne logger que les erreurs importantes
    if (chunk.includes("error:") || chunk.includes("Error:")) {
      console.log("⚠️ STDERR:", chunk);
    }
  });

  const processAndSendResponse = () => {
    if (responseSent) return;

    // Nettoyer la réponse
    let cleanResponse = response
      // Supprimer tout jusqu'à <|assistant|>
      .replace(/^.*?<\|assistant\|>\s*/s, "")
      // Supprimer le prompt final et tout après
      .replace(/\n?>\s*$/s, "")
      .replace(/\n+>\s*$/s, "")
      // Nettoyer les espaces
      .trim();

    console.log("✨ Réponse nettoyée:", JSON.stringify(cleanResponse));

    if (cleanResponse && cleanResponse.length > 0) {
      sendResponse(200, { response: cleanResponse });
    } else {
      sendResponse(500, { error: "Réponse vide après nettoyage" });
    }
  };

  llamaProcess.on("close", (code) => {
    console.log("🔚 Processus fermé avec code:", code);

    if (!responseSent) {
      processAndSendResponse();
    }
  });

  llamaProcess.on("error", (error) => {
    console.error("💥 Erreur lors du lancement de llama.cpp:", error);
    sendResponse(500, {
      error: "Impossible de lancer le modèle: " + error.message,
    });
  });

  // Timeout de sécurité à 60 secondes
  const timeoutId = setTimeout(() => {
    if (!responseSent) {
      console.log("⏰ Timeout atteint");
      llamaProcess.kill("SIGKILL");
      sendResponse(408, { error: "Timeout - réponse trop longue" });
    }
  }, 60000);

  // Timeout additionnel basé sur l'inactivité (pas de nouveaux chunks depuis 10s)
  const inactivityTimeout = setInterval(() => {
    if (hasStartedGenerating && Date.now() - lastChunkTime > 10000) {
      console.log("💤 Inactivité détectée, arrêt du processus");
      llamaProcess.kill("SIGTERM");
      processAndSendResponse();
      clearInterval(inactivityTimeout);
    }
  }, 2000);

  llamaProcess.on("close", () => {
    clearTimeout(timeoutId);
    clearInterval(inactivityTimeout);
  });
});

// Route par défaut - servir l'index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Démarrer le serveur
app.listen(PORT, IP_ADDRESS, () => {
  console.log(`Serveur démarré sur http://${IP_ADDRESS}:${PORT}`);
  console.log("Identifiants par défaut:");
  console.log("Username: admin");
  console.log("Password: password123");
});

// Générer un nouveau hash de mot de passe (à exécuter une fois pour changer le mot de passe)
// bcrypt.hash('votre_nouveau_mot_de_passe', 10).then(hash => console.log('Nouveau hash:', hash));
