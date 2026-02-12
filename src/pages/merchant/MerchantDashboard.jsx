import React from 'react';
import {
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCcw,
    Wallet,
    TrendingUp,
    CreditCard,
    MoreVertical,
    ArrowRight,
    Zap,
    Download,
    Banknote,
    ArrowLeftRight,
    HelpCircle
} from 'lucide-react';
import Tooltip from '../../components/common/Tooltip';
import Alert from '../../components/common/Alert';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

const data = [
    { name: 'Lun', income: 4000, volume: 2400 },
    { name: 'Mar', income: 3000, volume: 1398 },
    { name: 'Mer', income: 2000, volume: 9800 },
    { name: 'Jeu', income: 2780, volume: 3908 },
    { name: 'Ven', income: 1890, volume: 4800 },
    { name: 'Sam', income: 2390, volume: 3800 },
    { name: 'Dim', income: 3490, volume: 4300 },
];

const MerchantDashboard = () => {
    return (
        <div className="dashboard-container animate-slide-up">
            <header className="page-header">
                <div>
                    <h1 className="text-gradient">Bonjour, Jean</h1>
                    <p className="subtitle">Voici un aperçu de l'activité de votre plateforme aujourd'hui.</p>
                </div>
                <div className="header-actions">
                    <div className="status-badge-container">
                        <span className="badge badge-warning">
                            <HelpCircle size={14} /> Mode Sandbox
                        </span>
                        <Tooltip text="Vous êtes en mode test. Les transactions ne sont pas réelles.">
                            <div className="ml-1 cursor-help"><HelpCircle size={14} className="opacity-40" /></div>
                        </Tooltip>
                    </div>
                    <button className="btn btn-secondary">
                        <RefreshCcw size={16} />
                        Actualiser
                    </button>
                    <button className="btn btn-primary">
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </header>

            <Alert
                type="info"
                title="Configuration Requise"
                message="Complétez votre profil KYC pour demander l'accès au mode Production et commencer à accepter des paiements réels."
            />

            {/* Stats Grid */}
            <div className="stats-grid">
                <motion.div
                    className="card stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="card-top">
                        <div className="icon-wrapper primary">
                            <Banknote size={20} />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="stat-label">Solde Principal (USD)</span>
                            <Tooltip text="Fonds disponibles pour retrait vers votre compte bancaire.">
                                <HelpCircle size={14} className="opacity-40 cursor-help" />
                            </Tooltip>
                        </div>
                    </div>
                    <div className="stat-value">$ 12,450.00</div>
                    <div className="stat-footer">
                        <span className="trend positive">
                            <TrendingUp size={14} /> +12.5%
                        </span>
                        <span className="period">Depuis le mois dernier</span>
                    </div>
                </motion.div>

                <motion.div
                    className="card stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="card-top">
                        <div className="icon-wrapper secondary">
                            <Wallet size={20} />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="stat-label">Solde Mobile (CDF)</span>
                            <Tooltip text="Total des collectes via Mobile Money (M-Pesa, Orange, Airtel).">
                                <HelpCircle size={14} className="opacity-40 cursor-help" />
                            </Tooltip>
                        </div>
                    </div>
                    <div className="stat-value">₣ 3,250,000</div>
                    <div className="stat-footer">
                        <span className="trend positive">
                            <TrendingUp size={14} /> +8.2%
                        </span>
                        <span className="period">Depuis le mois dernier</span>
                    </div>
                </motion.div>

                <motion.div
                    className="card stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="card-top">
                        <div className="icon-wrapper accent">
                            <Zap size={20} />
                        </div>
                        <span className="stat-label">Volume Total (30j)</span>
                    </div>
                    <div className="stat-value">$ 45,920.00</div>
                    <div className="stat-footer">
                        <span className="trend positive">
                            <TrendingUp size={14} /> +15.5%
                        </span>
                        <span className="period">Flux de transactions</span>
                    </div>
                </motion.div>
            </div>

            <div className="main-grid">
                {/* Chart Section */}
                <section className="chart-section card">
                    <div className="section-header">
                        <div>
                            <h3>Flux de Revenus</h3>
                            <p className="text-xs text-gray">Analyse hebdomadaire des revenus</p>
                        </div>
                        <div className="chart-legend">
                            <span className="legend-item"><span className="dot primary"></span> Revenus</span>
                            <span className="legend-item"><span className="dot secondary"></span> Volume</span>
                        </div>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--info)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="var(--info)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--text-gray)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="var(--text-gray)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-deeper)',
                                        borderColor: 'var(--glass-border)',
                                        borderRadius: '12px',
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                    itemStyle={{ color: '#fff', fontSize: '13px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    stroke="var(--primary)"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorIncome)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="volume"
                                    stroke="var(--info)"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    fillOpacity={1}
                                    fill="url(#colorVolume)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Quick Actions */}
                <aside className="quick-actions-sidebar">
                    <h3 className="mb-4">Actions Rapides</h3>
                    <div className="action-buttons">
                        <button className="action-tile">
                            <div className="tile-icon"><ArrowUpRight size={20} /></div>
                            <span>Retrait</span>
                        </button>
                        <button className="action-tile">
                            <div className="tile-icon"><ArrowLeftRight size={20} /></div>
                            <span>Change</span>
                        </button>
                        <button className="action-tile">
                            <div className="tile-icon"><CreditCard size={20} /></div>
                            <span>API Keys</span>
                        </button>
                        <button className="action-tile">
                            <div className="tile-icon"><Zap size={20} /></div>
                            <span>Instant</span>
                        </button>
                    </div>

                    <div className="conversion-preview card mt-4 border-glow">
                        <div className="flex items-center gap-2 mb-4">
                            <RefreshCcw size={18} className="text-primary" />
                            <h4>Conversion Express</h4>
                        </div>
                        <div className="conv-input-group">
                            <div className="conv-input">
                                <span className="label">Vendre</span>
                                <input type="number" defaultValue="100.00" />
                                <span className="currency">USD</span>
                            </div>
                            <div className="conv-divider">
                                <div className="divider-line"></div>
                                <div className="conv-arrow"><ArrowLeftRight size={14} /></div>
                                <div className="divider-line"></div>
                            </div>
                            <div className="conv-output">
                                <span className="label">Recevoir</span>
                                <div className="val">285,450.00</div>
                                <span className="currency">CDF</span>
                            </div>
                            <div className="input-group-helper">
                                <HelpCircle size={12} /> Frais de change inclus (1.5%)
                            </div>
                        </div>
                        <button className="btn btn-primary w-full mt-4">Convertir</button>
                        <p className="rate-info">Taux Garanti: 1 USD = 2,854.5 CDF</p>
                    </div>
                </aside>
            </div>

            {/* Transactions Table */}
            <section className="transactions-section card mt-4">
                <div className="section-header">
                    <div>
                        <h3>Transactions Récentes</h3>
                        <p className="text-xs text-gray">Derniers flux de paiements</p>
                    </div>
                    <button className="link-btn">
                        Voir tout l'historique <ArrowRight size={16} />
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="alma-table">
                        <thead>
                            <tr>
                                <th>Transaction ID</th>
                                <th>Client / Destination</th>
                                <th>Date & Heure</th>
                                <th>Montant Net</th>
                                <th>Opérateur</th>
                                <th>Statut</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i}>
                                    <td><span className="ref">TXN-{2024 + i}-00{i}84</span></td>
                                    <td>
                                        <div className="client-info">
                                            <div className="avatar-sm">C{i}</div>
                                            <div className="client-details">
                                                <p className="name">Client Kinshasa {i}</p>
                                                <p className="phone">+243 81 234 {i}2 7{i}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="date">28 Jan, 2026 • 11:2{i}</td>
                                    <td>
                                        <div className="amount-col">
                                            <span className="net-amount">$ 45.00</span>
                                            <span className="fee-amount">Frais: $ 1.20</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`op-tag ${i % 2 === 0 ? 'mpesa' : 'orange'}`}>
                                            {i % 2 === 0 ? 'M-Pesa' : 'Orange Money'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="status-cell">
                                            <div className="status-dot success"></div>
                                            <span className="text-success">Réussi</span>
                                        </div>
                                    </td>
                                    <td>
                                        <button className="more-btn">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <style jsx>{`
        .dashboard-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xl);
        }

        .subtitle {
          color: var(--text-gray);
          opacity: 0.7;
          font-size: 1.1rem;
          margin-top: 4px;
        }

        .header-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }

        .stat-card {
            padding: var(--spacing-lg);
            border-bottom: 2px solid transparent;
        }

        .stat-card:hover {
            border-bottom-color: var(--primary);
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
        }

        .icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .icon-wrapper.primary { background: rgba(243, 156, 18, 0.1); color: var(--primary); }
        .icon-wrapper.secondary { background: rgba(52, 152, 219, 0.1); color: var(--info); }
        .icon-wrapper.accent { background: rgba(39, 174, 96, 0.1); color: var(--success); }

        .stat-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-gray);
          opacity: 0.8;
        }

        .stat-value {
          font-family: 'Poppins', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-white);
          margin-bottom: var(--spacing-sm);
        }

        .stat-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
        }

        .trend.positive {
          color: var(--success);
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 700;
        }

        .period { color: var(--text-gray); opacity: 0.5; }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: var(--spacing-md);
        }

        .chart-section {
            padding: var(--spacing-lg);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .chart-legend {
          display: flex;
          gap: var(--spacing-md);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-gray);
        }

        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.primary { background: var(--primary); box-shadow: 0 0 10px var(--primary); }
        .dot.secondary { background: var(--info); box-shadow: 0 0 10px var(--info); }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-sm);
        }

        .action-tile {
          background: var(--bg-deeper);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-lg);
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: var(--transition);
          color: var(--text-white);
        }

        .action-tile:hover {
          background: rgba(243, 156, 18, 0.05);
          border-color: var(--primary);
          transform: translateY(-4px);
        }

        .tile-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          transition: var(--transition);
        }

        .action-tile:hover .tile-icon {
            background: var(--primary);
            color: white;
        }

        .border-glow {
            border: 1px solid rgba(243, 156, 18, 0.2);
            box-shadow: 0 0 20px rgba(243, 156, 18, 0.05);
        }

        .conv-input-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .conv-input, .conv-output {
            background: rgba(0, 0, 0, 0.2);
            padding: 12px 16px;
            border-radius: var(--radius-md);
            display: flex;
            flex-direction: column;
        }

        .conv-input .label, .conv-output .label {
            font-size: 0.75rem;
            color: var(--text-gray);
            opacity: 0.5;
            margin-bottom: 2px;
        }

        .conv-input input {
            background: transparent;
            border: none;
            color: var(--text-white);
            font-size: 1.25rem;
            font-weight: 700;
            font-family: 'Poppins', sans-serif;
            width: 100%;
            outline: none;
        }

        .conv-output .val {
            font-size: 1.25rem;
            font-weight: 700;
            font-family: 'Poppins', sans-serif;
            color: var(--primary);
        }

        .currency {
            font-size: 0.75rem;
            font-weight: 800;
            color: var(--text-gray);
            align-self: flex-end;
            margin-top: -16px;
        }

        .conv-divider {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: -8px 0;
            z-index: 2;
        }

        .divider-line { flex: 1; height: 1px; background: rgba(255, 255, 255, 0.05); }
        
        .conv-arrow { 
            width: 28px; height: 28px; 
            background: var(--bg-deeper); 
            border: 1px solid rgba(255, 255, 255, 0.1); 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: var(--primary);
        }

        .rate-info {
          font-size: 0.75rem;
          color: var(--text-gray);
          opacity: 0.5;
          text-align: center;
          margin-top: var(--spacing-sm);
        }

        .w-full { width: 100%; }
        .mb-4 { margin-bottom: 1.5rem; }
        .mt-4 { margin-top: 2rem; }

        .table-responsive {
          margin-top: var(--spacing-sm);
          overflow-x: auto;
        }

        .alma-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 8px;
        }

        .alma-table th {
          text-align: left;
          padding: 12px 16px;
          color: var(--text-gray);
          font-weight: 600;
          font-size: 0.85rem;
          opacity: 0.6;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .alma-table tbody tr {
          background: rgba(255, 255, 255, 0.02);
          transition: var(--transition);
        }

        .alma-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.04);
          transform: scale(1.002);
        }

        .alma-table td {
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }

        .alma-table td:first-child { border-left: 1px solid rgba(255, 255, 255, 0.03); border-top-left-radius: var(--radius-md); border-bottom-left-radius: var(--radius-md); }
        .alma-table td:last-child { border-right: 1px solid rgba(255, 255, 255, 0.03); border-top-right-radius: var(--radius-md); border-bottom-right-radius: var(--radius-md); }

        .ref { font-family: 'Fira Code', monospace; color: var(--primary); font-weight: 600; font-size: 0.85rem; }
        
        .client-info { display: flex; align-items: center; gap: var(--spacing-sm); }
        
        .avatar-sm { 
            width: 32px; height: 32px; 
            background: var(--bg-deeper); 
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 50%; 
            font-size: 0.75rem; 
            font-weight: 700;
            display: flex; 
            align-items: center; 
            justify-content: center;
            color: var(--primary);
        }

        .client-details .name { font-weight: 600; font-size: 0.9rem; color: var(--text-white); }
        .client-details .phone { font-size: 0.75rem; color: var(--text-gray); opacity: 0.6; }

        .date { color: var(--text-gray); font-size: 0.85rem; }
        
        .amount-col { display: flex; flex-direction: column; }
        .net-amount { font-weight: 700; color: var(--text-white); }
        .fee-amount { font-size: 0.75rem; color: var(--text-gray); opacity: 0.6; }

        .op-tag {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .op-tag.mpesa { background: rgba(234, 28, 36, 0.1); color: #ea1c24; border: 1px solid rgba(234, 28, 36, 0.2); }
        .op-tag.orange { background: rgba(255, 121, 0, 0.1); color: #ff7900; border: 1px solid rgba(255, 121, 0, 0.2); }

        .status-cell { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.85rem; }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; }
        .status-dot.success { background: var(--success); box-shadow: 0 0 10px var(--success); }

        .more-btn { background: transparent; border: none; color: var(--text-gray); opacity: 0.5; cursor: pointer; transition: var(--transition); }
        .more-btn:hover { color: var(--text-white); opacity: 1; }

        .link-btn { background: transparent; border: none; color: var(--primary); font-weight: 600; font-family: 'Poppins', sans-serif; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: var(--transition); }
        .link-btn:hover { gap: 12px; opacity: 0.8; }

        @media (max-width: 1280px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .main-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </div>
    );
};

export default MerchantDashboard;
