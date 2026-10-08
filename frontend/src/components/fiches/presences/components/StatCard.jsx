import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { Sun, Sunset, TrendingDown, TrendingUp } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Skeleton } from 'antd';

const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

/** Nombre entier animé (on compte des demi-journées : jamais de virgule). */
const AnimatedNumber = ({ value }) => {
    const numericValue = Math.round(Number(value) || 0);

    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (latest) => Math.round(latest).toString());

    useEffect(() => {
        spring.set(numericValue);
    }, [numericValue, spring]);

    return <motion.span>{display}</motion.span>;
};

const M3_RISE = keyframes`
  from { opacity: 0; transform: translateY(18px) scale(0.96); }
  to   { opacity: 1; transform: none; }
`;

/** Une moitié de journée : libellé + grand nombre entier. */
function HalfDay({ icon, label, value, color, loading }) {
    return (
        <Box
            sx={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
                px: 2.25,
                py: 1.75,
                borderRadius: '20px',
                backgroundColor: '#f5f8f9',
                transition: `transform 350ms ${SPRING}, border-radius 350ms ${SPRING}, background-color 200ms`,
                '&:hover': { transform: 'translateY(-2px)', borderRadius: '26px 16px 26px 16px', backgroundColor: '#eef3f4' },
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#52606a', fontSize: '0.74rem', fontWeight: 600 }}>
                {React.cloneElement(icon, { size: 14, color })}
                {label}
            </Box>
            <Typography sx={{ fontSize: '1.7rem', fontWeight: 700, color: '#18181b', lineHeight: 1.1 }}>
                {loading ? (
                    <Skeleton.Input active size="small" style={{ width: 40, minWidth: 0 }} />
                ) : (
                    <AnimatedNumber value={value} />
                )}
            </Typography>
        </Box>
    );
}

/**
 * Carte de statistique.
 * - `split={{ matin, soir }}` : affiche le nombre de matins et de soirs côte à côte (entiers).
 * - sinon : une seule valeur (ex. effectif).
 */
export default function StatCard({
    icon,
    iconBg,
    iconColor,
    label,
    value,
    split,
    trend,
    positiveWhen = 'up',
    loading = false,
}) {
    const isGood = trend ? trend.direction === positiveWhen : null;

    return (
        <Box
            sx={{
                position: 'relative',
                overflow: 'hidden',
                flex: split ? '1.5 1 280px' : '1 1 200px',
                minWidth: split ? 280 : 200,
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                p: 3,
                borderRadius: '28px',
                border: 'none',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 6px 18px rgba(0,0,0,0.06)',
                cursor: 'default',
                // entrée en cascade avec effet de ressort
                animation: `${M3_RISE} 600ms ${SPRING} both`,
                '&:nth-of-type(2)': { animationDelay: '70ms' },
                '&:nth-of-type(3)': { animationDelay: '140ms' },
                '&:nth-of-type(4)': { animationDelay: '210ms' },
                transition: `transform 350ms ${SPRING}, box-shadow 250ms ease, border-radius 350ms ${SPRING}`,
                // forme décorative teintée par la couleur de la carte
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: -30,
                    top: -30,
                    width: 110,
                    height: 110,
                    borderRadius: '42% 58% 55% 45% / 50% 40% 60% 50%',
                    backgroundColor: iconColor,
                    opacity: 0.08,
                    pointerEvents: 'none',
                    transition: `transform 600ms ${SPRING}, border-radius 600ms ${SPRING}, opacity 300ms`,
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
                '&:active': { transform: 'scale(0.98)' },
                '@media (prefers-reduced-motion: reduce)': {
                    animation: 'none',
                    transition: 'none',
                    '&::after, & .m3-stat-icon': { transition: 'none' },
                },
            }}
        >
            {/* ---------- En-tête : icône + libellé + tendance ---------- */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                    className="m3-stat-icon"
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '18px', // « squircle » qui devient un rond au survol
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: iconBg,
                        color: iconColor,
                        flexShrink: 0,
                        transition: `border-radius 400ms ${SPRING}, transform 400ms ${SPRING}`,
                    }}
                >
                    {React.cloneElement(icon, { size: 24 })}
                </Box>

                <Typography sx={{ flexGrow: 1, minWidth: 0, fontSize: '0.9rem', color: '#33414a', fontWeight: 600 }}>
                    {label}
                </Typography>

                {trend && !loading && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1.25,
                            py: 0.4,
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: isGood ? '#f0fdf4' : '#fef2f2',
                            color: isGood ? '#166534' : '#991b1b',
                        }}
                    >
                        {trend.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {trend.percent}%
                    </Box>
                )}
            </Box>

            {/* ---------- Valeur(s) ---------- */}
            {split ? (
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <HalfDay icon={<Sun />} label="Matin" value={split.matin} color="#b87800" loading={loading} />
                    <HalfDay icon={<Sunset />} label="Soir" value={split.soir} color="#1b6979" loading={loading} />
                </Box>
            ) : (
                <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#18181b', lineHeight: 1.1 }}>
                    {loading ? (
                        <Skeleton.Input active size="small" style={{ width: 56, minWidth: 0 }} />
                    ) : (
                        <AnimatedNumber value={value} />
                    )}
                </Typography>
            )}
        </Box>
    );
}
