import React, { useState, useEffect } from 'react';
import { Phone, ArrowRight, Lock, Zap, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectOperator, formatPhoneNumber, isValidPhoneNumber } from '../utils/operatorDetection';

const Checkout = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [operator, setOperator] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('input'); // 'input', 'confirming', 'success', 'error'
  const [error, setError] = useState('');

  // Mock order data (in real app, this would come from URL params or API)
  const orderData = {
    amount: 45.00,
    currency: 'USD',
    merchant: {
      name: 'Superette Kinshasa',
      logo: 'S'
    },
    orderId: 'ORD-2026-123456'
  };

  useEffect(() => {
    const detected = detectOperator(phoneNumber);
    setOperator(detected);
    setFormattedPhone(formatPhoneNumber(phoneNumber));
  }, [phoneNumber]);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 10) {
      setPhoneNumber(value);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidPhoneNumber(phoneNumber)) {
      setError('Numéro de téléphone invalide');
      return;
    }

    setIsProcessing(true);
    setStep('confirming');

    // Simulate payment processing (in real app, this calls the backend API)
    setTimeout(() => {
      // Mock success
      setStep('success');
      setIsProcessing(false);
    }, 3000);
  };

  const renderOperatorBadge = () => {
    if (!operator) return null;

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="operator-badge"
        style={{ backgroundColor: operator.colors.badge }}
      >
        {operator.displayName}
      </motion.div>
    );
  };

  const renderInputStep = () => (
    <>
      <div className="order-summary">
        <div className="amount-display">
          <span className="currency">$</span>
          <span className="amount">{orderData.amount.toFixed(2)}</span>
        </div>
        <div className="merchant-info">
          <div className="merchant-logo">{orderData.merchant.logo}</div>
          <div className="merchant-details">
            <span className="label">Paiement à</span>
            <span className="merchant-name">{orderData.merchant.name}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="payment-form">
        <label htmlFor="phone">Numéro Mobile Money</label>
        <div className={`input-group ${operator ? 'has-operator' : ''} ${error ? 'has-error' : ''}`}>
          <Phone size={20} className="icon" />
          <input
            id="phone"
            type="tel"
            placeholder="081 234 5678"
            value={formattedPhone}
            onChange={handlePhoneChange}
            autoFocus
            autoComplete="tel"
          />
          {renderOperatorBadge()}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="error-message"
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="supported-operators">
          <span className="label">Opérateurs supportés:</span>
          <div className="operator-icons">
            <div className="op-icon mpesa">M-Pesa</div>
            <div className="op-icon orange">Orange</div>
            <div className="op-icon airtel">Airtel</div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isValidPhoneNumber(phoneNumber) || isProcessing}
        >
          <span>Payer {orderData.currency} {orderData.amount.toFixed(2)}</span>
          <ArrowRight size={18} />
        </button>

        <div className="security-note">
          <Lock size={12} />
          <span>Paiement sécurisé • Chiffré de bout en bout</span>
        </div>
      </form>
    </>
  );

  const renderConfirmingStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="status-screen"
    >
      <div className="status-icon processing">
        <Loader size={48} className="spin" />
      </div>
      <h2>Confirmation en cours...</h2>
      <p className="status-message">
        Une notification a été envoyée au <strong>{formattedPhone}</strong>
      </p>
      <p className="status-hint">
        Composez votre code PIN {operator?.displayName} pour confirmer le paiement
      </p>
      <div className="waiting-animation">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    </motion.div>
  );

  const renderSuccessStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="status-screen"
    >
      <div className="status-icon success">
        <CheckCircle size={48} />
      </div>
      <h2>Paiement réussi !</h2>
      <p className="status-message">
        Votre transaction a été confirmée
      </p>
      <div className="transaction-details">
        <div className="detail-row">
          <span>Montant</span>
          <strong>${orderData.amount.toFixed(2)}</strong>
        </div>
        <div className="detail-row">
          <span>Numéro</span>
          <strong>{formattedPhone}</strong>
        </div>
        <div className="detail-row">
          <span>Référence</span>
          <strong>{orderData.orderId}</strong>
        </div>
      </div>
      <button className="btn btn-secondary" onClick={() => window.close()}>
        Fermer
      </button>
    </motion.div>
  );

  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <div className="brand-header">
          <div className="logo">
            <Zap size={24} fill="var(--primary)" color="var(--primary)" />
          </div>
          <div className="brand-text">
            <span className="brand-name">ALMA</span>
            <span className="brand-tag">PAY</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'input' && <motion.div key="input">{renderInputStep()}</motion.div>}
          {step === 'confirming' && <motion.div key="confirming">{renderConfirmingStep()}</motion.div>}
          {step === 'success' && <motion.div key="success">{renderSuccessStep()}</motion.div>}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .checkout-container {
          min-height: 100vh;
          background: var(--bg-dark);
          background-image: 
            radial-gradient(circle at 15% 15%, rgba(243, 156, 18, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 85% 85%, rgba(52, 152, 219, 0.06) 0%, transparent 50%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-md);
        }

        .checkout-card {
          width: 100%;
          max-width: 420px;
          background: var(--glass);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xl);
          box-shadow: var(--shadow-lg);
        }

        .brand-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xl);
        }

        .logo {
          width: 44px;
          height: 44px;
          background: rgba(243, 156, 18, 0.12);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(243, 156, 18, 0.2);
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-name {
          font-family: 'Poppins', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-white);
          line-height: 1;
        }

        .brand-tag {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: 0.3em;
        }

        .order-summary {
          text-align: center;
          margin-bottom: var(--spacing-xl);
          padding: var(--spacing-lg);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .amount-display {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
          margin-bottom: var(--spacing-md);
        }

        .currency {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary);
          font-family: 'Poppins', sans-serif;
        }

        .amount {
          font-size: 3rem;
          font-weight: 800;
          color: var(--text-white);
          font-family: 'Poppins', sans-serif;
          line-height: 1;
        }

        .merchant-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          padding-top: var(--spacing-md);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .merchant-logo {
          width: 36px;
          height: 36px;
          background: var(--bg-deeper);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--primary);
          font-size: 0.9rem;
        }

        .merchant-details {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .label {
          font-size: 0.75rem;
          color: var(--text-gray);
          opacity: 0.6;
        }

        .merchant-name {
          font-weight: 600;
          color: var(--text-white);
          font-size: 0.9rem;
        }

        .payment-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .payment-form label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-gray);
          margin-bottom: -8px;
        }

        .input-group {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          background: var(--bg-deeper);
          border: 2px solid rgba(255, 255, 255, 0.08);
          padding: 14px 16px;
          border-radius: var(--radius-md);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .input-group:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(243, 156, 18, 0.1);
          background: rgba(243, 156, 18, 0.02);
        }

        .input-group.has-error {
          border-color: var(--error);
          box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
        }

        .input-group .icon {
          color: var(--text-gray);
          opacity: 0.4;
          flex-shrink: 0;
        }

        .input-group input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-white);
          font-size: 1.15rem;
          font-weight: 600;
          font-family: 'Fira Code', monospace;
          letter-spacing: 0.05em;
          outline: none;
        }

        .input-group input::placeholder {
          color: var(--text-gray);
          opacity: 0.3;
        }

        .operator-badge {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          color: white;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(231, 76, 60, 0.1);
          border: 1px solid rgba(231, 76, 60, 0.3);
          border-radius: var(--radius-sm);
          color: var(--error);
          font-size: 0.8rem;
          margin-top: -8px;
        }

        .supported-operators {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-sm);
        }

        .supported-operators .label {
          font-size: 0.75rem;
          color: var(--text-gray);
          opacity: 0.5;
        }

        .operator-icons {
          display: flex;
          gap: 6px;
        }

        .op-icon {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 700;
          color: white;
        }

        .op-icon.mpesa { background: #00B140; }
        .op-icon.orange { background: #FF7900; }
        .op-icon.airtel { background: #ED1C24; }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 24px;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 0.95rem;
          border: none;
          cursor: pointer;
          transition: var(--transition);
          font-family: 'Poppins', sans-serif;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: white;
          box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(243, 156, 18, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-white);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.75rem;
          color: var(--text-gray);
          opacity: 0.5;
          margin-top: 8px;
        }

        .status-screen {
          text-align: center;
          padding: var(--spacing-lg) 0;
        }

        .status-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto var(--spacing-md);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .status-icon.processing {
          background: rgba(243, 156, 18, 0.1);
          color: var(--primary);
        }

        .status-icon.success {
          background: rgba(39, 174, 96, 0.1);
          color: var(--success);
        }

        .status-screen h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: var(--spacing-sm);
          color: var(--text-white);
        }

        .status-message {
          font-size: 0.95rem;
          color: var(--text-gray);
          margin-bottom: var(--spacing-xs);
        }

        .status-hint {
          font-size: 0.85rem;
          color: var(--primary);
          font-weight: 600;
          margin-bottom: var(--spacing-lg);
        }

        .waiting-animation {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: var(--spacing-lg);
        }

        .dot {
          width: 8px;
          height: 8px;
          background: var(--primary);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .transaction-details {
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          margin: var(--spacing-lg) 0;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 0.85rem;
        }

        .detail-row span {
          color: var(--text-gray);
        }

        .detail-row strong {
          color: var(--text-white);
          font-weight: 600;
        }

        @media (max-width: 480px) {
          .checkout-card {
            padding: var(--spacing-md);
          }

          .amount {
            font-size: 2.5rem;
          }

          .currency {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Checkout;
