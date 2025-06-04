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
const PORT = process.env.PORT || 3000;
const IP_ADDRESS = process.env.IP_ADDRESS || "localhost";

// Configuration
const config = {
  username: "admin",
  passwordHash: "password123",
  llamaCppPath: "../../llama.cpp/build/bin/llama-cli",
  modelPath: "../../llama.cpp/models/Phi-3-mini-4k-instruct-Q2_K.gguf",
};

// Paramètres par défaut du modèle
const defaultModelParams = {
  temperature: 0.7,
  maxTokens: 512,
  topP: 0.95,
  contextSize: 2048,
  repeatPenalty: 1.1,
  seed: -1, // -1 pour aléatoire
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

// Charger les paramètres du modèle
function loadModelParams() {
  try {
    if (fs.existsSync("model-params.json")) {
      const saved = JSON.parse(fs.readFileSync("model-params.json", "utf8"));
      return { ...defaultModelParams, ...saved };
    }
  } catch (error) {
    console.error("Erreur lors du chargement des paramètres:", error);
  }
  return defaultModelParams;
}

// Sauvegarder les paramètres du modèle
function saveModelParams(params) {
  try {
    fs.writeFileSync("model-params.json", JSON.stringify(params, null, 2));
    return true;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des paramètres:", error);
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

  try {
    // Vérifier le nom d'utilisateur
    if (username !== config.username) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    // Vérifier le mot de passe (support hash bcrypt et mot de passe simple pour la transition)
    let passwordValid = false;
    
    if (config.passwordHash.startsWith('$2b

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

// Routes pour les paramètres du modèle
app.get("/api/model-params", requireAuth, (req, res) => {
  const params = loadModelParams();
  res.json(params);
});

app.post("/api/model-params", requireAuth, (req, res) => {
  const { temperature, maxTokens, topP, contextSize, repeatPenalty, seed } = req.body;

  // Validation des paramètres
  const params = {
    temperature: Math.max(0.1, Math.min(2.0, parseFloat(temperature) || defaultModelParams.temperature)),
    maxTokens: Math.max(1, Math.min(4096, parseInt(maxTokens) || defaultModelParams.maxTokens)),
    topP: Math.max(0.1, Math.min(1.0, parseFloat(topP) || defaultModelParams.topP)),
    contextSize: Math.max(256, Math.min(8192, parseInt(contextSize) || defaultModelParams.contextSize)),
    repeatPenalty: Math.max(0.8, Math.min(1.5, parseFloat(repeatPenalty) || defaultModelParams.repeatPenalty)),
    seed: parseInt(seed) || -1,
  };

  if (saveModelParams(params)) {
    res.json(params);
  } else {
    res.status(500).json({ error: "Erreur lors de la sauvegarde des paramètres" });
  }
});

// Reset des paramètres aux valeurs par défaut
app.post("/api/model-params/reset", requireAuth, (req, res) => {
  if (saveModelParams(defaultModelParams)) {
    res.json(defaultModelParams);
  } else {
    res.status(500).json({ error: "Erreur lors du reset" });
  }
});

// Route de chat améliorée avec paramètres dynamiques
app.post("/api/chat", requireAuth, (req, res) => {
  const { message, preprompt = "", modelParams } = req.body;

  console.log("🚀 DEBUT CHAT");
  console.log("Message:", message);
  console.log("Preprompt length:", preprompt.length);

  if (!message) {
    return res.status(400).json({ error: "Message requis" });
  }

  // Charger les paramètres (utiliser ceux envoyés ou ceux sauvegardés)
  const currentParams = modelParams || loadModelParams();
  console.log("🔧 Paramètres utilisés:", currentParams);

  let responseSent = false;

  const sendResponse = (statusCode, data) => {
    if (!responseSent) {
      responseSent = true;
      console.log("📤 ENVOI REPONSE:", statusCode);
      res.status(statusCode).json(data);
    }
  };

  const fullPrompt = preprompt.trim()
    ? `${preprompt.trim()}\n\nUser: ${message}\nAssistant:`
    : `User: ${message}\nAssistant:`;

  console.log("📝 Prompt final length:", fullPrompt.length);

  // Construire les arguments llama.cpp avec les paramètres dynamiques
  const args = [
    "-m", config.modelPath,
    "-p", fullPrompt,
    "-c", currentParams.contextSize.toString(),
    "-n", currentParams.maxTokens.toString(),
    "--temp", currentParams.temperature.toString(),
    "--top-p", currentParams.topP.toString(),
    "--repeat-penalty", currentParams.repeatPenalty.toString(),
    "--no-display-prompt"
  ];

  // Ajouter le seed si différent de -1
  if (currentParams.seed !== -1) {
    args.push("--seed", currentParams.seed.toString());
  }

  console.log("🔧 Arguments llama.cpp:", args);

  const llamaProcess = spawn(config.llamaCppPath, args);

  let response = "";
  let errorOutput = "";
  let chunkCount = 0;

  llamaProcess.stdout.on("data", (data) => {
    const chunk = data.toString();
    response += chunk;
    chunkCount++;

    console.log(`📥 CHUNK ${chunkCount}:`, JSON.stringify(chunk.substring(0, 50)));

    // Arrêt si on détecte la fin
    if (chunk.includes(">") || chunk.includes("User:") || chunk.includes("Assistant:")) {
      console.log("🔚 ARRET DETECTE");
      llamaProcess.kill("SIGTERM");
      processAndSendResponse();
    }
  });

  llamaProcess.stderr.on("data", (data) => {
    const chunk = data.toString();
    errorOutput += chunk;
    console.log("⚠️ STDERR:", chunk.substring(0, 100));
  });

  const processAndSendResponse = () => {
    if (responseSent) return;

    // Nettoyage amélioré de la réponse
    let cleanResponse = response
      .replace(/<\|assistant\|>/g, "")
      .replace(/<\|user\|>/g, "")
      .replace(/<\|system\|>/g, "")
      .replace(/<\|end\|>/g, "")
      .replace(/<\|endoftext\|>/g, "")
      .replace(/\n\n?>\s*$/s, "")
      .replace(/>\s*$/s, "")
      .replace(/\nUser:\s*$/s, "")
      .replace(/\nAssistant:\s*$/s, "")
      .replace(/(.{10,}?)\1+/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s{3,}/g, " ")
      .trim();

    console.log("✨ Réponse nettoyée:", JSON.stringify(cleanResponse.substring(0, 100)));

    if (cleanResponse && cleanResponse.length > 0) {
      sendResponse(200, { 
        response: cleanResponse,
        modelParams: currentParams 
      });
    } else {
      sendResponse(500, {
        error: "Réponse vide après nettoyage",
        debug: response.substring(0, 200),
      });
    }
  };

  llamaProcess.on("close", (code) => {
    console.log("🔚 CLOSE avec code:", code);
    if (!responseSent) {
      processAndSendResponse();
    }
  });

  llamaProcess.on("error", (error) => {
    console.error("💥 ERREUR:", error);
    sendResponse(500, { error: "Erreur: " + error.message });
  });

  // Timeout adaptatif basé sur maxTokens
  const timeout = Math.max(30000, currentParams.maxTokens * 100);
  setTimeout(() => {
    if (!responseSent) {
      console.log("⏰ TIMEOUT");
      llamaProcess.kill("SIGKILL");
      sendResponse(408, {
        error: "Timeout",
        debug: {
          responseLength: response.length,
          chunkCount,
          timeout: timeout,
        },
      });
    }
  }, timeout);
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
  console.log("Paramètres par défaut chargés:", loadModelParams());
});)) {
      // Hash bcrypt
      passwordValid = await bcrypt.compare(password, config.passwordHash);
    } else {
      // Mot de passe simple (pour compatibilité)
      passwordValid = password === config.passwordHash;
    }

    if (passwordValid) {
      req.session.authenticated = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Identifiants incorrects" });
    }
  } catch (error) {
    console.error('Erreur lors de l\'authentification:', error);
    res.status(500).json({ error: "Erreur serveur" });
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

// Routes pour les paramètres du modèle
app.get("/api/model-params", requireAuth, (req, res) => {
  const params = loadModelParams();
  res.json(params);
});

app.post("/api/model-params", requireAuth, (req, res) => {
  const { temperature, maxTokens, topP, contextSize, repeatPenalty, seed } = req.body;

  // Validation des paramètres
  const params = {
    temperature: Math.max(0.1, Math.min(2.0, parseFloat(temperature) || defaultModelParams.temperature)),
    maxTokens: Math.max(1, Math.min(4096, parseInt(maxTokens) || defaultModelParams.maxTokens)),
    topP: Math.max(0.1, Math.min(1.0, parseFloat(topP) || defaultModelParams.topP)),
    contextSize: Math.max(256, Math.min(8192, parseInt(contextSize) || defaultModelParams.contextSize)),
    repeatPenalty: Math.max(0.8, Math.min(1.5, parseFloat(repeatPenalty) || defaultModelParams.repeatPenalty)),
    seed: parseInt(seed) || -1,
  };

  if (saveModelParams(params)) {
    res.json(params);
  } else {
    res.status(500).json({ error: "Erreur lors de la sauvegarde des paramètres" });
  }
});

// Reset des paramètres aux valeurs par défaut
app.post("/api/model-params/reset", requireAuth, (req, res) => {
  if (saveModelParams(defaultModelParams)) {
    res.json(defaultModelParams);
  } else {
    res.status(500).json({ error: "Erreur lors du reset" });
  }
});

// Route de chat améliorée avec paramètres dynamiques
app.post("/api/chat", requireAuth, (req, res) => {
  const { message, preprompt = "", modelParams } = req.body;

  console.log("🚀 DEBUT CHAT");
  console.log("Message:", message);
  console.log("Preprompt length:", preprompt.length);

  if (!message) {
    return res.status(400).json({ error: "Message requis" });
  }

  // Charger les paramètres (utiliser ceux envoyés ou ceux sauvegardés)
  const currentParams = modelParams || loadModelParams();
  console.log("🔧 Paramètres utilisés:", currentParams);

  let responseSent = false;

  const sendResponse = (statusCode, data) => {
    if (!responseSent) {
      responseSent = true;
      console.log("📤 ENVOI REPONSE:", statusCode);
      res.status(statusCode).json(data);
    }
  };

  const fullPrompt = preprompt.trim()
    ? `${preprompt.trim()}\n\nUser: ${message}\nAssistant:`
    : `User: ${message}\nAssistant:`;

  console.log("📝 Prompt final length:", fullPrompt.length);

  // Construire les arguments llama.cpp avec les paramètres dynamiques
  const args = [
    "-m", config.modelPath,
    "-p", fullPrompt,
    "-c", currentParams.contextSize.toString(),
    "-n", currentParams.maxTokens.toString(),
    "--temp", currentParams.temperature.toString(),
    "--top-p", currentParams.topP.toString(),
    "--repeat-penalty", currentParams.repeatPenalty.toString(),
    "--no-display-prompt"
  ];

  // Ajouter le seed si différent de -1
  if (currentParams.seed !== -1) {
    args.push("--seed", currentParams.seed.toString());
  }

  console.log("🔧 Arguments llama.cpp:", args);

  const llamaProcess = spawn(config.llamaCppPath, args);

  let response = "";
  let errorOutput = "";
  let chunkCount = 0;

  llamaProcess.stdout.on("data", (data) => {
    const chunk = data.toString();
    response += chunk;
    chunkCount++;

    console.log(`📥 CHUNK ${chunkCount}:`, JSON.stringify(chunk.substring(0, 50)));

    // Arrêt si on détecte la fin
    if (chunk.includes(">") || chunk.includes("User:") || chunk.includes("Assistant:")) {
      console.log("🔚 ARRET DETECTE");
      llamaProcess.kill("SIGTERM");
      processAndSendResponse();
    }
  });

  llamaProcess.stderr.on("data", (data) => {
    const chunk = data.toString();
    errorOutput += chunk;
    console.log("⚠️ STDERR:", chunk.substring(0, 100));
  });

  const processAndSendResponse = () => {
    if (responseSent) return;

    // Nettoyage amélioré de la réponse
    let cleanResponse = response
      .replace(/<\|assistant\|>/g, "")
      .replace(/<\|user\|>/g, "")
      .replace(/<\|system\|>/g, "")
      .replace(/<\|end\|>/g, "")
      .replace(/<\|endoftext\|>/g, "")
      .replace(/\n\n?>\s*$/s, "")
      .replace(/>\s*$/s, "")
      .replace(/\nUser:\s*$/s, "")
      .replace(/\nAssistant:\s*$/s, "")
      .replace(/(.{10,}?)\1+/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s{3,}/g, " ")
      .trim();

    console.log("✨ Réponse nettoyée:", JSON.stringify(cleanResponse.substring(0, 100)));

    if (cleanResponse && cleanResponse.length > 0) {
      sendResponse(200, { 
        response: cleanResponse,
        modelParams: currentParams 
      });
    } else {
      sendResponse(500, {
        error: "Réponse vide après nettoyage",
        debug: response.substring(0, 200),
      });
    }
  };

  llamaProcess.on("close", (code) => {
    console.log("🔚 CLOSE avec code:", code);
    if (!responseSent) {
      processAndSendResponse();
    }
  });

  llamaProcess.on("error", (error) => {
    console.error("💥 ERREUR:", error);
    sendResponse(500, { error: "Erreur: " + error.message });
  });

  // Timeout adaptatif basé sur maxTokens
  const timeout = Math.max(30000, currentParams.maxTokens * 100);
  setTimeout(() => {
    if (!responseSent) {
      console.log("⏰ TIMEOUT");
      llamaProcess.kill("SIGKILL");
      sendResponse(408, {
        error: "Timeout",
        debug: {
          responseLength: response.length,
          chunkCount,
          timeout: timeout,
        },
      });
    }
  }, timeout);
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
  console.log("Paramètres par défaut chargés:", loadModelParams());
});