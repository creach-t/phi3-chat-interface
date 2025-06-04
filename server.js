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

// Route pour le chat
app.post("/api/chat", requireAuth, (req, res) => {
  const { message, preprompt = "" } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message requis" });
  }

  // Construire le prompt complet
  const fullPrompt = preprompt ? `${preprompt}\n\nUser: ${message}` : message;

  // Lancer llama.cpp
  const llamaProcess = spawn(config.llamaCppPath, [
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
  ]);

  let response = "";
  let errorOutput = "";

  llamaProcess.stdout.on("data", (data) => {
    response += data.toString();
  });

  llamaProcess.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  llamaProcess.on("close", (code) => {
    if (code === 0) {
      // Nettoyer la réponse
      const cleanResponse = response
        .replace(/^.*?llama backend init.*?\n/s, "")
        .replace(/.*?main: load the model.*?\n/g, "")
        .replace(/.*?build:.*?\n/g, "")
        .replace(/llama_perf_context_print.*$/s, "")
        .trim();

      res.json({ response: cleanResponse });
    } else {
      console.error("Erreur llama.cpp:", errorOutput);
      res
        .status(500)
        .json({ error: "Erreur lors de la génération de la réponse" });
    }
  });

  // Timeout de 60 secondes
  setTimeout(() => {
    llamaProcess.kill();
    res.status(408).json({ error: "Timeout - réponse trop longue" });
  }, 60000);
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
