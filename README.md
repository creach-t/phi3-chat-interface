# 🤖 Phi-3 Chat Interface

Interface web pour interagir avec votre modèle Phi-3 local avec authentification, système de preprompts et **gestion de modèles**.

## ✨ Fonctionnalités

- 🔐 **Authentification sécurisée** avec login/mot de passe
- 💬 **Interface de chat** moderne et responsive  
- 📝 **Preprompts personnalisés** sauvegardés et réutilisables
- 🤖 **Gestion des modèles** - Télécharger, activer et supprimer des modèles depuis l'interface
- ⚙️ **Configuration** des paramètres du modèle
- 📊 **Logging** avec Winston
- 🔧 **TypeScript** pour une meilleure maintenabilité

## 🚀 Installation

### Prérequis
- Node.js 18+
- llama.cpp compilé avec votre modèle Phi-3
- `curl` installé (pour les téléchargements de modèles)

### Étapes

```bash
# Cloner le repository
git clone https://github.com/creach-t/phi3-chat-interface.git
cd phi3-chat-interface

# Basculer sur la branche de gestion des modèles
git checkout feature/model-manager

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env

# Compiler et démarrer
npm run build
npm start
```

## ⚙️ Configuration

Créez un fichier `.env` :

```env
PORT=3000
IP_ADDRESS=0.0.0.0
NODE_ENV=production

# Authentification (changez ces valeurs !)
AUTH_USERNAME=admin
AUTH_PASSWORD=votre_mot_de_passe

# Chemins vers llama.cpp et le modèle
LLAMA_CPP_PATH=/path/to/llama-cli
MODEL_PATH=/path/to/phi3-model.gguf

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## 🛠️ Scripts

```bash
npm run dev        # Développement avec rechargement
npm run build      # Compiler TypeScript
npm start          # Démarrer en production
npm run start:dev  # Développement avec nodemon
```

## 🔐 Authentification

**Identifiants par défaut :**
- Username: `admin`
- Password: `password123`

⚠️ **Changez le mot de passe** dans le fichier `.env` avant de déployer !

## 🤖 Nouvelle Fonctionnalité : Gestion des Modèles

### Vue d'ensemble
La nouvelle interface permet de :
- **Télécharger** des modèles directement depuis Hugging Face
- **Activer** le modèle de votre choix
- **Supprimer** les modèles inutiles
- **Suivre** le progrès des téléchargements en temps réel

### Utilisation

#### 1. Télécharger un modèle
- Coller l'URL Hugging Face d'un modèle GGUF
- Exemple : `https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf`
- Optionnel : spécifier un nom de fichier personnalisé
- Cliquer sur "Télécharger"

#### 2. Activer un modèle
- Dans la liste des modèles disponibles
- Cliquer sur "Activer" pour le modèle souhaité
- Le modèle actuel est indiqué par 🟢

#### 3. Supprimer un modèle
- Cliquer sur "Supprimer" (impossible pour le modèle actif)
- Confirmer la suppression

### Modèles Recommandés

**Phi-3 Mini (Recommandé pour débuter) :**
```
https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf
```

**Phi-3 Mini (Version légère) :**
```
https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q2_k.gguf
```

**Phi-3 Medium (Plus performant, plus lourd) :**
```
https://huggingface.co/microsoft/Phi-3-medium-4k-instruct-gguf/resolve/main/Phi-3-medium-4k-instruct-q4.gguf
```

### Tailles des Modèles
- **Q2_K** : ~2 GB (plus petit, moins précis)
- **Q4_K** : ~2.4 GB (équilibre qualité/taille)
- **Q8_K** : ~4.5 GB (plus précis, plus volumineux)

## 📝 Preprompts

Les preprompts permettent de définir un contexte pour l'IA. Exemples :

```
Tu es un assistant technique expert en programmation.
```

```
Tu es un tuteur patient qui explique simplement les concepts.
```

## 📁 Structure

```
phi3-chat-interface/
├── src/
│   ├── config/        # Configuration
│   ├── controllers/   # Contrôleurs (+ modelsController)
│   ├── services/      # Services métier (+ modelManager)
│   ├── routes/        # Routes API (+ models)
│   └── app.ts         # App Express
├── public/            # Interface web
│   ├── css/           # Styles (+ models.css)
│   └── js/            # Scripts (+ models.js, main.js)
├── models/            # Dossier des modèles GGUF
├── data/              # Données (logs, preprompts)
└── server.ts          # Point d'entrée
```

## 🚀 Déploiement

### Avec PM2
```bash
npm run build
pm2 start dist/server.js --name phi3-chat
```

### Variables d'environnement importantes
- `LLAMA_CPP_PATH` : Chemin vers l'exécutable llama-cli
- `MODEL_PATH` : Chemin vers votre modèle .gguf (sera mis à jour automatiquement)
- `AUTH_PASSWORD` : Mot de passe sécurisé

## 🐛 Dépannage

**Le serveur ne démarre pas :**
- Vérifiez que le port 3000 est libre
- Contrôlez la configuration `.env`

**Le modèle ne répond pas :**
- Vérifiez les chemins `LLAMA_CPP_PATH` et `MODEL_PATH`
- Consultez les logs dans `data/logs/`

**Téléchargement de modèle échoue :**
- Vérifiez que `curl` est installé
- Vérifiez l'URL Hugging Face (doit pointer vers un fichier .gguf)
- Vérifiez l'espace disque disponible

**Erreurs de mémoire :**
- Utilisez un modèle plus petit (Q2_K au lieu de Q4_K)
- Réduisez la taille du contexte

## 🔄 API Endpoints pour les Modèles

```bash
GET    /api/models                           # Liste des modèles
POST   /api/models/download                  # Télécharger un modèle
POST   /api/models/activate                  # Activer un modèle
DELETE /api/models/:filename                 # Supprimer un modèle
GET    /api/models/downloads                 # Status des téléchargements
POST   /api/models/downloads/:id/cancel      # Annuler un téléchargement
```

## 📄 Licence

MIT License

---

**Accédez à votre interface sur http://localhost:3000 🚀**

> Nouvelle fonctionnalité de gestion des modèles développée pour simplifier l'utilisation de Phi-3 !