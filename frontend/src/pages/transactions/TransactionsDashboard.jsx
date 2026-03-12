import { CreditCard } from "lucide-react";

const TransactionsDashboard = () => {
    return <div className="card animate-slide-up" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <div className="header-icon" style={{ margin: '0 auto var(--spacing-md)' }}>
            <CreditCard size={32} color="var(--primary)" />
        </div>
        <h2>Gestion des Transactions</h2>
        <p className="subtitle">Consultez et gérez l'historique de vos paiements mobiles.</p>
        <div className="empty-state mt-4" style={{ opacity: 0.5 }}>
            <p>Aucune transaction à afficher pour le moment.</p>
        </div>
    </div>;
}

export default TransactionsDashboard