import {
    ArrowUpRight, RefreshCcw,
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
    Tooltip as TooltipBox,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

const data = [
    { name: 'Lun', income: 4000, volume: 2400 },
    { name: 'Mar', income: 3000, volume: 1398 },
    { name: 'Mer', income: 2000, volume: 9800 },
    { name: 'Jeu', income: 2780, volume: 3908 },
    { name: 'Ven', income: 1890, volume: 4800 },
    { name: 'Sam', income: 2390, volume: 3800 },
    { name: 'Dim', income: 3490, volume: 4300 },
];

export default function MerchantDashboard() {
    const { user } = useAuth();

    return (
        <div>
            <header className="flex">
                <div className="flex flex-col gap-3 grow">
                    <h1 className="text-5xl font-black text-primary">Bonjour{user?.firstname ? `, ${user.firstname}` : ""}</h1>
                    <p className="text-gray-400">Voici un aperçu de l'activité de votre plateforme aujourd'hui.</p>
                </div>
                <div className="flex flex-col gap-3">
                    <div>
                        <span className="text-primary px-4 py-1 border-yellow-500/30 bg-yellow-500/10 rounded-full border-1 flex items-center gap-2">
                            <Tooltip text={<div>Vous êtes en mode test.<br/>Les transactions ne sont pas réelles.</div>}>
                                <HelpCircle size={14} />
                            </Tooltip>
                            Mode Sandbox
                        </span>
                    </div>
                    <button className="flex items-center gap-2 justify-center border-1 rounded-md p-2 border-white/5 bg-transparent transition duration-500 hover:border-white/10 hover:bg-deeper">
                        <RefreshCcw size={16} />
                        <span>Actualiser</span>
                    </button>
                    <button className="flex items-center gap-2 justify-center border-1 rounded-md p-2 border-white/5 bg-transparent transition duration-500 hover:border-white/10 hover:bg-deeper">
                        <Download size={16} />
                        <span>Export CSV</span>
                    </button>
                </div>
            </header>

            <Alert
                type="info"
                title="Configuration Requise"
                message="Complétez votre profil KYC pour demander l'accès au mode Production et commencer à accepter des paiements réels."
            />

            {/* Stats Grid */}
            <div>
                <motion.div

                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
            >
                    <div>
                        <div>
                            <Banknote size={20} />
                        </div>
                        <div>
                            <span>Solde Principal (USD)</span>
                            <Tooltip text="Fonds disponibles pour retrait vers votre compte bancaire.">
                                <HelpCircle size={14}  />
                            </Tooltip>
                        </div>
                    </div>
                    <div>$ 12,450.00</div>
                    <div>
                        <span>
                            <TrendingUp size={14} /> +12.5%
                        </span>
                        <span>Depuis le mois dernier</span>
                    </div>
                </motion.div>

                <motion.div

                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
            >
                    <div>
                        <div>
                            <Wallet size={20} />
                        </div>
                        <div>
                            <span>Solde Mobile (CDF)</span>
                            <Tooltip text="Total des collectes via Mobile Money (M-Pesa, Orange, Airtel).">
                                <HelpCircle size={14}  />
                            </Tooltip>
                        </div>
                    </div>
                    <div>₣ 3,250,000</div>
                    <div>
                        <span>
                            <TrendingUp size={14} /> +8.2%
                        </span>
                        <span>Depuis le mois dernier</span>
                    </div>
                </motion.div>

                <motion.div

                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
            >
                    <div>
                        <div>
                            <Zap size={20} />
                        </div>
                        <span>Volume Total (30j)</span>
                    </div>
                    <div>$ 45,920.00</div>
                    <div>
                        <span>
                            <TrendingUp size={14} /> +15.5%
                        </span>
                        <span>Flux de transactions</span>
                    </div>
                </motion.div>
            </div>

            <div>
                {/* Chart Section */}
                <section>
                    <div>
                        <div>
                            <h3>Flux de Revenus</h3>
                            <p>Analyse hebdomadaire des revenus</p>
                        </div>
                        <div>
                            <span><span></span> Revenus</span>
                            <span><span></span> Volume</span>
                        </div>
                    </div>
                    <div>
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
                                <TooltipBox
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
                <aside>
                    <h3>Actions Rapides</h3>
                    <div>
                        <button>
                            <div><ArrowUpRight size={20} /></div>
                            <span>Retrait</span>
                        </button>
                        <button>
                            <div><ArrowLeftRight size={20} /></div>
                            <span>Change</span>
                        </button>
                        <button>
                            <div><CreditCard size={20} /></div>
                            <span>API Keys</span>
                        </button>
                        <button>
                            <div><Zap size={20} /></div>
                            <span>Instant</span>
                        </button>
                    </div>

                    <div>
                        <div>
                            <RefreshCcw size={18}  />
                            <h4>Conversion Express</h4>
                        </div>
                        <div>
                            <div>
                                <span>Vendre</span>
                                <input type="number" defaultValue="100.00" />
                                <span>USD</span>
                            </div>
                            <div>
                                <div></div>
                                <div><ArrowLeftRight size={14} /></div>
                                <div></div>
                            </div>
                            <div>
                                <span>Recevoir</span>
                                <div>285,450.00</div>
                                <span>CDF</span>
                            </div>
                            <div>
                                <HelpCircle size={12} /> Frais de change inclus (1.5%)
                            </div>
                        </div>
                        <button>Convertir</button>
                        <p>Taux Garanti: 1 USD = 2,854.5 CDF</p>
                    </div>
                </aside>
            </div>

            {/* Transactions Table */}
            <section>
                <div>
                    <div>
                        <h3>Transactions Récentes</h3>
                        <p>Derniers flux de paiements</p>
                    </div>
                    <button>
                        Voir tout l'historique <ArrowRight size={16} />
                    </button>
                </div>
                <div>
                    <table>
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
                                    <td><span>TXN-{2024 + i}-00{i}84</span></td>
                                    <td>
                                        <div>
                                            <div>C{i}</div>
                                            <div>
                                                <p>Client Kinshasa {i}</p>
                                                <p>+243 81 234 {i}2 7{i}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>28 Jan, 2026 • 11:2{i}</td>
                                    <td>
                                        <div>
                                            <span>$ 45.00</span>
                                            <span>Frais: $ 1.20</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`op-tag ${i % 2 === 0 ? 'mpesa' : 'orange'}`}>
                                            {i % 2 === 0 ? 'M-Pesa' : 'Orange Money'}
                                        </span>
                                    </td>
                                    <td>
                                        <div>
                                            <div></div>
                                            <span>Réussi</span>
                                        </div>
                                    </td>
                                    <td>
                                        <button>
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};
