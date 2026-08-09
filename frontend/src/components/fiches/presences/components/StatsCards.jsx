// components/StatsCards.jsx
import React from 'react';
import { Box } from '@mui/material';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import StatCard from './StatCard';
import { computeStats } from '../utils/computeStats';
import { useTrend } from '../hooks/useTrend';

export default function StatsCards({ personnels }) {
    const stats = computeStats(personnels);

    // Chaque compteur suit sa propre tendance (comparaison au chargement précédent :
    // changement de date, de division, ou de filtre).
    const trendTotal = useTrend(stats.total);
    const trendRetard = useTrend(stats.retard);
    const trendPresent = useTrend(stats.present);
    const trendAbsent = useTrend(stats.absentNonJustifie);

    console.log("perso==" , personnels)

    return (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, mt: 2, width: "100%", maxWidth: 1740 }}>
            <StatCard
                icon={<PeopleAltOutlinedIcon />}
                iconBg="rgba(27, 105, 121, 0.1)"
                iconColor="#1b6979"
                label="Personnels"
                value={stats.total}
                trend={trendTotal}
                positiveWhen="up"
            />
            <StatCard
                icon={<AccessTimeOutlinedIcon />}
                iconBg="rgba(255, 165, 0, 0.12)"
                iconColor="#FFA500"
                label="Retard"
                value={stats.retard}
                trend={trendRetard}
                positiveWhen="down"
            />
            <StatCard
                icon={<CheckCircleOutlineIcon />}
                iconBg="rgba(45, 172, 96, 0.12)"
                iconColor="#2DAC60"
                label="Présent"
                value={stats.present}
                trend={trendPresent}
                positiveWhen="up"
            />
            <StatCard
                icon={<CancelOutlinedIcon />}
                iconBg="rgba(229, 72, 77, 0.12)"
                iconColor="#e5484d"
                label="Absent non justifié"
                value={stats.absentNonJustifie}
                trend={trendAbsent}
                positiveWhen="down"
            />
        </Box>
    );
}