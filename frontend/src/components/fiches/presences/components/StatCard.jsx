import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';

const AnimatedNumber = ({ value }) => {
    // On convertit la valeur en nombre, avec une valeur par défaut de 0
    const numericValue = parseFloat(value) || 0;

    // Spring configuration (smooth transition)
    const spring = useSpring(0, {
        mass: 0.8,
        stiffness: 75,
        damping: 15
    });

    // On utilise useTransform pour formater le nombre
    const display = useTransform(spring, (latest) => {
        // toFixed(1) garde une décimale
        // .replace(/\.0$/, '') supprime le .0 si le nombre est entier (ex: 5.0 -> 5)
        return latest.toFixed(1).replace(/\.0$/, '');
    });

    useEffect(() => {
        spring.set(numericValue);
    }, [numericValue, spring]);

    return <motion.span>{display}</motion.span>;
};

export default function StatCard({ icon, iconBg, iconColor, label, value, trend, positiveWhen = 'up' }) {
    const isGood = trend ? trend.direction === positiveWhen : null;

    return (
        <Box
            sx={{
                flex: '1 1 200px', // Changez '1 1 220px' par '0 1 200px' pour limiter l'expansion
                minWidth: 200,     // Réduit de 240 à 180
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,          // Réduit un peu l'espace entre l'icône et le texte
                p: 2,              // Padding réduit de 2.5 à 2
                borderRadius: '16px',
                border: '1px solid #f0f0f2',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s ease',
                '&:hover': { boxShadow: '0 6px 12px -2px rgba(0,0,0,0.1)' }
            }}
        >
            <Box
                sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: iconBg,
                    color: iconColor,
                    flexShrink: 0,
                }}
            >
                {React.cloneElement(icon, { size: 22 })}
            </Box>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 500 }}>
                    {label}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#18181b' }}>
                        <AnimatedNumber value={value} />
                    </Typography>

                    {trend && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1,
                                py: 0.2,
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                backgroundColor: isGood ? '#f0fdf4' : '#fef2f2',
                                color: isGood ? '#166534' : '#991b1b',
                            }}
                        >
                            {trend.direction === 'up' ? (
                                <TrendingUp size={14} />
                            ) : (
                                <TrendingDown size={14} />
                            )}
                            {trend.percent}%
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}