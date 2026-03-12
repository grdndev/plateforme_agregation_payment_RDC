import { Banknote } from "lucide-react"

const VirementsDashboard = () => {
    return <div className="card animate-slide-up" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <div className="header-icon" style={{ margin: '0 auto var(--spacing-md)' }}>
            <Banknote size={32} color="var(--primary)" />
        </div>
        <h2>Gestion des Virements</h2>
        <p className="subtitle">Préparez vos transferts bancaires groupés et suivez vos retraits.</p>
        <div className="empty-state mt-4" style={{ opacity: 0.5 }}>
            <p>Le module de virement sera disponible après validation de votre compte.</p>
        </div>
    </div>
}

export default VirementsDashboard