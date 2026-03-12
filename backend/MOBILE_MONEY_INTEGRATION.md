# 🚀 Intégration Mobile Money - Documentation Technique

## 📋 Vue d'Ensemble

L'intégration Mobile Money permet aux marchands de collecter des paiements via les trois principaux opérateurs de RDC :
- **M-Pesa (Vodacom)** - API REST avec STK Push
- **Orange Money** - API REST avec Webpay/USSD
- **Airtel Money** - API REST avec Collection Request

## 🏗 Architecture

### Structure des Adapters

```
server/src/services/payment/
├── adapters/
│   ├── BasePaymentAdapter.js      # Classe de base commune
│   ├── MpesaAdapter.js             # Implémentation M-Pesa
│   ├── OrangeMoneyAdapter.js       # Implémentation Orange Money
│   └── AirtelMoneyAdapter.js       # Implémentation Airtel Money
├── PaymentProcessor.js             # Orchestrateur principal
```

### Flux de Paiement

```
Client (Checkout)
    ↓
API /api/payments (POST)
    ↓
PaymentController
    ↓
PaymentProcessor.initiatePayment()
    ↓
[Détection automatique opérateur]
    ↓
MpesaAdapter | OrangeAdapter | AirtelAdapter
    ↓
API Opérateur Mobile Money
    ↓
Transaction créée (status: pending)
    ↓
Client reçoit notification sur téléphone
    ↓
Client entre PIN pour confirmer
    ↓
Webhook reçu de l'opérateur
    ↓
WebhookController
    ↓
PaymentProcessor.handleCallback()
    ↓
Transaction mise à jour (status: success/failed)
    ↓
Wallet crédité + Ledger entries créés
    ↓
Webhook envoyé au marchand (optionnel)
```

## 🔧 Configuration

### Variables d'Environnement

```bash
# M-Pesa (Vodacom)
MPESA_API_KEY=your_mpesa_consumer_key
MPESA_API_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_mpesa_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/webhooks/mpesa
MPESA_BASE_URL=https://api.vodacom.cd/mpesa

# Orange Money
ORANGE_API_KEY=your_orange_client_id
ORANGE_API_SECRET=your_orange_client_secret
ORANGE_MERCHANT_CODE=your_merchant_code
ORANGE_CALLBACK_URL=https://yourdomain.com/api/webhooks/orange
ORANGE_BASE_URL=https://api.orange.cd/omoney

# Airtel Money
AIRTEL_API_KEY=your_airtel_client_id
AIRTEL_API_SECRET=your_airtel_client_secret
AIRTEL_MERCHANT_ID=your_merchant_id
AIRTEL_CALLBACK_URL=https://yourdomain.com/api/webhooks/airtel
AIRTEL_BASE_URL=https://openapi.airtel.africa
```

## 📡 Endpoints API

### 1. Initier un Paiement

**POST** `/api/payments`

```json
{
  "amount": 45.00,
  "currency": "USD",
  "customer_phone": "0812345678",
  "order_id": "ORDER-123",
  "description": "Achat produit X"
}
```

**Réponse Success:**
```json
{
  "success": true,
  "transaction_ref": "TXN-1234567890-ABC",
  "operator": "mpesa",
  "status": "pending",
  "message": "Payment initiated. Check your phone."
}
```

### 2. Vérifier Statut

**GET** `/api/payments/:transactionRef`

**Réponse:**
```json
{
  "success": true,
  "status": "success",
  "transaction_ref": "TXN-1234567890-ABC",
  "amount": 45.00,
  "currency": "USD",
  "completed_at": "2026-02-10T15:30:00Z"
}
```

### 3. Webhooks (Callbacks Opérateurs)

**POST** `/api/webhooks/mpesa` - Callback M-Pesa  
**POST** `/api/webhooks/orange` - Callback Orange Money  
**POST** `/api/webhooks/airtel` - Callback Airtel Money

## 🔐 Sécurité

### Authentification OAuth

Chaque adapter gère automatiquement :
- Obtention du token OAuth
- Rafraîchissement avant expiration (55min cache)
- Headers d'autorisation appropriés

### Validation des Callbacks

- **M-Pesa** : IP Whitelisting (infrastructure)
- **Orange Money** : HMAC SHA-256 signature
- **Airtel Money** : HMAC SHA-256 signature

### Chiffrement

Toutes les données sensibles sont chiffrées :
- Numéros de téléphone clients
- Informations bancaires
- Clés API (stockées chiffrées en DB)

## 🧪 Tests & Sandbox

### Numéros de Test (Sandbox)

**M-Pesa:**
- Test success: `243810000001`
- Test failure: `243810000002`

**Orange Money:**
- Test success: `243890000001`
- Test failure: `243890000002`

**Airtel Money:**
- Test success: `243970000001`
- Test failure: `243970000002`

### Commandes de Test

```bash
# 1. Initier un paiement test
curl -X POST http://localhost:5000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 10,
    "currency": "USD",
    "customer_phone": "0812345678",
    "order_id": "TEST-001"
  }'

# 2. Vérifier le statut
curl http://localhost:5000/api/payments/TXN-123456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Simuler un callback (dev only)
curl -X POST http://localhost:5000/api/webhooks/mpesa \
  -H "Content-Type: application/json" \
  -d @mpesa_callback_sample.json
```

## 📊 Détection Automatique Opérateur

Le système détecte automatiquement l'opérateur basé sur les préfixes :

| Opérateur       | Préfixes               |
|----------------|------------------------|
| M-Pesa         | 081, 082, 083, 084, 085|
| Orange Money   | 089, 090, 084, 085     |
| Airtel Money   | 097, 098, 099          |

**Note:** Certains préfixes se chevauchent (084, 085). La priorité est donnée dans l'ordre : M-Pesa > Orange > Airtel.

## 🔄 Gestion des Retry

Les adapters incluent un mécanisme de retry avec backoff exponentiel :

```javascript
// 3 tentatives maximum
// Délais : 2s, 4s, 8s
await adapter.retryOperation(() => adapter.initiatePayment(data), 3);
```

## 📝 Logging

Tous les appels API sont loggés :
- Requêtes sortantes vers opérateurs
- Réponses reçues
- Callbacks entrants
- Erreurs et exceptions

Niveau de log configurable via `LOG_LEVEL` env var.

## 🚨 Gestion d'Erreurs

Codes d'erreur standardisés :

| Code                      | Description                           |
|--------------------------|---------------------------------------|
| `OPERATOR_NOT_DETECTED`  | Numéro invalide/non reconnu          |
| `NETWORK_ERROR`          | Timeout/problème réseau              |
| `OPERATOR_ERROR`         | Erreur de l'API opérateur            |
| `INVALID_SIGNATURE`      | Signature callback invalide          |
| `INSUFFICIENT_BALANCE`   | Client n'a pas assez de fonds        |
| `TRANSACTION_CANCELLED`  | Client a annulé le paiement          |

## 💡 Bonnes Pratiques

### 1. Timeouts
- Timeout API : 30 secondes par défaut
- Timeout transaction : 5 minutes (configurable)

### 2. Idempotence
- Utiliser `transaction_ref` unique
- Vérifier les doublons avant traitement

### 3. Callbacks
- Toujours retourner HTTP 200 (même en cas d'erreur)
- Logger les callbacks pour audit
- Traiter de manière asynchrone si possible

### 4. Monitoring
- Surveiller les taux de succès par opérateur
- Alertes sur échecs répétés
- Tracking des temps de réponse

## 🔗 Ressources Externes

**Documentation Officielle:**
- [M-Pesa API Docs](https://developer.mpesa.vm.co.mz/)
- [Orange Money API](https://developer.orange.com/)
- [Airtel Money API](https://developers.airtel.africa/)

**Support:**
- M-Pesa: api.support@vodacom.cd
- Orange: api-support@orange.cd
- Airtel: developers@africa.airtel.com

---

**Développé avec ❤️ pour Alma RDC**  
**Version:** 1.0.0  
**Dernière mise à jour:** Février 2026
