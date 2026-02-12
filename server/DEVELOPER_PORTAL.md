# 👨‍💻 Portail Développeur - Documentation

## 🎯 Vue d'Ensemble

Le Portail Développeur permet aux marchands de :
- Générer et gérer leurs clés API (Sandbox et Production)
- Accéder à des exemples de code dans plusieurs langages
- Consulter la documentation technique
- Tester l'intégration en mode Sandbox

## 🏗 Architecture

### Backend

```
server/src/
├── controllers/
│   └── apiKeyController.js          # Gestion clés API
└── routes/
    └── developers.js                # Endpoints développeurs
```

### Frontend

```
src/pages/merchant/
└── DeveloperPortal.jsx              # Interface développeur
```

## 🔑 Gestion des Clés API

### Types de Clés

| Type | Préfixe | Usage | Validation KYC Required |
|------|---------|-------|------------------------|
| **Sandbox** | `alma_test_sk_` | Tests et développement | ❌ Non |
| **Production** | `alma_live_sk_` | Transactions réelles | ✅ Oui |

### Format

```
Format: {prefix}_{64_hex_characters}

Exemples:
- alma_test_sk_a1b2c3d4e5f6...
- alma_live_sk_9f8e7d6c5b4a...
```

### Limites

- **Maximum 10 clés actives** par environnement (sandbox/production)
- Les clés production nécessitent un compte validé (KYC complété)
- Les clés révoquées sont conservées pour audit (marquées `is_active: false`)

## 📡 API Endpoints

### 1. Lister les Clés API

**GET** `/api/developers/keys`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "keys": [
    {
      "id": "uuid",
      "name": "Production API Key",
      "key_preview": "alma_live_sk_12...4567",
      "full_key": "alma_live_sk_1234567890abcdef...", // Shown only once
      "type": "secret",
      "environment": "production",
      "created_at": "2026-01-15T10:00:00Z",
      "last_used_at": "2026-02-10T14:30:00Z",
      "is_active": true
    },
    {
      "id": "uuid",
      "name": "Test Environment",
      "key_preview": "alma_test_sk_ab...ef12",
      "full_key": "alma_test_sk_abcdef1234567890...",
      "type": "secret",
      "environment": "sandbox",
      "created_at": "2026-01-10T08:00:00Z",
      "last_used_at": "2026-02-10T12:00:00Z",
      "is_active": true
    }
  ]
}
```

### 2. Générer une Nouvelle Clé

**POST** `/api/developers/keys`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "My Production Key",
  "environment": "production"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Clé API générée avec succès",
  "key": {
    "id": "uuid",
    "name": "My Production Key",
    "key": "alma_live_sk_a1b2c3d4e5f6...",
    "key_preview": "alma_live_sk_a1b2...f6g7",
    "type": "secret",
    "environment": "production",
    "created_at": "2026-02-10T16:00:00Z"
  },
  "warning": "Cette clé ne sera affichée qu'une seule fois. Conservez-la en sécurité."
}
```

### 3. Mettre à Jour le Nom d'une Clé

**PATCH** `/api/developers/keys/:keyId`

**Body:**
```json
{
  "name": "Updated Key Name"
}
```

### 4. Révoquer une Clé

**DELETE** `/api/developers/keys/:keyId`

**Réponse:**
```json
{
  "success": true,
  "message": "Clé API révoquée avec succès"
}
```

**Note:** Une clé révoquée ne peut plus être utilisée pour authentifier les requêtes API.

## 💻 Exemples de Code

### Node.js

```javascript
const axios = require('axios');

const apiKey = 'alma_live_sk_your_secret_key';
const baseURL = 'https://api.almapay.cd/v1';

// Initier un paiement
async function initiatePayment() {
    try {
        const response = await axios.post(`${baseURL}/payments`, {
            amount: 100.00,
            currency: 'USD',
            customer_phone: '0812345678',
            order_id: 'ORDER-123',
            description: 'Achat produit X'
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Payment initiated:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error:', error.response?.data);
        throw error;
    }
}

initiatePayment();
```

### PHP

```php
<?php

$apiKey = 'alma_live_sk_your_secret_key';
$baseURL = 'https://api.almapay.cd/v1';

function initiatePayment() {
    global $apiKey, $baseURL;
    
    $data = [
        'amount' => 100.00,
        'currency' => 'USD',
        'customer_phone' => '0812345678',
        'order_id' => 'ORDER-123',
        'description' => 'Achat produit X'
    ];
    
    $ch = curl_init($baseURL . '/payments');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_RETURNTRANSFER => true
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

$result = initiatePayment();
?>
```

### Python

```python
import requests

API_KEY = 'alma_live_sk_your_secret_key'
BASE_URL = 'https://api.almapay.cd/v1'

def initiate_payment():
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'amount': 100.00,
        'currency': 'USD',
        'customer_phone': '0812345678',
        'order_id': 'ORDER-123',
        'description': 'Achat produit X'
    }
    
    response = requests.post(
        f'{BASE_URL}/payments',
        json=data,
        headers=headers
    )
    response.raise_for_status()
    
    return response.json()

if __name__ == '__main__':
    result = initiate_payment()
    print('Payment initiated:', result)
```

### cURL

```bash
# Initier un paiement
curl -X POST https://api.almapay.cd/v1/payments \
  -H "Authorization: Bearer alma_live_sk_your_secret_key" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "customer_phone": "0812345678",
    "order_id": "ORDER-123",
    "description": "Achat produit X"
  }'

# Vérifier le statut d'un paiement
curl -X GET https://api.almapay.cd/v1/payments/TXN-123456 \
  -H "Authorization: Bearer alma_live_sk_your_secret_key"

# Récupérer le solde du wallet
curl -X GET https://api.almapay.cd/v1/wallet/balance \
  -H "Authorization: Bearer alma_live_sk_your_secret_key"
```

## 🎨 Interface Utilisateur

### Fonctionnalités

✅ **Gestion Visuelle** : Interface moderne avec état des clés  
✅ **Génération Rapide** : Créer de nouvelles clés en un clic  
✅ **Sécurité** : Masquage des clés avec révélation à la demande  
✅ **Copie Facile** : Bouton de copie avec feedback visuel  
✅ **Badges Visuels** : Identification claire Sandbox vs Production  
✅ **Code Multi-Langages** : Exemples Node.js, PHP, Python, cURL  
✅ **Liens Rapides** : Accès direct à la documentation et ressources  

### Sections

1. **Clés API**
   - Liste des clés actives
   - Bouton "Nouvelle Clé"
   - Actions : Révéler, Copier, Révoquer
   - Métadonnées : Date création, dernière utilisation

2. **Exemples de Code**
   - Sélecteur de langage
   - Bloc de code avec syntaxe highlighting
   - Bouton copier le code
   - Exemples pratiques (paiement, statut, wallet)

3. **Ressources Utiles**
   - API Reference
   - Documentation Webhooks
   - SDKs officiels
   - Status Page

## 🔐 Sécurité des Clés API

### Bonnes Pratiques

✅ **Ne jamais exposer** les clés dans le code frontend  
✅ **Utiliser des variables d'environnement** (.env)  
✅ **Révoquer immédiatement** toute clé compromise  
✅ **Rotation régulière** des clés en production  
✅ **Limiter les permissions** selon les besoins  

### ⚠️ Anti-Patterns

❌ Commiter les clés dans Git/GitHub  
❌ Envoyer les clés par email non chiffré  
❌ Utiliser des clés production pour les tests  
❌ Partager les clés entre plusieurs projets  
❌ Logger les clés dans les fichiers de log  

### Stockage Sécurisé

#### Node.js (.env)
```bash
ALMA_API_KEY=alma_live_sk_your_secret_key
```

```javascript
require('dotenv').config();
const apiKey = process.env.ALMA_API_KEY;
```

#### PHP (.env)
```php
<?php
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$apiKey = $_ENV['ALMA_API_KEY'];
?>
```

#### Python (.env)
```python
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('ALMA_API_KEY')
```

## 🔄 Workflow d'Intégration

```
1. DÉVELOPPEMENT
   ↓
   Créer clé Sandbox
   ↓
   Tester paiements en mode test
   ↓
   Implémenter webhooks
   ↓
   Valider l'intégration

2. MISE EN PRODUCTION
   ↓
   Compléter KYC/KYB
   ↓
   Créer clé Production
   ↓
   Configurer environnement production
   ↓
   Déployer

3. MAINTENANCE
   ↓
   Monitor via Status Page
   ↓
   Vérifier logs et erreurs
   ↓
   Rotation des clés (optionnel)
```

## 📊 Tracking d'Utilisation

### Métadonnées Enregistrées

- **created_at** : Date de génération
- **last_used_at** : Dernière requête authentifiée
- **is_active** : Statut actif/révoqué
- **revoked_at** : Date de révocation (si applicable)

### Utilisation dans les Requêtes

Chaque requête API met à jour automatiquement le champ `last_used_at` de la clé utilisée.

## 🧪 Mode Sandbox

### Caractéristiques

- Aucune transaction réelle
- Pas de KYC requis
- Données de test
- Webhooks simulés
- Montants illimités (pour tests)

### Différences Sandbox vs Production

| Fonctionnalité | Sandbox | Production |
|----------------|---------|-----------|
| KYC Required | ❌ Non | ✅ Oui |
| Transactions Réelles | ❌ Non | ✅ Oui |
| Limites Montants | Aucune | Oui (selon KYC) |
| Webhooks | Simulés | Réels |
| Support | Documentation | Email + Téléphone |

## 📚 Ressources

### Documentation API
- **URL:** https://docs.almapay.cd/api
- Référence complète de tous les endpoints
- Exemples de requêtes/réponses
- Codes d'erreur

### Webhooks
- **URL:** https://docs.almapay.cd/webhooks
- Configuration des callbacks
- Événements disponibles
- Signature validation

### SDKs Officiels
- **URL:** https://docs.almapay.cd/sdks
- Node.js SDK
- PHP SDK
- Python SDK
- Ruby SDK (coming soon)

### Status Page
- **URL:** https://status.almapay.cd
- État des services en temps réel
- Historique des incidents
- Notifications d'interruption

---

**Version:** 1.0.0  
**Dernière mise à jour:** Février 2026  
**Support:** developers@almapay.cd
