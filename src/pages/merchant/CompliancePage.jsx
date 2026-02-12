import React, { useState, useEffect } from 'react';
import {
    ShieldCheck, FileText, CheckCircle2, Clock, AlertCircle, Upload,
    Shield, ArrowRight, Info, HelpCircle, X, Loader, Download, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Tooltip from '../../components/common/Tooltip';
import Alert from '../../components/common/Alert';

const CompliancePage = () => {
    const [kycStatus, setKycStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadingDoc, setUploadingDoc] = useState(null);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        fetchKYCStatus();
    }, []);

    const fetchKYCStatus = async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual API call
            // const response = await fetch('/api/kyc/status', {
            //     headers: { 'Authorization': `Bearer ${token}` }
            // });
            // const data = await response.json();

            // Mock data for demonstration
            setKycStatus({
                user_status: 'pending_validation',
                company_type: 'company',
                completion_percentage: 60,
                validated_at: null,
                required_documents: [
                    {
                        type: 'rccm',
                        required: true,
                        submitted: true,
                        status: 'pending',
                        document: {
                            id: '1',
                            file_name: 'rccm_entreprise.pdf',
                            created_at: '2026-02-08T10:30:00Z',
                            status: 'pending'
                        }
                    },
                    {
                        type: 'company_statutes',
                        required: true,
                        submitted: true,
                        status: 'approved',
                        document: {
                            id: '2',
                            file_name: 'statuts_societe.pdf',
                            created_at: '2026-02-07T14:20:00Z',
                            status: 'approved',
                            reviewed_at: '2026-02-08T09:00:00Z'
                        }
                    },
                    {
                        type: 'tax_number',
                        required: true,
                        submitted: true,
                        status: 'approved',
                        document: {
                            id: '3',
                            file_name: 'impot_numero.pdf',
                            created_at: '2026-02-07T16:45:00Z',
                            status: 'approved'
                        }
                    },
                    {
                        type: 'rib',
                        required: true,
                        submitted: false,
                        status: 'not_submitted',
                        document: null
                    },
                    {
                        type: 'shareholder_id',
                        required: true,
                        submitted: false,
                        status: 'not_submitted',
                        document: null
                    }
                ]
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching KYC status:', error);
            setAlert({ type: 'error', message: 'Erreur lors du chargement des données' });
            setLoading(false);
        }
    };

    const handleFileUpload = async (documentType, file) => {
        try {
            setUploadingDoc(documentType);

            const formData = new FormData();
            formData.append('document', file);
            formData.append('document_type', documentType);

            // TODO: Replace with actual API call
            // const response = await fetch('/api/kyc/upload', {
            //     method: 'POST',
            //     headers: { 'Authorization': `Bearer ${token}` },
            //     body: formData
            // });

            // Simulate upload
            await new Promise(resolve => setTimeout(resolve, 1500));

            setAlert({ type: 'success', message: 'Document soumis avec succès' });
            fetchKYCStatus(); // Refresh status
        } catch (error) {
            console.error('Upload error:', error);
            setAlert({ type: 'error', message: 'Erreur lors du téléchargement' });
        } finally {
            setUploadingDoc(null);
        }
    };

    const handleDeleteDocument = async (documentId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
            return;
        }

        try {
            // TODO: API call to delete document
            setAlert({ type: 'success', message: 'Document supprimé' });
            fetchKYCStatus();
        } catch (error) {
            setAlert({ type: 'error', message: 'Erreur lors de la suppression' });
        }
    };

    const getDocumentLabel = (type) => {
        const labels = {
            'rccm': 'Registre de Commerce (RCCM)',
            'company_statutes': 'Statuts de la Société',
            'tax_number': 'Numéro d\'Impôt',
            'rib': 'Relevé Identité Bancaire (RIB)',
            'shareholder_id': 'Carte d\'Identité Actionnaire Principal',
            'national_id': 'Carte d\'Identité Nationale',
            'proof_of_address': 'Justificatif de Domicile'
        };
        return labels[type] || type;
    };

    const getDocumentHint = (type) => {
        const hints = {
            'rccm': 'Document officiel d\'immatriculation au greffe du tribunal de commerce.',
            'company_statutes': 'Statuts juridiques signés de votre société.',
            'tax_number': 'Attestation de votre numéro d\'identification fiscale.',
            'rib': 'Document officiel de votre banque avec IBAN et coordonnées bancaires.',
            'shareholder_id': 'Pièce d\'identité de l\'actionnaire majoritaire ou gérant.',
            'national_id': 'Carte d\'identité nationale ou passeport valide.',
            'proof_of_address': 'Facture récente (max 3 mois) : électricité, eau, téléphone.'
        };
        return hints[type] || '';
    };

    const getStatusBadge = (status) => {
        const badges = {
            'approved': { label: 'Approuvé', className: 'badge-success' },
            'pending': { label: 'En révision', className: 'badge-warning' },
            'rejected': { label: 'Rejeté', className: 'badge-error' },
            'not_submitted': { label: 'Non soumis', className: 'badge-neutral' }
        };
        return badges[status] || badges['not_submitted'];
    };

    const calculateSteps = () => {
        if (!kycStatus) return [];

        const allApproved = kycStatus.required_documents.every(doc => doc.status === 'approved');
        const hasRejected = kycStatus.required_documents.some(doc => doc.status === 'rejected');
        const hasPending = kycStatus.required_documents.some(doc => doc.status === 'pending');
        const allSubmitted = kycStatus.required_documents.every(doc => doc.submitted);

        return [
            {
                title: 'Informations de base',
                status: 'completed',
                icon: <CheckCircle2 size={20} />
            },
            {
                title: 'Soumission des documents',
                status: allSubmitted ? 'completed' : 'pending',
                icon: allSubmitted ? <CheckCircle2 size={20} /> : <Clock size={20} />
            },
            {
                title: 'Révision administrative',
                status: hasPending ? 'pending' : (hasRejected ? 'missing' : (allApproved ? 'completed' : 'waiting')),
                icon: hasPending ? <Clock size={20} /> : (hasRejected ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />)
            },
            {
                title: 'Activation Production',
                status: kycStatus.user_status === 'active' ? 'completed' : 'waiting',
                icon: kycStatus.user_status === 'active' ? <CheckCircle2 size={20} /> : <Clock size={20} />
            }
        ];
    };

    if (loading) {
        return (
            <div className="compliance-page flex items-center justify-center min-vh-100">
                <Loader className="spin" size={32} color="var(--primary)" />
            </div>
        );
    }

    const steps = calculateSteps();
    const missingCount = kycStatus.required_documents.filter(doc => !doc.submitted).length;

    return (
        <div className="compliance-page animate-slide-up">
            <header className="page-header">
                <div className="header-content">
                    <div className="header-badge">
                        <Shield color="var(--primary)" size={24} />
                    </div>
                    <div>
                        <h1>Conformité & Vérification KYC/KYB</h1>
                        <p className="subtitle">
                            Soumettez vos documents pour activer le mode Production et débloquer les retraits.
                        </p>
                    </div>
                </div>
                <div className={`status-badge ${kycStatus.user_status === 'active' ? 'success' : 'warning'}`}>
                    {kycStatus.user_status === 'active' ? (
                        <><CheckCircle2 size={16} /> Compte Activé</>
                    ) : (
                        <><Clock size={16} /> {kycStatus.user_status === 'pending_validation' ? 'Validation en cours' : 'Action requise'}</>
                    )}
                </div>
            </header>

            {alert && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                </motion.div>
            )}

            <div className="compliance-grid">
                {/* Progress Section */}
                <section className="steps-card card">
                    <div className="section-header">
                        <h3>Progression KYC</h3>
                        <span className="progress-text">{kycStatus.completion_percentage}% Complété</span>
                    </div>
                    <div className="progress-bar-container">
                        <motion.div
                            className="progress-bar"
                            initial={{ width: 0 }}
                            animate={{ width: `${kycStatus.completion_percentage}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </div>
                    <div className="steps-list">
                        {steps.map((step, i) => (
                            <div key={i} className={`step-item ${step.status}`}>
                                <div className={`step-icon-wrapper ${step.status}`}>
                                    {step.icon}
                                </div>
                                <div className="step-content">
                                    <p className="step-title">{step.title}</p>
                                    <p className="step-status-text">
                                        {step.status === 'completed' ? 'Terminé' :
                                            step.status === 'pending' ? 'En cours' :
                                                step.status === 'waiting' ? 'En attente' : 'Action requise'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Documents Upload Section */}
                <section className="documents-upload card">
                    <div className="section-header">
                        <div className="flex items-center gap-2">
                            <FileText size={20} className="text-primary" />
                            <h3>Documents Requis</h3>
                            <Tooltip text="Ces documents sont nécessaires pour valider l'existence légale de votre entreprise.">
                                <HelpCircle size={16} className="opacity-40 cursor-help" />
                            </Tooltip>
                        </div>
                        <span className="text-xs text-gray">PDF, JPG, PNG (Max 5MB)</span>
                    </div>

                    {missingCount > 0 && (
                        <Alert
                            type="warning"
                            message={`Il vous manque ${missingCount} document${missingCount > 1 ? 's' : ''} obligatoire${missingCount > 1 ? 's' : ''} pour finaliser votre dossier.`}
                        />
                    )}

                    <div className="doc-list">
                        {kycStatus.required_documents.map((docReq) => {
                            const badge = getStatusBadge(docReq.status);
                            const isUploading = uploadingDoc === docReq.type;

                            return (
                                <div key={docReq.type} className={`doc-item ${docReq.status}`}>
                                    <div className="doc-meta">
                                        <div className={`doc-icon-bg ${docReq.status}`}>
                                            <FileText size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-1">
                                                <p className="doc-name">{getDocumentLabel(docReq.type)}</p>
                                                <Tooltip text={getDocumentHint(docReq.type)}>
                                                    <HelpCircle size={14} className="opacity-40 cursor-help" />
                                                </Tooltip>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`badge ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                                {docReq.document && (
                                                    <span className="text-xs text-gray">
                                                        {new Date(docReq.document.created_at).toLocaleDateString('fr-FR')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="doc-actions">
                                        {docReq.submitted ? (
                                            <>
                                                {docReq.status === 'pending' || docReq.status === 'rejected' ? (
                                                    <button
                                                        className="btn-icon-small"
                                                        onClick={() => handleDeleteDocument(docReq.document.id)}
                                                        title="Supprimer"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                ) : null}
                                                {docReq.status === 'approved' && (
                                                    <CheckCircle2 size={20} className="text-success" />
                                                )}
                                            </>
                                        ) : (
                                            <label className="btn-upload">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) handleFileUpload(docReq.type, file);
                                                    }}
                                                    style={{ display: 'none' }}
                                                    disabled={isUploading}
                                                />
                                                {isUploading ? (
                                                    <><Loader className="spin" size={16} /> Upload...</>
                                                ) : (
                                                    <><Upload size={16} /> Charger</>
                                                )}
                                            </label>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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

                .btn-icon-small {
                    padding: 6px;
                    background: rgba(231, 76, 60, 0.1);
                    border: 1px solid rgba(231, 76, 60, 0.3);
                    border-radius: var(--radius-sm);
                    color: var(--error);
                    cursor: pointer;
                    transition: var(--transition);
                }

                .btn-icon-small:hover {
                    background: rgba(231, 76, 60, 0.2);
                }

                .doc-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .badge-neutral {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text-gray);
                }
            `}</style>
        </div>
    );
};

export default CompliancePage;
