# 🏛️ Alma Payment Platform - Backend

## 📋 Vue d'Ensemble

Backend de la plateforme de paiement Alma pour la République Démocratique du Congo (RDC).
Solution complète permettant aux marchands d'accepter des paiements via Mobile Money (M-Pesa, Orange Money, Airtel Money).

## 🏗️ Architecture

```
server/
├── src/
│   ├── config/          # Configuration centralisée
│   ├── models/          # Modèles Sequelize (PostgreSQL)
│   ├── controllers/     # Contrôleurs (logique métier)
│   ├── routes/          # Routes Express
│   ├── middleware/      # Middlewares (auth, validation, etc.)
│   ├── services/        # Services métier
│   │   ├── payment/     # Gestion paiements & Mobile Money
│   │   ├── wallet/      # Gestion portefeuilles
│   │   ├── conversion/  # Conversion devises
│   │   ├── kyc/         # KYC/KYB
│   │   └── reporting/   # Rapports BCC
│   ├── utils/           # Utilitaires (logger, encryption, etc.)
│   ├── validators/      # Validation données entrantes
│   └── server.js        # Point d'entrée
├── logs/                # Logs application
├── uploads/             # Fichiers uploadés (KYC docs)
├── .env                 # Variables d'environnement
└── package.json
```

## 🚀 Installation

### Prérequis
- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis >= 6.x (optionnel mais recommandé)

### Étapes

1. **Clone & Install**
```bash
cd server
npm install
```

2. **Configuration**
```bash
cp .env.example .env
# Éditer .env avec vos configurations
```

3. **Database Setup**
```bash
# Créer la base de données
createdb alma_payment_db

# Exécuter migrations
npm run migrate
```

4. **Lancer le serveur**
```bash
# Développement
npm run dev

# Production
npm start
```

## 🔑 Variables d'Environnement Critiques

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_NAME` | Nom base de données | `alma_payment_db` |
| `JWT_SECRET` | Secret JWT (32+ chars) | `your_secret_key` |
| `MPESA_API_KEY` | Clé API M-Pesa | `...` |
| `ORANGE_API_KEY` | Clé API Orange Money | `...` |
| `AIRTEL_API_KEY` | Clé API Airtel Money | `...` |

## 📡 API Endpoints Principaux

### Auth & Users
- `POST /api/auth/register` - Inscription marchand
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Profil utilisateur

### Payments (API Publique)
- `POST /api/payments` - Initier un paiement
- `GET /api/payments/:id` - Statut paiement
- `POST /api/webhooks/mpesa` - Callback M-Pesa
- `POST /api/webhooks/orange` - Callback Orange Money
- `POST /api/webhooks/airtel` - Callback Airtel Money

### Wallet
- `GET /api/wallet/balance` - Consulter soldes
- `POST /api/wallet/convert` - Convertir CDF ↔ USD
- `POST /api/wallet/withdraw` - Initier virement bancaire
- `GET /api/wallet/transactions` - Historique

### Admin
- `GET /api/admin/merchants` - Liste marchands
- `PUT /api/admin/merchants/:id/validate` - Valider compte
- `POST /api/admin/merchants/:id/suspend` - Suspendre
- `GET /api/admin/reports/bcc` - Rapport BCC

## 🔐 Sécurité

- **Authentification**: JWT avec refresh tokens
- **Chiffrement**: AES-256 pour clés API et données sensibles
- **Rate Limiting**: 100 req/15min par défaut
- **Validation**: express-validator sur toutes les entrées
- **CORS**: Configuré pour frontend autorisé uniquement
- **Helmet**: Headers de sécurité HTTP

## 💾 Modèles de Données

### User (Merchant)
- Identité, statut (sandbox/production)
- API keys chiffrées (test + prod)
- Customisation page paiement
- KYC/KYB documents

### Wallet
- Soldes multi-devises (CDF/USD)
- Totaux cumulés (reçus/retirés)
- État (actif/gelé)

### Transaction
- Type (payment/withdrawal/conversion)
- Statut (pending/success/failed)
- Montants brut/commission/net
- Traçabilité complète

### LedgerEntry (Grand Livre)
- Comptabilité double entrée
- Réconciliation automatique
- Audit trail immuable

## 🧪 Tests

```bash
# Tous les tests
npm test

# Avec coverage
npm test -- --coverage

# Tests spécifiques
npm test -- --testPathPattern="auth"
```

## 📊 Monitoring

- **Logs**: Winston (fichiers + console)
- **Niveau**: Configurable via `LOG_LEVEL`
- **Rotation**: Automatique (5MB max par fichier)

## 🔄 CI/CD

TODO: Mise en place GitHub Actions
- Tests automatiques
- Linting (ESLint)
- Build Docker
- Deploy staging/production

## 📝 Documentation API

Une fois le serveur lancé :
```
http://localhost:5000/api-docs
```

## 🤝 Contribution

1. Créer une branche feature
2. Commit avec messages clairs
3. Tests passent
4. Pull Request avec description

## 📄 Licence

Propriétaire - Alma RDC © 2026

## 🆘 Support

Contact: support@almapay.cd
