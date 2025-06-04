# 🤖 Phi-3 Chat Interface

Interface web pour chatrer avec votre modèle Phi-3 local avec authentification et système de preprompts.

## ✨ Fonctionnalités

- 🔐 **Authentification simple** avec login/mot de passe
- 💬 **Interface de chat** intuitive et responsive
- 📝 **Preprompts personnalisés** sauvegardés et réutilisables
- 🎨 **Interface moderne** avec design gradient
- 📱 **Responsive** - fonctionne sur mobile et desktop
- ⚡ **Temps réel** - chat fluide avec le modèle local

## 🛠️ Installation

### Prérequis

- Node.js (version 14 ou plus récente)
- llama.cpp compilé avec votre modèle Phi-3

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone https://github.com/creach-t/phi3-chat-interface.git
cd phi3-chat-interface
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les chemins dans server.js**
```javascript
const config = {
  username: 'admin',
  passwordHash: '$2b$10$8K1p/a0dF2h5j6k8l9M0n.O1P2Q3R4S5T6U7V8W9X0Y1Z2a3b4c5d6',
  llamaCppPath: './build/bin/llama-cli',  // Chemin vers votre llama-cli
  modelPath: './models/Phi-3-mini-4k-instruct-Q2_K.gguf'  // Chemin vers votre modèle
};
```

4. **Démarrer le serveur**
```bash
npm start
```

5. **Accéder à l'interface**
Ouvrez votre navigateur sur `http://localhost:3000`

## 🔑 Authentification par défaut

- **Username:** `admin`
- **Password:** `password123`

### Changer le mot de passe

Pour générer un nouveau hash de mot de passe :

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('votre_nouveau_mot_de_passe', 10).then(hash => console.log('Nouveau hash:', hash));"
```

Copiez le hash généré dans `server.js` à la place de `passwordHash`.

## 📝 Utilisation des Preprompts

Les preprompts vous permettent de :
- Définir un contexte ou un rôle pour l'IA
- Créer des templates réutilisables
- Améliorer la cohérence des réponses

### Exemples de preprompts

**Assistant français :**
```
Tu es un assistant IA qui répond toujours en français de manière polie et professionnelle.
```

**Expert en code :**
```
Tu es un expert en programmation. Fournit des réponses techniques précises avec des exemples de code quand approprié.
```

**Tuteur pédagogique :**
```
Tu es un tuteur patient qui explique les concepts de manière simple avec des exemples concrets.
```

## 🚀 Déploiement

### Sur un VPS

1. **Transférer les fichiers sur votre VPS**
2. **Installer Node.js sur le VPS**
3. **Configurer PM2 pour la production** (optionnel)
```bash
npm install -g pm2
pm2 start server.js --name phi3-chat
pm2 startup
pm2 save
```

4. **Configurer un proxy nginx** (optionnel)
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Variables d'environnement

Vous pouvez utiliser des variables d'environnement :

```bash
export PORT=3000
export LLAMA_CPP_PATH="/path/to/llama-cli"
export MODEL_PATH="/path/to/model.gguf"
npm start
```

## 📁 Structure du projet

```
phi3-chat-interface/
├── package.json          # Dépendances npm
├── server.js             # Serveur Express principal
├── preprompts.json       # Stockage des preprompts (auto-généré)
├── README.md             # Documentation
└── public/
    ├── index.html        # Interface utilisateur
    ├── style.css         # Styles CSS
    └── script.js         # JavaScript frontend
```

## 🔧 Configuration avancée

### Paramètres llama.cpp

Vous pouvez modifier les paramètres dans `server.js` :

```javascript
const llamaProcess = spawn(config.llamaCppPath, [
  '-m', config.modelPath,
  '-p', fullPrompt,
  '-c', '2048',     // Contexte
  '-n', '512',      // Tokens max
  '--temp', '0.7',  // Température
  '--no-display-prompt'
]);
```

### Timeout et sécurité

- Timeout par défaut : 60 secondes
- Session : 24 heures
- HTTPS recommandé en production

## 🐛 Dépannage

### Le modèle ne se charge pas
- Vérifiez le chemin vers `llama-cli`
- Vérifiez le chemin vers le modèle `.gguf`
- Assurez-vous que llama.cpp est compilé correctement

### Erreur de mémoire
- Utilisez un modèle plus petit (Q2_K au lieu de Q4_K)
- Réduisez la taille du contexte (`-c`)
- Fermez d'autres applications

### Interface ne se charge pas
- Vérifiez que le port 3000 est libre
- Regardez les logs du serveur pour les erreurs
- Assurez-vous que les fichiers `public/` sont présents

## 📄 Licence

MIT License - Libre d'utilisation et de modification.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Ajouter des fonctionnalités

---

**Profitez de votre IA locale ! 🚀**