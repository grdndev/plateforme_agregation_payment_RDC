import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Alert = ({ type = 'info', message, title, onClose }) => {
    const icons = {
        info: <Info size={20} />,
        success: <CheckCircle size={20} />,
        error: <AlertCircle size={20} />,
        warning: <AlertCircle size={20} />
    };

    return (
        <motion.div
            className={`alert alert-${type}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className="alert-icon">
                {icons[type]}
            </div>
            <div className="alert-content">
                {title && <strong className="alert-title">{title}</strong>}
                <div className="alert-message">{message}</div>
            </div>
            {onClose && (
                <button className="alert-close" onClick={onClose}>
                    <XCircle size={18} />
                </button>
            )}
        </motion.div>
    );
};

export default Alert;
