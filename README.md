# 🤖 Phi-3 Chat Interface

Interface web pour interagir avec votre modèle Phi-3 local avec authentification et système de preprompts.

## ✨ Fonctionnalités

- 🔐 **Authentification sécurisée** avec login/mot de passe
- 💬 **Interface de chat** moderne et responsive  
- 📝 **Preprompts personnalisés** sauvegardés et réutilisables
- ⚙️ **Configuration** des paramètres du modèle
- 📊 **Logging** avec Winston
- 🔧 **TypeScript** pour une meilleure maintenabilité

## 🚀 Installation

### Prérequis
- Node.js 18+
- llama.cpp compilé avec votre modèle Phi-3

### Étapes

```bash
# Cloner le repository
git clone https://github.com/creach-t/phi3-chat-interface.git
cd phi3-chat-interface

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
│   ├── controllers/   # Contrôleurs
│   ├── services/      # Services métier
│   ├── routes/        # Routes API
│   └── app.ts         # App Express
├── public/            # Interface web
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
- `MODEL_PATH` : Chemin vers votre modèle .gguf
- `AUTH_PASSWORD` : Mot de passe sécurisé

## 🐛 Dépannage

**Le serveur ne démarre pas :**
- Vérifiez que le port 3000 est libre
- Contrôlez la configuration `.env`

**Le modèle ne répond pas :**
- Vérifiez les chemins `LLAMA_CPP_PATH` et `MODEL_PATH`
- Consultez les logs dans `data/logs/`

**Erreurs de mémoire :**
- Utilisez un modèle plus petit (Q2_K au lieu de Q4_K)
- Réduisez la taille du contexte

## 📄 Licence

MIT License

---

**Accédez à votre interface sur http://localhost:3000 🚀**