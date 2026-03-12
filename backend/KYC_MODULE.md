# 📋 Module Conformité KYC/KYB - Documentation

## 🎯 Vue d'Ensemble

Le module de conformité permet aux marchands de soumettre leurs documents d'identification (KYC - Know Your Customer) et de vérification d'entreprise (KYB - Know Your Business) afin d'activer le mode **Production** et débloquer les fonctionnalités de retrait.

## 🏗 Architecture

### Backend

```
server/src/
├── controllers/
│   └── kycController.js          # Logique métier KYC
├── routes/
│   └── kyc.js                     # Endpoints API KYC
├── models/
│   └── KYCDocument.js             # Modèle document
└── uploads/                       # Stockage fichiers
```

### Frontend

```
src/pages/merchant/
└── CompliancePage.jsx             # Interface utilisateur
```

## 📡 API Endpoints

### 1. Récupérer le Statut KYC

**GET** `/api/kyc/status`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "user_status": "pending_validation",
    "company_type": "company",
    "completion_percentage": 60,
    "validated_at": null,
    "required_documents": [
      {
        "type": "rccm",
        "required": true,
        "submitted": true,
        "status": "pending",
        "document": {
          "id": "uuid",
          "file_name": "rccm.pdf",
          "created_at": "2026-02-08T10:30:00Z",
          "status": "pending"
        }
      }
    ],
    "all_documents": []
  }
}
```

### 2. Télécharger un Document

**POST** `/api/kyc/upload`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data
```

**Body (FormData):**
```
document: [FILE]
document_type: "rccm" | "company_statutes" | "tax_number" | "rib" | "shareholder_id" | ...
metadata: {"note": "Optional metadata"}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Document soumis avec succès",
  "data": {
    "id": "uuid",
    "document_type": "rccm",
    "file_name": "rccm_entreprise.pdf",
    "status": "pending",
    "created_at": "2026-02-10T15:45:00Z"
  }
}
```

### 3. Supprimer un Document

**DELETE** `/api/kyc/documents/:id`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Note:** Ne peut supprimer que les documents avec statut `pending` ou `rejected`.

### 4. [ADMIN] Réviser un Document

**PUT** `/api/kyc/documents/:id/review`

**Headers:**
```
Authorization: Bearer {ADMIN_JWT_TOKEN}
```

**Body:**
```json
{
  "status": "approved" | "rejected",
  "rejection_reason": "Raison du rejet (si rejected)"
}
```

### 5. [ADMIN] Voir Soumissions en Attente

**GET** `/api/kyc/pending`

**Headers:**
```
Authorization: Bearer {ADMIN_JWT_TOKEN}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "submissions": [
      {
        "user": {
          "id": "uuid",
          "email": "merchant@example.com",
          "company_name": "SARL Tech",
          "status": "pending_validation"
        },
        "documents": [...]
      }
    ]
  }
}
```

## 📄 Types de Documents

### Pour Entreprises (company)

| Document Type      | Label                              | Durée de Validité |
|-------------------|-------------------------------------|-------------------|
| `rccm`            | Registre de Commerce (RCCM)        | 1 an              |
| `company_statutes`| Statuts de la Société              | Permanent         |
| `tax_number`      | Numéro d'Impôt                     | 1 an              |
| `rib`             | Relevé Identité Bancaire (RIB)     | 1 an              |
| `shareholder_id`  | Carte ID Actionnaire Principal     | 5 ans             |

### Pour Particuliers (individual)

| Document Type       | Label                           | Durée de Validité |
|--------------------|---------------------------------|-------------------|
| `national_id`      | Carte d'Identité Nationale      | 5 ans             |
| `proof_of_address` | Justificatif de Domicile        | 6 mois            |

## 🔄 Workflow de Validation

### Étapes Automatiques

1. **Sandbox** (initial)
   - Utilisateur créé, peut tester en mode sandbox
   - API keys sandbox générées

2. **Soumission Documents**
   - Marchand upload tous les documents requis
   - Statut change automatiquement vers `pending_validation`

3. **Révision Admin**
   - Admin approuve ou rejette chaque document
   - Si rejeté : marchand doit re-soumettre

4. **Activation** (automatique)
   - Tous les documents requis sont `approved`
   - Statut utilisateur → `active`
   - `validated_at` timestamp enregistré
   - Production API keys générées (TODO)
   - Email de confirmation envoyé (TODO)

### Statuts des Documents

| Statut         | Description                                    |
|---------------|------------------------------------------------|
| `pending`     | Soumis, en attente de révision admin          |
| `approved`    | Approuvé par admin                            |
| `rejected`    | Rejeté (raison fournie)                       |
| `expired`     | Document expiré (basé sur expires_at)         |

### Statuts Utilisateur

| Statut                | Description                              |
|----------------------|------------------------------------------|
| `sandbox`            | Compte créé, en mode test                |
| `pending_validation` | Documents soumis, en attente validation  |
| `active`             | KYC approuvé, mode production actif      |
| `suspended`          | Compte suspendu                          |

## 🔐 Sécurité

### Upload de Fichiers

- **Formats acceptés:** PDF, JPG, JPEG, PNG
- **Taille max:** 5 MB (configurable via `MAX_FILE_SIZE_MB`)
- **Stockage:** Fichiers stockés dans `/server/uploads/`
- **Nommage sécurisé:** `kyc-{userId}-{randomHash}.{ext}`

### Permissions

- `/api/kyc/*` : Authentification requise (JWT)
- `/api/kyc/documents/:id/review` : Admin uniquement
- `/api/kyc/pending` : Admin uniquement

### Validation

- Vérification du MIME type
- Vérification de la taille du fichier
- Validation du type de document
- Impossible de supprimer un document approuvé

## 💻 Utilisation Frontend

### Exemple: Upload Document

```javascript
const handleFileUpload = async (documentType, file) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type', documentType);

    const response = await fetch('/api/kyc/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
    });

    const data = await response.json();
    if (data.success) {
        console.log('Document uploaded:', data.data);
    }
};
```

### Exemple: Récupérer Statut

```javascript
const fetchKYCStatus = async () => {
    const response = await fetch('/api/kyc/status', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    const data = await response.json();
    console.log('Completion:', data.data.completion_percentage + '%');
};
```

## 🎨 Interface Utilisateur

### Fonctionnalités

✅ **Progression visuelle** : Barre de progression en pourcentage  
✅ **Étapes claires** : 4 étapes d'onboarding avec icônes  
✅ **Upload drag & drop** : Interface intuitive de téléchargement  
✅ **Statuts colorés** : Badges visuels (vert/jaune/rouge)  
✅ **Tooltips informatifs** : Aide contextuelle pour chaque document  
✅ **Gestion erreurs** : Alertes pour fichiers invalides  
✅ **Responsive** : Adapté mobile et desktop  

### États des Documents

- **Non soumis** : Bouton "Charger" visible
- **En révision** : Badge jaune "En révision" + possibilité de supprimer
- **Approuvé** : Check vert, document verrouillé
- **Rejeté** : Badge rouge + possibilité de re-soumettre

## 📊 Calcul de Complétion

```javascript
const completionPercentage = Math.round(
    (documentsApprouvés.length / documentsRequis.length) * 100
);
```

## 🚀 Déploiement

### Configuration Production

```bash
# .env
UPLOAD_PATH=./uploads
MAX_FILE_SIZE_MB=5

# Créer le dossier uploads
mkdir -p ./uploads
chmod 755 ./uploads
```

### Tâches Cron (Recommandé)

```bash
# Vérifier les documents expirés chaque jour
0 0 * * * node scripts/checkExpiredDocuments.js

# Nettoyer les fichiers des documents rejetés/supprimés
0 2 * * * node scripts/cleanupOrphanFiles.js
```

## 🔧 Améliorations Futures

- [ ] Génération automatique des clés API production
- [ ] Notifications email après validation
- [ ] OCR pour extraction automatique de données
- [ ] Détection de fraude (analyse d'image)
- [ ] Stockage cloud (S3, GCS) au lieu du filesystem
- [ ] Versioning des documents
- [ ] Historique des révisions
- [ ] Dashboard admin avec statistiques

## 📞 Support

**Questions :** support@almapay.cd  
**Urgences KYC :** kyc@almapay.cd

---

**Version:** 1.0.0  
**Dernière mise à jour:** Février 2026
