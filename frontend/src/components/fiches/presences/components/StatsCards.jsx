import React from 'react';
import { Box } from '@mui/material';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

import StatCard from './StatCard';
import { useTrend } from '../hooks/useTrend';
import { useStatsService } from '../hooks/useServiceStats';

export default function StatsCards({
    idserv,
    iddiv,
    selectedDate,
    dateDebutFiltre,
    dateFinFiltre,
    fetchWithAuth,
    refreshKey,
}) {
    const { stats, loading } = useStatsService({
        idserv,
        iddiv,
        selectedDate,
        dateDebutFiltre,
        dateFinFiltre,
        fetchWithAuth,
        refreshKey,
    });

    const trendTotal = useTrend(stats.effectif);
    // Tendance calculée sur le total de demi-journées (matin + soir)
    const { matin, soir } = stats;
    const trendRetard = useTrend(matin.retards + soir.retards);
    const trendPresent = useTrend(matin.presence + soir.presence);
    const trendAbsent = useTrend(matin.absence_non_justifiee + soir.absence_non_justifiee);

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 3,
                flexWrap: 'wrap',
                mb: 2,
                mt: 2,
                width: '100%',
                maxWidth: 1740,
            }}
        >
            <StatCard
                loading={loading}
                icon={<PeopleAltOutlinedIcon />}
                iconBg="rgba(27, 105, 121, 0.1)"
                iconColor="#1b6979"
                label="Personnels"
                value={stats.effectif}
                trend={trendTotal}
                positiveWhen="up"
            />

            <StatCard
                loading={loading}
                icon={<AccessTimeOutlinedIcon />}
                iconBg="rgba(255, 165, 0, 0.12)"
                iconColor="#FFA500"
                label="Retard"
                split={{ matin: matin.retards, soir: soir.retards }}
                trend={trendRetard}
                positiveWhen="down"
            />

            <StatCard
                loading={loading}
                icon={<CheckCircleOutlineIcon />}
                iconBg="rgba(45, 172, 96, 0.12)"
                iconColor="#2DAC60"
                label="Présent"
                split={{ matin: matin.presence, soir: soir.presence }}
                trend={trendPresent}
                positiveWhen="up"
            />

            <StatCard
                loading={loading}
                icon={<CancelOutlinedIcon />}
                iconBg="rgba(229, 72, 77, 0.12)"
                iconColor="#e5484d"
                label="Absent non justifié"
                split={{ matin: matin.absence_non_justifiee, soir: soir.absence_non_justifiee }}
                trend={trendAbsent}
                positiveWhen="down"
            />
        </Box>
    );
}