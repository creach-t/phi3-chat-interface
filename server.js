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

// Version DEBUG temporaire pour comprendre le problème
app.post("/api/chat", requireAuth, (req, res) => {
  const { message, preprompt = "" } = req.body;

  console.log("🚀 DEBUT DEBUG");
  console.log("Message:", message);
  console.log("Preprompt length:", preprompt.length);
  console.log("Preprompt preview:", preprompt.substring(0, 100));

  if (!message) {
    return res.status(400).json({ error: "Message requis" });
  }

  let responseSent = false;

  const sendResponse = (statusCode, data) => {
    if (!responseSent) {
      responseSent = true;
      console.log(
        "📤 ENVOI REPONSE:",
        statusCode,
        JSON.stringify(data).substring(0, 100)
      );
      res.status(statusCode).json(data);
    }
  };

  // TEST: Prompt très simple d'abord
  const fullPrompt =
    preprompt.length > 0
      ? `${preprompt.substring(0, 100)}\n\nUser: ${message}\nAssistant:`
      : `User: ${message}\nAssistant:`;

  console.log("📝 Prompt final length:", fullPrompt.length);
  console.log("📝 Prompt final:", fullPrompt);

  const args = [
    "-m",
    config.modelPath,
    "-p",
    fullPrompt,
    "-c",
    "1024",
    "-n",
    "128", // Très court pour tester
    "--temp",
    "0.3",
    "--no-display-prompt",
  ];

  console.log("🔧 Lancement llama.cpp...");

  const llamaProcess = spawn(config.llamaCppPath, args);

  let response = "";
  let errorOutput = "";
  let chunkCount = 0;
  let lastChunkTime = Date.now();

  llamaProcess.stdout.on("data", (data) => {
    const chunk = data.toString();
    response += chunk;
    lastChunkTime = Date.now();
    chunkCount++;

    console.log(`📥 CHUNK ${chunkCount}:`, JSON.stringify(chunk));

    // Arrêt immédiat dès qu'on voit un ">"
    if (chunk.includes(">")) {
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

    console.log("🔍 TRAITEMENT RESPONSE");
    console.log("Response brute length:", response.length);
    console.log("Response brute:", JSON.stringify(response));

    let cleanResponse = response
      .replace(/\n\n?>\s*$/s, "")
      .replace(/>\s*$/s, "")
      .trim();

    console.log("Response nettoyée:", JSON.stringify(cleanResponse));

    if (cleanResponse && cleanResponse.length > 0) {
      sendResponse(200, { response: cleanResponse });
    } else {
      sendResponse(500, {
        error: "Réponse vide",
        debug: { responseLength: response.length, chunkCount },
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

  // Timeout court pour debug
  setTimeout(() => {
    if (!responseSent) {
      console.log("⏰ TIMEOUT DEBUG");
      llamaProcess.kill("SIGKILL");
      sendResponse(408, {
        error: "Timeout",
        debug: {
          responseLength: response.length,
          chunkCount,
          lastResponse: response.substring(-100),
        },
      });
    }
  }, 30000);
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
