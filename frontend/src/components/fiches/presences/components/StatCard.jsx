import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Skeleton } from 'antd';

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

const M3_RISE = keyframes`
  from { opacity: 0; transform: translateY(18px) scale(0.96); }
  to   { opacity: 1; transform: none; }
`;

export default function StatCard({ icon, iconBg, iconColor, label, value, trend, positiveWhen = 'up', loading = false }) {
    const isGood = trend ? trend.direction === positiveWhen : null;

    return (
        <Box
            sx={{
                position: 'relative',
                overflow: 'hidden',
                flex: '1 1 200px',
                minWidth: 200,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2.5,
                borderRadius: '28px',
                border: 'none',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 6px 18px rgba(0,0,0,0.06)',
                cursor: 'default',
                // entrée en cascade avec effet de ressort
                animation: `${M3_RISE} 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                '&:nth-of-type(2)': { animationDelay: '70ms' },
                '&:nth-of-type(3)': { animationDelay: '140ms' },
                '&:nth-of-type(4)': { animationDelay: '210ms' },
                transition:
                    'transform 350ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 250ms ease, border-radius 350ms cubic-bezier(0.34,1.56,0.64,1)',
                // forme décorative teintée par la couleur de la carte
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: -26,
                    top: -26,
                    width: 100,
                    height: 100,
                    borderRadius: '42% 58% 55% 45% / 50% 40% 60% 50%',
                    backgroundColor: iconColor,
                    opacity: 0.08,
                    pointerEvents: 'none',
                    transition: 'transform 600ms cubic-bezier(0.34,1.56,0.64,1), border-radius 600ms cubic-bezier(0.34,1.56,0.64,1), opacity 300ms',
                },
                '&:hover': {
                    transform: 'translateY(-5px)',
                    borderRadius: '36px 28px 36px 28px',
                    boxShadow: '0 14px 30px -4px rgba(0,0,0,0.14)',
                },
                '&:hover::after': {
                    transform: 'scale(1.25) rotate(25deg)',
                    borderRadius: '58% 42% 45% 55% / 40% 55% 45% 60%',
                    opacity: 0.14,
                },
                '&:hover .m3-stat-icon': { borderRadius: '50%', transform: 'rotate(-8deg) scale(1.08)' },
                '&:active': { transform: 'scale(0.97)' },
                '@media (prefers-reduced-motion: reduce)': {
                    animation: 'none',
                    transition: 'none',
                    '&::after, & .m3-stat-icon': { transition: 'none' },
                },
            }}
        >
            <Box
                className="m3-stat-icon"
                sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '20px', // forme "squircle" qui devient un rond au survol
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: iconBg,
                    color: iconColor,
                    flexShrink: 0,
                    transition: 'border-radius 400ms cubic-bezier(0.34,1.56,0.64,1), transform 400ms cubic-bezier(0.34,1.56,0.64,1)',
                }}
            >
                {React.cloneElement(icon, { size: 24 })}
            </Box>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#52606a', fontWeight: 500 }}>
                    {label}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, color: '#18181b', lineHeight: 1.2 }}>
                        {loading ? (
                            <Skeleton.Input active size="small" style={{ width: 56, minWidth: 0 }} />
                        ) : (
                            <AnimatedNumber value={value} />
                        )}
                    </Typography>

                    {trend && !loading && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1,
                                py: 0.2,
                                borderRadius: '999px',
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