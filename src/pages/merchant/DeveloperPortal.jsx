import React, { useState, useEffect } from 'react';
import {
    Code, Key, Copy, Check, Eye, EyeOff, Plus, Trash2,
    RefreshCw, AlertCircle, Book, Terminal, Zap, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Alert from '../../components/common/Alert';

const DeveloperPortal = () => {
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);
    const [revealedKeys, setRevealedKeys] = useState(new Set());
    const [selectedLang, setSelectedLang] = useState('node');

    useEffect(() => {
        fetchAPIKeys();
    }, []);

    const fetchAPIKeys = async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual API call
            // const response = await fetch('/api/developers/keys', {
            //     headers: { 'Authorization': `Bearer ${token}` }
            // });

            // Mock data
            setApiKeys([
                {
                    id: '1',
                    name: 'Production API Key',
                    key: 'alma_live_sk_1234567890abcdef1234567890abcdef',
                    type: 'secret',
                    environment: 'production',
                    created_at: '2026-01-15T10:00:00Z',
                    last_used_at: '2026-02-10T14:30:00Z'
                },
                {
                    id: '2',
                    name: 'Test Environment',
                    key: 'alma_test_sk_abcdef1234567890abcdef1234567890',
                    type: 'secret',
                    environment: 'sandbox',
                    created_at: '2026-01-10T08:00:00Z',
                    last_used_at: '2026-02-10T12:00:00Z'
                }
            ]);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching API keys:', error);
            setAlert({ type: 'error', message: 'Erreur lors du chargement des clés API' });
            setLoading(false);
        }
    };

    const generateAPIKey = async (environment) => {
        try {
            // TODO: API call to generate key
            setAlert({ type: 'success', message: `Clé API ${environment} générée avec succès` });
            fetchAPIKeys();
        } catch (error) {
            setAlert({ type: 'error', message: 'Erreur lors de la génération de la clé' });
        }
    };

    const revokeAPIKey = async (keyId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir révoquer cette clé ? Cette action est irréversible.')) {
            return;
        }

        try {
            // TODO: API call to revoke key
            setAlert({ type: 'success', message: 'Clé API révoquée' });
            fetchAPIKeys();
        } catch (error) {
            setAlert({ type: 'error', message: 'Erreur lors de la révocation' });
        }
    };

    const copyToClipboard = (text, keyId) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(keyId);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const toggleReveal = (keyId) => {
        const newRevealed = new Set(revealedKeys);
        if (newRevealed.has(keyId)) {
            newRevealed.delete(keyId);
        } else {
            newRevealed.add(keyId);
        }
        setRevealedKeys(newRevealed);
    };

    const maskKey = (key) => {
        if (!key) return '';
        const prefix = key.substring(0, 15);
        const suffix = key.substring(key.length - 4);
        return `${prefix}${'•'.repeat(20)}${suffix}`;
    };

    const codeExamples = {
        node: {
            label: 'Node.js',
            code: `const axios = require('axios');

const apiKey = 'alma_live_sk_your_secret_key';
const baseURL = 'https://api.almapay.cd/v1';

// Initier un paiement
async function initiatePayment() {
    try {
        const response = await axios.post(\`\${baseURL}/payments\`, {
            amount: 100.00,
            currency: 'USD',
            customer_phone: '0812345678',
            order_id: 'ORDER-123',
            description: 'Achat produit X'
        }, {
            headers: {
                'Authorization': \`Bearer \${apiKey}\`,
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

initiatePayment();`
        },
        php: {
            label: 'PHP',
            code: `<?php

$apiKey = 'alma_live_sk_your_secret_key';
$baseURL = 'https://api.almapay.cd/v1';

// Initier un paiement
function initiatePayment() {
    global $apiKey, $baseURL;
    
    $data = [
        'amount' => 100.00,
        'currency' => 'USD',
        'customer_phone' => '0812345678',
        'order_id' => 'ORDER-123',
        'description' => 'Achat produit X'
    ];
    
    $ch = curl_init(\$baseURL . '/payments');
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
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $result = json_decode($response, true);
        echo "Payment initiated: " . json_encode($result);
        return $result;
    } else {
        throw new Exception("Error: " . $response);
    }
}

initiatePayment();

?>`
        },
        python: {
            label: 'Python',
            code: `import requests

API_KEY = 'alma_live_sk_your_secret_key'
BASE_URL = 'https://api.almapay.cd/v1'

def initiate_payment():
    """Initier un paiement"""
    
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
    
    try:
        response = requests.post(
            f'{BASE_URL}/payments',
            json=data,
            headers=headers
        )
        response.raise_for_status()
        
        result = response.json()
        print('Payment initiated:', result)
        return result
        
    except requests.exceptions.RequestException as error:
        print('Error:', error.response.json() if error.response else str(error))
        raise

if __name__ == '__main__':
    initiate_payment()`
        },
        curl: {
            label: 'cURL',
            code: `# Initier un paiement avec cURL

curl -X POST https://api.almapay.cd/v1/payments \\
  -H "Authorization: Bearer alma_live_sk_your_secret_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "customer_phone": "0812345678",
    "order_id": "ORDER-123",
    "description": "Achat produit X"
  }'

# Vérifier le statut d'un paiement

curl -X GET https://api.almapay.cd/v1/payments/TXN-123456 \\
  -H "Authorization: Bearer alma_live_sk_your_secret_key"

# Récupérer le solde du wallet

curl -X GET https://api.almapay.cd/v1/wallet/balance \\
  -H "Authorization: Bearer alma_live_sk_your_secret_key"`
        }
    };

    return (
        <div className="developer-portal animate-slide-up">
            <header className="page-header">
                <div className="header-content">
                    <div className="header-badge">
                        <Code color="var(--primary)" size={24} />
                    </div>
                    <div>
                        <h1>Portail Développeur</h1>
                        <p className="subtitle">
                            Gérez vos clés API et intégrez Alma Payment dans votre application.
                        </p>
                    </div>
                </div>
                <a
                    href="https://docs.almapay.cd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                >
                    <Book size={18} /> Documentation
                </a>
            </header>

            {alert && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
                </motion.div>
            )}

            <div className="developer-grid">
                {/* API Keys Section */}
                <section className="api-keys-section card">
                    <div className="section-header">
                        <div>
                            <h3>Clés API</h3>
                            <p className="text-gray text-sm">
                                Vos clés d'authentification pour accéder à l'API Alma
                            </p>
                        </div>
                        <button
                            className="btn-primary"
                            onClick={() => generateAPIKey('production')}
                        >
                            <Plus size={18} /> Nouvelle Clé
                        </button>
                    </div>

                    <div className="api-keys-list">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <RefreshCw className="spin" size={32} color="var(--primary)" />
                            </div>
                        ) : apiKeys.length === 0 ? (
                            <div className="empty-state">
                                <Key size={48} color="var(--text-gray)" />
                                <p>Aucune clé API générée</p>
                                <button className="btn-primary" onClick={() => generateAPIKey('sandbox')}>
                                    Créer ma première clé
                                </button>
                            </div>
                        ) : (
                            apiKeys.map((key) => (
                                <div key={key.id} className="api-key-item">
                                    <div className="key-header">
                                        <div className="flex items-center gap-3">
                                            <div className={`env-badge ${key.environment}`}>
                                                {key.environment === 'production' ? (
                                                    <><Zap size={14} /> Production</>
                                                ) : (
                                                    <><Terminal size={14} /> Sandbox</>
                                                )}
                                            </div>
                                            <div>
                                                <p className="key-name">{key.name}</p>
                                                <p className="text-xs text-gray">
                                                    Créée le {new Date(key.created_at).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            className="btn-icon-danger"
                                            onClick={() => revokeAPIKey(key.id)}
                                            title="Révoquer la clé"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="key-value-container">
                                        <code className="key-value">
                                            {revealedKeys.has(key.id) ? key.key : maskKey(key.key)}
                                        </code>
                                        <div className="key-actions">
                                            <button
                                                className="btn-icon"
                                                onClick={() => toggleReveal(key.id)}
                                                title={revealedKeys.has(key.id) ? 'Masquer' : 'Révéler'}
                                            >
                                                {revealedKeys.has(key.id) ? (
                                                    <EyeOff size={16} />
                                                ) : (
                                                    <Eye size={16} />
                                                )}
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => copyToClipboard(key.key, key.id)}
                                                title="Copier"
                                            >
                                                {copiedKey === key.id ? (
                                                    <Check size={16} color="var(--success)" />
                                                ) : (
                                                    <Copy size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="key-meta">
                                        <span className="text-xs text-gray">
                                            Dernière utilisation: {new Date(key.last_used_at).toLocaleString('fr-FR')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="security-notice">
                        <Shield size={16} />
                        <p className="text-sm">
                            <strong>Important:</strong> Ne partagez jamais vos clés API.
                            Conservez-les en sécurité et ne les incluez jamais dans votre
                            code frontend ou vos repositories publics.
                        </p>
                    </div>
                </section>

                {/* Code Examples Section */}
                <section className="code-examples-section card">
                    <div className="section-header">
                        <h3>Exemples de Code</h3>
                        <div className="lang-selector">
                            {Object.entries(codeExamples).map(([lang, data]) => (
                                <button
                                    key={lang}
                                    className={`lang-btn ${selectedLang === lang ? 'active' : ''}`}
                                    onClick={() => setSelectedLang(lang)}
                                >
                                    {data.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="code-container">
                        <div className="code-header">
                            <span className="text-sm text-gray">
                                {codeExamples[selectedLang].label}
                            </span>
                            <button
                                className="btn-icon"
                                onClick={() => copyToClipboard(codeExamples[selectedLang].code, 'code')}
                                title="Copier le code"
                            >
                                {copiedKey === 'code' ? (
                                    <Check size={16} color="var(--success)" />
                                ) : (
                                    <Copy size={16} />
                                )}
                            </button>
                        </div>
                        <pre className="code-block">
                            <code>{codeExamples[selectedLang].code}</code>
                        </pre>
                    </div>

                    <div className="quick-links">
                        <h4>Ressources Utiles</h4>
                        <div className="links-grid">
                            <a href="https://docs.almapay.cd/api" className="resource-link" target="_blank" rel="noopener noreferrer">
                                <Book size={18} />
                                <div>
                                    <p className="link-title">API Reference</p>
                                    <p className="link-desc">Documentation complète de l'API</p>
                                </div>
                            </a>
                            <a href="https://docs.almapay.cd/webhooks" className="resource-link" target="_blank" rel="noopener noreferrer">
                                <Zap size={18} />
                                <div>
                                    <p className="link-title">Webhooks</p>
                                    <p className="link-desc">Recevoir des notifications en temps réel</p>
                                </div>
                            </a>
                            <a href="https://docs.almapay.cd/sdks" className="resource-link" target="_blank" rel="noopener noreferrer">
                                <Code size={18} />
                                <div>
                                    <p className="link-title">SDKs</p>
                                    <p className="link-desc">Bibliothèques officielles</p>
                                </div>
                            </a>
                            <a href="https://status.almapay.cd" className="resource-link" target="_blank" rel="noopener noreferrer">
                                <AlertCircle size={18} />
                                <div>
                                    <p className="link-title">Status Page</p>
                                    <p className="link-desc">État des services</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </section>
            </div>

            <style jsx>{`
                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .developer-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 24px;
                }

                .api-keys-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-top: 20px;
                }

                .api-key-item {
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: var(--radius);
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.02);
                }

                .key-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .key-name {
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .env-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 12px;
                    border-radius: var(--radius-sm);
                    font-size: 12px;
                    font-weight: 600;
                }

                .env-badge.production {
                    background: rgba(46, 204, 113, 0.1);
                    color: var(--success);
                    border: 1px solid rgba(46, 204, 113, 0.3);
                }

                .env-badge.sandbox {
                    background: rgba(52, 152, 219, 0.1);
                    color: var(--info);
                    border: 1px solid rgba(52, 152, 219, 0.3);
                }

                .key-value-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: var(--radius-sm);
                    padding: 12px;
                }

                .key-value {
                    flex: 1;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 13px;
                    color: var(--text-gray);
                    overflow-x: auto;
                }

                .key-actions {
                    display: flex;
                    gap: 8px;
                }

                .btn-icon, .btn-icon-danger {
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    transition: var(--transition);
                    color: var(--text-gray);
                }

                .btn-icon:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                }

                .btn-icon-danger {
                    color: var(--error);
                    border-color: rgba(231, 76, 60, 0.3);
                }

                .btn-icon-danger:hover {
                    background: rgba(231, 76, 60, 0.1);
                }

                .key-meta {
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .security-notice {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                    padding: 16px;
                    background: rgba(241, 196, 15, 0.1);
                    border: 1px solid rgba(241, 196, 15, 0.3);
                    border-radius: var(--radius);
                    color: var(--warning);
                }

                .lang-selector {
                    display: flex;
                    gap: 8px;
                }

                .lang-btn {
                    padding: 6px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: var(--radius-sm);
                    color: var(--text-gray);
                    cursor: pointer;
                    transition: var(--transition);
                    font-size: 14px;
                }

                .lang-btn.active {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: white;
                }

                .lang-btn:hover:not(.active) {
                    background: rgba(255, 255, 255, 0.1);
                }

                .code-container {
                    margin-top: 20px;
                }

                .code-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-bottom: none;
                    border-radius: var(--radius) var(--radius) 0 0;
                }

                .code-block {
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 0 0 var(--radius) var(--radius);
                    padding: 20px;
                    overflow-x: auto;
                    max-height: 500px;
                    overflow-y: auto;
                }

                .code-block code {
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 13px;
                    line-height: 1.6;
                    color: #e0e0e0;
                }

                .quick-links {
                    margin-top: 32px;
                }

                .quick-links h4 {
                    margin-bottom: 16px;
                    color: var(--text-primary);
                }

                .links-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 12px;
                }

                .resource-link {
                    display: flex;
                    gap: 12px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: var(--radius);
                    text-decoration: none;
                    transition: var(--transition);
                }

                .resource-link:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: var(--primary);
                    transform: translateY(-2px);
                }

                .link-title {
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }

                .link-desc {
                    font-size: 13px;
                    color: var(--text-gray);
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    padding: 60px 20px;
                    text-align: center;
                    color: var(--text-gray);
                }
            `}</style>
        </div>
    );
};

export default DeveloperPortal;
