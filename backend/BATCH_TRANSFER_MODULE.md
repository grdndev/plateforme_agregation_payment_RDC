# 🏦 Module de Virement Bancaire - Documentation

## 🎯 Vue d'Ensemble

Le module de virement bancaire permet à l'administrateur de générer des fichiers de virements groupés (batch) pour traiter les demandes de retrait en attente. Le système supporte **trois formats standards** :

1. **CSV** - Pour les banques locales en RDC
2. **SEPA XML (ISO 20022)** - Pour les virements européens
3. **SWIFT MT103** - Pour les virements internationaux

## 🏗 Architecture

### Services

```
server/src/services/withdrawal/
├── BankTransferProcessor.js    # Traitement des retraits & CSV
├── SEPAGenerator.js             # Génération SEPA XML
└── SWIFTGenerator.js            # Génération SWIFT MT103
```

### Controllers & Routes

```
server/src/
├── controllers/
│   └── batchTransferController.js
└── routes/
    ├── batch.js                 # Routes batch transfer
    └── admin.js                 # Monte /batch sous /admin
```

### Stockage Fichiers

```
server/uploads/withdrawals/
├── batch_BATCH-USD-20260210-*.csv
├── sepa_SEPA-*-*.xml
└── swift_mt103_SWIFT-*-*.txt
```

## 📡 API Endpoints

### 1. Générer Batch CSV (Banques Locales)

**POST** `/api/admin/batch/generate`

**Headers:**
```
Authorization: Bearer {ADMIN_JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "currency": "USD" | "CDF",
  "format": "csv"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Fichier batch généré avec succès",
  "data": {
    "batch_id": "BATCH-USD-20260210-153045",
    "currency": "USD",
    "count": 25,
    "total_amount": 12500.00,
    "file_name": "batch_BATCH-USD-20260210-153045_USD.csv",
    "file_path": "/path/to/uploads/withdrawals/...",
    "transactions": [...]
  }
}
```

**Format CSV:**
```csv
BATCH_ID,TRANSACTION_REF,BENEFICIARY_NAME,BANK_NAME,ACCOUNT_NUMBER,IBAN,SWIFT,AMOUNT,CURRENCY,CREATED_AT,MERCHANT_EMAIL
BATCH-USD-20260210-153045,TXN-123456,"SARL TECH CONGO","RAWBANK",123456789,,RAWBCDKI,500.00,USD,2026-02-10T10:30:00Z,merchant@example.com
```

### 2. Générer SEPA XML (Europe)

**POST** `/api/admin/batch/generate-sepa`

**Body:**
```json
{
  "currency": "USD"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Fichier SEPA XML généré avec succès",
  "data": {
    "batch_id": "SEPA-1707573045123-A3F2",
    "currency": "USD",
    "count": 15,
    "total_amount": 7500.00,
    "file_name": "sepa_SEPA-1707573045123-A3F2_USD.xml",
    "format": "SEPA pain.001.001.03"
  }
}
```

**Format:** ISO 20022 pain.001.001.03 (XML)

### 3. Générer SWIFT MT103 (International)

**POST** `/api/admin/batch/generate-swift`

**Body:**
```json
{
  "currency": "USD"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Fichier SWIFT MT103 généré avec succès",
  "data": {
    "batch_id": "SWIFT-1707573045123-F8A",
    "currency": "USD",
    "count": 8,
    "total_amount": 15000.00,
    "file_name": "swift_mt103_SWIFT-1707573045123-F8A_USD.txt",
    "format": "SWIFT MT103"
  }
}
```

**Format:** SWIFT MT103 messages (text)

### 4. Lister les Fichiers Générés

**GET** `/api/admin/batch/files`

**Réponse:**
```json
{
  "success": true,
  "count": 12,
  "files": [
    {
      "filename": "batch_BATCH-USD-20260210-153045_USD.csv",
      "size": 2048,
      "created_at": "2026-02-10T15:30:45Z",
      "modified_at": "2026-02-10T15:30:45Z",
      "download_url": "/api/admin/batch/download/batch_BATCH-USD-20260210-153045_USD.csv"
    }
  ]
}
```

### 5. Télécharger un Fichier

**GET** `/api/admin/batch/download/:filename`

**Headers:**
```
Authorization: Bearer {ADMIN_JWT_TOKEN}
```

**Réponse:** Fichier binaire avec headers de téléchargement

### 6. Statistiques des Retraits

**GET** `/api/admin/batch/stats?period=month`

**Query params:**
- `period`: `week` | `month` | `year`

**Réponse:**
```json
{
  "success": true,
  "period": "month",
  "statistics": {
    "USD": [
      {
        "currency": "USD",
        "status": "pending",
        "count": 42,
        "total_amount": "21500.00"
      },
      {
        "currency": "USD",
        "status": "success",
        "count": 128,
        "total_amount": "65000.00"
      }
    ],
    "CDF": [...]
  }
}
```

### 7. Marquer Batch comme Envoyé

**POST** `/api/admin/batch/:batchId/sent`

**Body:**
```json
{
  "sent_at": "2026-02-10T16:00:00Z",
  "sent_by": "admin@almapay.cd",
  "notes": "Envoyé via SWIFT MT103 à RAWBANK"
}
```

## 🔄 Workflow Complet

### 1. Génération Quotidienne (16h00)

```bash
# Cron job quotidien
0 16 * * * curl -X POST https://api.almapay.cd/api/admin/batch/generate \
  -H "Authorization: Bearer TOKEN" \
  -d '{"currency":"USD"}'
```

### 2. Processus Admin

1. **Générer le fichier**
   - Admin accède à `/api/admin/batch/generate`
   - Système récupère tous les retraits `pending` pour la devise
   - Transactions passent en status `processing`
   - Fichier CSV/XML/MT103 généré

2. **Télécharger le fichier**
   - Admin télécharge via `/api/admin/batch/download/{filename}`

3. **Soumettre à la banque**
   - Admin upload le fichier à la plateforme bancaire
   - Marque le batch comme envoyé via API

4. **Confirmation banque**
   - Banque traite les virements
   - Admin marque chaque transaction comme `success` ou `failed`

### 3. Mise à Jour Statuts

```javascript
// Succès
await BankTransferProcessor.markAsCompleted('TXN-123456');

// Échec (re-crédit wallet)
await BankTransferProcessor.rejectWithdrawal('TXN-123456', 'Compte invalide');
```

## 📋 Formats de Fichiers

### CSV (Banques Locales DRC)

**Colonnes:**
- BATCH_ID
- TRANSACTION_REF
- BENEFICIARY_NAME
- BANK_NAME
- ACCOUNT_NUMBER
- IBAN (optionnel)
- SWIFT (optionnel)
- AMOUNT
- CURRENCY
- CREATED_AT
- MERCHANT_EMAIL

**Usage:** Import direct dans le système bancaire partenaire

### SEPA XML (ISO 20022 pain.001.001.03)

**Structure:**
```xml
<Document>
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>SEPA-{timestamp}-{random}</MsgId>
      <NbOfTxs>25</NbOfTxs>
      <CtrlSum>12500.00</CtrlSum>
    </GrpHdr>
    <PmtInf>
      <Dbtr>
        <Nm>ALMA PAYMENT PLATFORM</Nm>
      </Dbtr>
      <DbtrAcct>
        <IBAN>CD...</IBAN>
      </DbtrAcct>
      <CdtTrfTxInf>
        <!-- Individual transfers -->
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>
```

**Usage:** Compatible avec toutes les banques SEPA européennes

### SWIFT MT103 (Wire Transfer)

**Format:**
```
{1:F01PLACEHOLDERXXX0000000000}
{2:I103BENEFICIARYXXX}
{3:{108:TXN-123456}}
{4:
:20:TXN-123456
:23B:CRED
:32A:260211USD500.00
:50K:/DEBIT_ACCOUNT
ALMA PAYMENT PLATFORM
:59:/BENEFICIARY_ACCOUNT
BENEFICIARY NAME
:70:/INV/WITHDRAWAL
/REC/TXN-123456
:71A:SHA
-}
```

**Usage:** Virements internationaux via réseau SWIFT

## 🔐 Sécurité

### Permissions

- ✅ Tous les endpoints requièrent authentification **admin**
- ✅ Middleware `requireAdmin` vérifie le rôle
- ✅ Download protégé contre path traversal (../../../etc/passwd)

### Validation

- ✅ Filtre SEPA : uniquement transactions avec IBAN
- ✅ Filtre SWIFT : uniquement transactions avec BIC/SWIFT code
- ✅ Validation format BIC : regex `^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$`

### Audit Trail

- ✅ Tous les batchs loggués avec timestamp
- ✅ Transaction status tracking (pending → processing → success/failed)
- ✅ Batch ID enregistré dans chaque transaction

## 💻 Utilisation Frontend

### Exemple: Générer Batch

```javascript
const generateBatch = async (currency) => {
    const response = await fetch('/api/admin/batch/generate', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currency })
    });

    const data = await response.json();
    
    if (data.success) {
        console.log(`Batch généré: ${data.data.batch_id}`);
        console.log(`${data.data.count} virements pour ${data.data.total_amount} ${currency}`);
        
        // Download automatically
        window.location.href = data.data.download_url;
    }
};
```

### Exemple: Liste des Fichiers

```javascript
const listBatchFiles = async () => {
    const response = await fetch('/api/admin/batch/files', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const data = await response.json();
    
    data.files.forEach(file => {
        console.log(`${file.filename} - ${file.size} bytes - ${new Date(file.created_at).toLocaleString()}`);
    });
};
```

## 📊 Monitoring

### Métriques Clés

- Nombre de retraits pending par devise
- Montant total par batch
- Taux de succès/échec
- Temps moyen de traitement
- Volume par banque partenaire

### Alertes Recommandées

- ⚠️ Plus de 50 retraits pending en USD
- ⚠️ Batch non généré après 16h
- ⚠️ Taux d'échec > 5%
- ⚠️ Montant batch > seuil limite

## 🚀 Déploiement

### Configuration .env

```bash
# Bank Configuration
BANK_BIC=RAWBCDKI
BANK_IBAN=CD1234567890
BANK_ACCOUNT=1234567890
COMPANY_NAME=Alma Payment Platform

# Limits
DAILY_WITHDRAWAL_CUTOFF_HOUR=16
MIN_WITHDRAWAL_USD=10
MIN_WITHDRAWAL_CDF=10000
```

### Permissions Fichiers

```bash
chmod 750 server/uploads/withdrawals
chown www-data:www-data server/uploads/withdrawals
```

### Tâche Cron (Production)

```bash
# Generate daily batches at 4 PM
0 16 * * * /usr/local/bin/node /app/scripts/generateDailyBatch.js
```

## 📞 Support Bancaire

**RAWBANK:**
- Email: swift@rawbank.cd
- SWIFT: RAWBCDKI
- Format: CSV ou SWIFT MT103

**TMB (Trust Merchant Bank):**
- Email: operations@tmb.cd
- SWIFT: TMBXCDKI
- Format: SEPA XML ou CSV

---

**Version:** 1.0.0  
**Dernière mise à jour:** Février 2026  
**Développé par:** Alma RDC Tech Team
