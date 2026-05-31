'use client';

import { useEffect, useState, useMemo } from 'react';
import { useThemeStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export function NightShift() {
    const { nightShiftEnabled, nightShiftBypass } = useThemeStore();
    const [intensity, setIntensity] = useState(0);

    useEffect(() => {
        const updateIntensity = () => {
            const now = new Date();
            const hour = now.getHours();
            const minutes = now.getMinutes();
            const timeAsDecimal = hour + minutes / 60;

            let newIntensity = 0;

            // Start at 18:00 (6 PM) -> 0%
            // Peak at 23:00 (11 PM) -> 100%
            // Maintain until 06:00 (6 AM) -> 100%
            // End at 09:00 (9 AM) -> 0%

            if (timeAsDecimal >= 18 && timeAsDecimal < 23) {
                // Progressive increase from 18:00 to 23:00
                newIntensity = (timeAsDecimal - 18) / 5;
            } else if (timeAsDecimal >= 23 || timeAsDecimal < 6) {
                // Full strength at night
                newIntensity = 1;
            } else if (timeAsDecimal >= 6 && timeAsDecimal < 9) {
                // Progressive decrease from 06:00 to 09:00
                newIntensity = 1 - (timeAsDecimal - 6) / 3;
            } else {
                newIntensity = 0;
            }

            setIntensity(newIntensity);
        };

        updateIntensity();
        const interval = setInterval(updateIntensity, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    // Actual opacity: max 20% to keep it usable
    const activeOpacity = useMemo(() => {
        if (!nightShiftEnabled || nightShiftBypass) return 0;
        return intensity * 0.18; // 18% max opacity for a nice warm tint
    }, [nightShiftEnabled, nightShiftBypass, intensity]);

    return (
        <AnimatePresence>
            {activeOpacity > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: activeOpacity }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="fixed inset-0 pointer-events-none z-[9999]"
                    style={{
                        backgroundColor: 'rgba(255, 120, 0, 1)',
                        mixBlendMode: 'multiply'
                    }}
                />
            )}
        </AnimatePresence>
    );
}
