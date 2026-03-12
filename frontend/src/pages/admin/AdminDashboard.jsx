import { ShieldAlert, Users } from "lucide-react"

const AdminDashboard = () => {
    return <div className="card animate-slide-up">
        <div className="section-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div className="flex items-center gap-2">
            <ShieldAlert size={24} className="text-primary" />
            <h2 className="brand-gradient">Supervision Administration</h2>
            </div>
            <span className="badge badge-error">Accès Administrateur</span>
        </div>

        <p className="mb-4">Panneau de contrôle global pour les administrateurs Alma Pay.</p>

        <div className="stats-grid">
            <div className="card glass-card">
            <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-primary" />
                <h4 style={{ margin: 0 }}>Marchands Actifs</h4>
            </div>
            <p className="balance-amount" style={{ fontSize: '1.5rem', margin: 0 }}>124</p>
            </div>
            <div className="card glass-card">
            <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-primary" />
                <h4 style={{ margin: 0 }}>Volume Système</h4>
            </div>
            <p className="balance-amount" style={{ fontSize: '1.5rem', margin: 0 }}>$ 1.2M</p>
            </div>
        </div>
    </div>
}

export default AdminDashboard