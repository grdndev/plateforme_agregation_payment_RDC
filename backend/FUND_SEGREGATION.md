# 💰 Système de Cantonnement (Fund Segregation)

## 🎯 Vue d'Ensemble

Le système de cantonnement sépare les fonds entre deux types de comptes pour optimiser la sécurité et les opérations :

1. **Wallet Virtuel** : Pour les transactions quotidiennes rapides
2. **Compte Bancaire** : Pour le stockage sécurisé des fonds excédentaires

## 🏗 Architecture

### Services

```
server/src/services/escrow/
└── FundSegregationService.js    # Logique de cantonnement
```

### Controllers & Routes

```
server/src/
├── controllers/
│   └── segregationController.js
└── routes/
    ├── wallet.js (endpoints marchands)
    └── admin.js (endpoints admin)
```

## 💡 Principes de Fonctionnement

### Limites de Sécurité

| Paramètre | USD | CDF |
|-----------|-----|-----|
| **Max Wallet Balance** | 50,000 $ | 100,000,000 FC |
| **Auto-Sweep Threshold** | 30,000 $ | 60,000,000 FC |
| **Min Operational Balance** | 1,000 $ | 2,000,000 FC |

### Règles Automatiques

1. **Auto-Sweep** : Quand le wallet dépasse le threshold, l'excédent est automatiquement transféré vers le compte bancaire (conservant le min_operational_balance)

2. **Limite de Sécurité** : Le wallet ne peut jamais dépasser le max_balance pour réduire l'exposition aux risques

3. **Balance Opérationnelle** : Un montant minimum reste toujours dans le wallet pour assurer la continuité des opérations

## 📡 API Endpoints

### 1. Obtenir le Statut de Cantonnement

**GET** `/api/wallet/segregation/status`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "user_id": "uuid",
  "segregation": {
    "USD": {
      "wallet_balance": "25000.00",
      "bank_balance": "100000.00",
      "total_balance": "125000.00",
      "wallet_max_limit": 50000,
      "wallet_available_capacity": 25000,
      "auto_sweep_threshold": 30000,
      "min_operational_balance": 1000,
      "wallet_usage_percent": "20.00",
      "requires_sweep": false,
      "can_accept_funding": true
    },
    "CDF": {
      "wallet_balance": "5000000.00",
      "bank_balance": "50000000.00",
      "total_balance": "55000000.00",
      "wallet_max_limit": 100000000,
      "wallet_available_capacity": 95000000,
      "auto_sweep_threshold": 60000000,
      "min_operational_balance": 2000000,
      "wallet_usage_percent": "9.09",
      "requires_sweep": false,
      "can_accept_funding": true
    }
  },
  "bank_accounts": [
    {
      "id": "uuid",
      "bank_name": "RAWBANK",
      "account_number": "********1234",
      "currency": "USD",
      "is_default": true
    }
  ]
}
```

### 2. Transférer du Wallet vers la Banque (Sweep)

**POST** `/api/wallet/segregation/sweep`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "amount": 20000,
  "currency": "USD",
  "bank_account_id": "uuid"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Fonds transférés vers le compte bancaire avec succès",
  "data": {
    "transaction_ref": "TXN-SWEEP-123456",
    "amount": 20000.00,
    "currency": "USD",
    "from": "virtual_wallet",
    "to": "bank_account",
    "bank_account": {
      "bank_name": "RAWBANK",
      "account_number": "********1234"
    },
    "new_wallet_balance": 5000.00,
    "completed_at": "2026-02-10T16:00:00Z"
  }
}
```

### 3. Demande de Financement (Banque vers Wallet)

**POST** `/api/wallet/segregation/fund`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "amount": 10000,
  "currency": "USD",
  "bank_account_id": "uuid",
  "reference": "BANK-REF-789",
  "notes": "Réapprovisionnement wallet opérationnel"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Demande de financement créée. En attente de vérification.",
  "data": {
    "transaction_ref": "TXN-FUND-654321",
    "amount": 10000.00,
    "currency": "USD",
    "from": "bank_account",
    "to": "virtual_wallet",
    "status": "pending",
    "bank_account": {
      "bank_name": "RAWBANK",
      "account_number": "********1234"
    }
  }
}
```

**Note:** Cette demande nécessite une vérification admin avant que les fonds ne soient crédités au wallet.

### 4. [ADMIN] Approuver un Financement

**POST** `/api/admin/segregation/approve-funding`

**Headers:**
```
Authorization: Bearer {ADMIN_JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "transaction_ref": "TXN-FUND-654321"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Financement approuvé et wallet crédité",
  "data": {
    "transaction_ref": "TXN-FUND-654321",
    "amount": 10000.00,
    "currency": "USD",
    "new_wallet_balance": 15000.00
  }
}
```

### 5. [ADMIN] Déclencher Auto-Sweep (Utilisateur Unique)

**POST** `/api/admin/segregation/auto-sweep`

**Body:**
```json
{
  "user_id": "uuid"
}
```

### 6. [ADMIN] Auto-Sweep Global (Tous Utilisateurs)

**POST** `/api/admin/segregation/auto-sweep-all`

**Réponse:**
```json
{
  "success": true,
  "message": "Auto-sweep global exécuté",
  "total_users": 150,
  "successful_sweeps": 12,
  "errors": 0,
  "details": [
    {
      "user_id": "uuid",
      "email": "merchant@example.com",
      "sweeps": 2
    }
  ]
}
```

## 🔄 Workflow

### Cycle de Vie des Fonds

```
┌──────────────────────────────────────────┐
│  PAIEMENT CLIENT REÇU                    │
│  → Crédit Wallet Virtuel                 │
└─────────────┬────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│  Wallet Balance > Auto-Sweep Threshold ? │
└─────────────┬────────────────────────────┘
              │ OUI
              ▼
┌──────────────────────────────────────────┐
│  AUTO-SWEEP (Cron Daily 2AM)             │
│  → Transfert excédent vers Banque        │
│  → Conserve Min Operational Balance      │
└─────────────┬────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│  FONDS SÉCURISÉS EN BANQUE               │
│  (Stockage long terme)                   │
└──────────────────────────────────────────┘

              │ Besoin opérationnel
              ▼
┌──────────────────────────────────────────┐
│  DEMANDE DE FINANCEMENT                  │
│  (Marchand → Admin)                      │
└─────────────┬────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│  VÉRIFICATION BANCAIRE + APPROVAL        │
│  (Admin vérifie le virement)             │
└─────────────┬────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│  WALLET RECHARGÉ                         │
│  → Opérations continuent                 │
└──────────────────────────────────────────┘
```

### Scénario 1: Marchand avec Fort Volume

```
Jour 1: Paiements clients → Wallet = 35,000 USD
Nuit 1: Auto-sweep → 34,000 USD vers banque, Reste 1,000 USD dans wallet

Jour 2: Nouveaux paiements → Wallet = 15,000 USD
Nuit 2: Pas de sweep (< threshold)

Jour 3: Paiements → Wallet = 40,000 USD
Nuit 3: Auto-sweep → 39,000 USD vers banque, Reste 1,000 USD dans wallet
```

### Scénario 2: Besoin de Réapprovisionnement

```
Wallet actuel: 500 USD
Commandes à traiter: 5,000 USD (refunds/withdrawals)

→ Marchand fait demande de funding: 10,000 USD
→ Admin vérifie le virement bancaire
→ Admin approuve
→ Wallet rechargé: 10,500 USD
→ Opérations peuvent continuer
```

## 💻 Utilisation

### Exemple: Vérifier le Statut

```javascript
const checkSegregation = async () => {
    const response = await fetch('/api/wallet/segregation/status', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();
    
    console.log('Wallet USD:', data.segregation.USD.wallet_balance);
    console.log('Bank USD:', data.segregation.USD.bank_balance);
    console.log('Requires sweep:', data.segregation.USD.requires_sweep);
};
```

### Exemple: Sweep Manuel

```javascript
const sweepFunds = async () => {
    const response = await fetch('/api/wallet/segregation/sweep', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            amount: 20000,
            currency: 'USD',
            bank_account_id: 'bank-uuid'
        })
    });

    const data = await response.json();
    console.log('Sweep completed:', data.data.transaction_ref);
};
```

## 🔧 Configuration

### Variables d'Environnement (.env)

```bash
# Fund Segregation Limits (USD)
MAX_WALLET_BALANCE_USD=50000
AUTO_SWEEP_THRESHOLD_USD=30000
MIN_OPERATIONAL_BALANCE_USD=1000

# Fund Segregation Limits (CDF)
MAX_WALLET_BALANCE_CDF=100000000
AUTO_SWEEP_THRESHOLD_CDF=60000000
MIN_OPERATIONAL_BALANCE_CDF=2000000
```

### Tâche Cron (Auto-Sweep)

```bash
# Auto-sweep quotidien à 2h du matin
0 2 * * * curl -X POST https://api.almapay.cd/api/admin/segregation/auto-sweep-all \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 📊 Comptabilité (Ledger)

### Sweep to Bank

```
Débit:  merchant_wallet_usd           20,000 USD
Crédit: merchant_bank_usd             20,000 USD
```

### Funding from Bank (après approval)

```
Débit:  merchant_bank_usd             10,000 USD
Crédit: merchant_wallet_usd           10,000 USD
```

## 🔐 Sécurité

✅ **Limites strictes** pour éviter l'accumulation excessive  
✅ **Validation admin** requise pour funding  
✅ **Audit trail** complet de tous les transferts  
✅ **Balance minimale** garantie pour opérations  
✅ **Tracking métadata** dans les comptes bancaires  

## 🚀 Avantages

- **Sécurité** : Fonds excédentaires à l'abri dans les comptes bancaires
- **Flexibilité** : Wallet virtuel pour transactions instantanées
- **Conformité** : Séparation claire des fonds pour audit
- **Optimisation** : Balance automatique entre liquidité et sécurité
- **Transparence** : Statut en temps réel de la répartition

---

**Version:** 1.0.0  
**Dernière mise à jour:** Février 2026
