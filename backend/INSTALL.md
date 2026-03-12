# 🚀 Installation et Démarrage - Backend Alma

## ⚡ Quick Start (Développement Local)

### 1. Prérequis
Assurez-vous d'avoir installé :
- **Node.js** v18+ ([télécharger](https://nodejs.org))
- **PostgreSQL** v14+ ([télécharger](https://www.postgresql.org/download/))
- **Git** ([télécharger](https://git-scm.com/downloads))

### 2. Installation PostgreSQL

#### macOS (avec Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Windows/Linux
Suivez les instructions sur https://www.postgresql.org/download/

#### Créer la base de données
```bash
# Se connecter à PostgreSQL
psql postgres

# Créer la base de données
CREATE DATABASE alma_payment_db;

# Créer un utilisateur (optionnel)
CREATE USER alma_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE alma_payment_db TO alma_user;

# Quitter
\q
```

### 3. installation Backend

```bash
# Aller dans le dossier server
cd server

# Installer les dépendances
npm install
```

### 4. Configuration

```bash#Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env
nano .env  # ou utilisez votre éditeur préféré
```

**Configuration minimale requise dans `.env`** :
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=alma_payment_db
DB_USER=postgres  # ou alma_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=changez_moi_avec_une_chaine_aleatoire_de_32_caracteres

# Encryption (32 caractères exactement)
ENCRYPTION_KEY=changez_moi_32_caracteres_ici

# App URLs
APP_URL=http://localhost:3000
API_URL=http://localhost:5000
```

### 5. Initialiser la base de données

```bash
# Créer les tables
npm run migrate

# (Optionnel) Ajouter des données de test
npm run seed
```

Si seed réussit, vous aurez :
- **Admin** : `admin@almapay.cd` / `Admin@2026`
- **Merchant Test** : `test@merchant.cd` / `Test@2026`

### 6. Lancer le serveur

```bash
# Mode développement (avec auto-reload)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur **http://localhost:5000**

### 7. Tester l'API

#### Health Check
```bash
curl http://localhost:5000/api/health
```

#### Register un nouveau marchand
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "merchant@example.cd",
    "password": "SecurePassword123",
    "company_name": "Ma Boutique SARL",
    "company_type": "company"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@merchant.cd",
    "password": "Test@2026"
  }'
```

---

## 📚 Endpoints Disponibles (Phase 1)

### Auth
- `POST /api/auth/register` - Inscription marchand
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Rafraîchir token
- `GET /api/auth/me` - Profil utilisateur (protégé)
- `PUT /api/auth/profile` - Modifier profil (protégé)
- `GET /api/auth/api-keys` - Obtenir clés API (protégé)
- `POST /api/auth/regenerate-keys` - Régénérer clés (protégé)

### System
- `GET /api/health` - Health check
- `GET /api/` - API info

---

## 🔧 Scripts NPM Disponibles

```bash
npm start          # Lancer en production
npm run dev        # Lancer avec nodemon (auto-reload)
npm run migrate    # Créer/synchroniser tables DB
npm run seed       # Peupler avec données de test
npm test           # Lancer les tests (TODO)
```

---

## 🐛 Troubleshooting

### Erreur : "Cannot connect to database"
- Vérifiez que PostgreSQL est démarré : `brew services list` (macOS)
- Vérifiez les credentials dans `.env`
- Testez la connexion : `psql -U postgres -h localhost`

### Erreur : "Port 5000 already in use"
- Changez le port dans `.env` : `PORT=5001`
- Ou tuez le processus : `lsof -ti:5000 | xargs kill`

### Erreur : "JWT_SECRET must be defined"
- Assurez-vous que `.env` existe et contient `JWT_SECRET`

### Les modifications ne se reflètent pas
- Vérifiez que `nodemon` fonctionne (`npm run dev`)
- Redémarrez manuellement le serveur

---

## 📦 Prochaines Étapes

Phase 1 ✅ **TERMINÉE !**

**Phase 2** (à venir) :
- Intégration Mobile Money (M-Pesa, Orange, Airtel)
- API publique de paiement
- Webhooks

**Phase 3** (à venir) :
- Gestion Wallet complète
- Conversion de devises
- Virements bancaires

---

## 📞 Support

Questions ? Contactez l'équipe de développement.

---

**Alma RDC © 2026**
