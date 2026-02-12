import React, { useState } from 'react';
import { Terminal, Copy, Check, Eye, EyeOff, Globe, BookOpen, Code, Key, Settings, ExternalLink, HelpCircle, ShieldAlert } from 'lucide-react';
import Tooltip from '../../components/common/Tooltip';

const IntegrationPage = () => {
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState(false);

    const apiKey = "YOUR_ALMA_API_KEY_HERE"; // Replace with your actual key

    const copyToClipboard = () => {
        navigator.clipboard.writeText(apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const codeSnippet = `
// Exemple d'intégration avec Alma SDK
const alma = new Alma('votre_cle_publique');

const payment = await alma.createPayment({
  amount: 4500,
  currency: 'USD',
  order_id: 'ORD-9984',
  success_url: 'https://votre-site.com/success',
  cancel_url: 'https://votre-site.com/cancel'
});

// Rediriger le client vers l'interface de paiement
window.location.href = payment.checkout_url;
  `.trim();

    return (
        <div className="integration-page animate-slide-up">
            <header className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <Settings size={24} color="var(--primary)" />
                    </div>
                    <div>
                        <h1>Intégration API</h1>
                        <p className="subtitle">Connectez votre application à Alma en quelques minutes.</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline">
                        <Terminal size={18} />
                        API Reference
                    </button>
                    <button className="btn btn-primary">
                        <BookOpen size={18} />
                        Documentation
                    </button>
                </div>
            </header>

            <div className="integration-grid">
                <section className="keys-section card">
                    <div className="section-header">
                        <div className="flex items-center gap-2">
                            <Key size={20} className="text-primary" />
                            <h3>Vos Clés d'API</h3>
                            <Tooltip text="Utilisez ces clés pour authentifier vos requêtes vers l'API Alma.">
                                <HelpCircle size={16} className="opacity-40 cursor-help" />
                            </Tooltip>
                        </div>
                        <div className="env-toggle">
                            <span className="active">Production</span>
                            <span>Test</span>
                        </div>
                    </div>

                    <div className="key-container">
                        <div className="flex items-center gap-1 mb-1">
                            <label>Clé Secrète (Secret Key)</label>
                            <Tooltip text="À utiliser côté serveur uniquement. Ne jamais exposer dans le navigateur.">
                                <HelpCircle size={14} className="opacity-40 cursor-help" />
                            </Tooltip>
                        </div>
                        <div className="key-box">
                            <span className="key-text">
                                {showKey ? apiKey : "••••••••••••••••••••••••••••••••"}
                            </span>
                            <div className="key-actions">
                                <button className="action-icon" onClick={() => setShowKey(!showKey)}>
                                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <button className="action-icon" onClick={copyToClipboard}>
                                    {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="input-group-helper mt-1 text-error flex items-center gap-1">
                            <ShieldAlert size={14} /> Ne partagez jamais votre clé secrète. En cas de fuite, régénérez-la immédiatement.
                        </div>
                    </div>

                    <div className="key-container mt-4">
                        <div className="flex items-center gap-1 mb-1">
                            <label>Clé Publique (Public Key)</label>
                            <Tooltip text="Peut être utilisée dans votre code frontend ou mobile.">
                                <HelpCircle size={14} className="opacity-40 cursor-help" />
                            </Tooltip>
                        </div>
                        <div className="key-box">
                            <span className="key-text">pk_live_00AlmaPlatform99</span>
                            <button className="action-icon"><Copy size={18} /></button>
                        </div>
                    </div>
                </section>

                <section className="webhooks-section card">
                    <div className="section-header">
                        <div className="flex items-center gap-2">
                            <Globe size={20} className="text-primary" />
                            <h3>Webhooks</h3>
                        </div>
                        <Tooltip text="Un Webhook permet à Alma de pousser des infos vers votre serveur.">
                            <HelpCircle size={16} className="opacity-40 cursor-help" />
                        </Tooltip>
                        <button className="btn-add">Configurer</button>
                    </div>
                    <p className="text-gray text-sm mb-4">Recevez des notifications en temps réel pour chaque événement (paiement réussi, échec, etc.).</p>
                    <div className="input-group-helper mb-4 italic">
                        Guidage : Votre URL doit être accessible publiquement et supporter HTTPS.
                    </div>

                    <div className="webhook-item">
                        <div className="webhook-info">
                            <div className="webhook-url">https://api.monsite.com/webhooks/alma</div>
                            <div className="webhook-meta">
                                <span className="status-dot success"></span>
                                <span className="text-xs">Dernière réponse: 200 OK</span>
                            </div>
                        </div>
                        <span className="badge badge-success">Actif</span>
                    </div>

                    <button className="btn-text">
                        Voir les logs de webhook <ExternalLink size={14} />
                    </button>
                </section>
            </div>

            <section className="code-example card mt-4">
                <div className="section-header">
                    <div className="flex items-center gap-2">
                        <Code size={20} className="text-primary" />
                        <h3>Exemple de code (Node.js)</h3>
                    </div>
                    <div className="language-tabs">
                        <span className="active">Javascript</span>
                        <span>PHP</span>
                        <span>Python</span>
                        <span>Ruby</span>
                    </div>
                </div>
                <div className="snippet-container">
                    <pre><code>{codeSnippet}</code></pre>
                    <button className="copy-snippet" onClick={copyToClipboard}>
                        <Copy size={14} /> Copier
                    </button>
                </div>
            </section>

            <style jsx>{`
        .integration-page {
            max-width: 1200px;
            margin: 0 auto;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-xl);
        }

        .header-content {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
        }

        .header-icon {
            width: 56px;
            height: 56px;
            background: rgba(243, 156, 18, 0.1);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-lg);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .header-actions {
            display: flex;
            gap: var(--spacing-sm);
        }

        .subtitle {
            color: var(--text-gray);
            font-size: 1.1rem;
            margin-top: 4px;
        }

        .integration-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: var(--spacing-md); 
        }
        
        .env-toggle {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .env-toggle span { padding: 6px 12px; border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition); }
        .env-toggle span.active { background: var(--primary); color: white; }

        .key-container { margin-top: var(--spacing-md); }
        .key-container label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-gray); margin-bottom: 8px; }
        
        .key-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 0, 0, 0.2);
          padding: 14px 16px;
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-family: 'Fira Code', monospace;
          transition: var(--transition);
        }

        .key-box:hover {
            border-color: rgba(243, 156, 18, 0.3);
            background: rgba(0, 0, 0, 0.3);
        }

        .key-text { color: var(--primary); font-size: 0.95rem; }
        .key-actions { display: flex; gap: var(--spacing-sm); }
        
        .action-icon { 
            background: transparent; 
            border: none; 
            color: var(--text-gray); 
            opacity: 0.5;
            cursor: pointer; 
            padding: 4px;
            transition: var(--transition);
        }
        
        .action-icon:hover { 
            color: var(--primary); 
            opacity: 1;
            transform: scale(1.1);
        }

        .helper-text {
            font-size: 0.75rem;
            color: var(--error);
            margin-top: 6px;
            opacity: 0.8;
        }

        .btn-add { 
            background: rgba(243, 156, 18, 0.1); 
            border: 1px solid var(--primary); 
            color: var(--primary); 
            padding: 6px 16px; 
            border-radius: var(--radius-md); 
            font-size: 0.85rem; 
            font-weight: 600; 
            cursor: pointer;
            transition: var(--transition);
        }
        
        .btn-add:hover {
            background: var(--primary);
            color: white;
        }

        .webhook-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-lg);
          margin-top: var(--spacing-sm);
        }

        .webhook-info { display: flex; flex-direction: column; gap: 4px; }
        .webhook-url { font-size: 0.9rem; color: var(--text-white); font-weight: 500; }
        .webhook-meta { display: flex; align-items: center; gap: 8px; }
        
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.success { background: var(--success); box-shadow: 0 0 8px var(--success); }

        .btn-text {
            background: transparent;
            border: none;
            color: var(--primary);
            font-size: 0.85rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: var(--spacing-md);
            cursor: pointer;
            opacity: 0.8;
            transition: var(--transition);
        }

        .btn-text:hover { opacity: 1; text-decoration: underline; }

        .language-tabs { display: flex; gap: var(--spacing-md); font-size: 0.9rem; color: var(--text-gray); font-weight: 600; }
        .language-tabs span { cursor: pointer; padding: 4px 0; transition: var(--transition); position: relative; }
        .language-tabs span.active { color: var(--primary); }
        .language-tabs span.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--primary);
            border-radius: 2px;
        }

        .snippet-container { 
          position: relative; 
          background: #05070A; 
          padding: 1.5rem; 
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.05);
          margin-top: var(--spacing-md);
          overflow-x: auto;
        }

        .snippet-container pre { margin: 0; color: #E2E8F0; font-size: 0.9rem; line-height: 1.7; }
        
        .copy-snippet {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 6px 12px;
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: var(--transition);
        }

        .copy-snippet:hover { background: rgba(255, 255, 255, 0.1); border-color: var(--primary); }

        .text-sm { font-size: 0.85rem; }
        .text-xs { font-size: 0.75rem; color: var(--text-gray); opacity: 0.6; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .gap-2 { gap: 8px; }
        .mb-4 { margin-bottom: 1rem; }
        .mt-4 { margin-top: 1rem; }
        
        @media (max-width: 1024px) {
            .integration-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </div>
    );
};

export default IntegrationPage;
