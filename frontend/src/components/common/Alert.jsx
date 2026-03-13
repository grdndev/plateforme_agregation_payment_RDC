import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const Alert = ({ type = 'info', message, title, close }) => {
    const [display, setDisplay] = useState(true);

    const icons = {
        info: <Info size={20} />,
        success: <CheckCircle size={20} />,
        error: <AlertCircle size={20} />,
        warning: <AlertCircle size={20} />
    };

    const color = {
        info: "info",
        success: "success",
        error: "red-500",
        warning: "yellow-500"
    };

    return (
        <div className="flex">
            {display && <motion.div
                className={`text-${color[type]} bg-${color[type]}/10 p-3 my-2 border-${color[type]}/10 border-1 rounded-md flex flex-col gap-2`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                >
                <div className="flex">
                    <div className="flex items-center gap-2">
                        {icons[type]}
                        {title && <strong>{title}</strong>}
                    </div>
                    {close && (
                        <button
                            className="ml-auto"
                            onClick={() => setDisplay(false)}
                            >
                            <XCircle size={18} />
                        </button>
                    )}
                </div>
                <div>
                    <div>{message}</div>
                </div>
            </motion.div>}
        </div>
    );
};

export default Alert;
