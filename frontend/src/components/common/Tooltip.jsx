import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Tooltip = ({ text, children, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <>
                    <motion.div
                        className="absolute bottom-3/4 whitespace-nowrap z-20 flex flex-col items-center ml-2"
                        initial={{ opacity: 0, y: 10, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 10, x: '-50%' }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="absolute bottom-1/2 bg-deeper border-1 border-glass-border p-2 text-sm
                        rounded-lg text-white font-bold">
                            {text}
                        </div>
                        <div className="relative text-primary/60 -z-10">&#9660;</div>
                    </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Tooltip;
