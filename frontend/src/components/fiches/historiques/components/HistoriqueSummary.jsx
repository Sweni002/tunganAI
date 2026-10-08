// components/HistoriqueSummary.jsx
// Résumé de la période (matin / soir) + autorisations du jour d'un agent.
import React from 'react';
import { Box } from '@mui/material';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

import StatCard from '../../presences/components/StatCard';
import AutorisationsDuJour from '../../common/AutorisationsDuJour';

export default function HistoriqueSummary({ stats, loadingStats, isSurface, autorisations, loadingAutorisations }) {
    const matin = stats?.matin ?? {};
    const soir = stats?.soir ?? {};
    const unique = stats?.unique ?? {};

    // Agent de surface : un seul pointage par jour (pas de matin / soir)
    const props = (cle) =>
        isSurface
            ? { value: unique[cle] ?? 0 }
            : { split: { matin: matin[cle] ?? 0, soir: soir[cle] ?? 0 } };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <StatCard
                    loading={loadingStats}
                    icon={<CheckCircleOutlineIcon />}
                    iconBg="rgba(45, 172, 96, 0.12)"
                    iconColor="#2DAC60"
                    label="Présences"
                    {...props('presence')}
                />
                {!isSurface && (
                    <StatCard
                        loading={loadingStats}
                        icon={<AccessTimeOutlinedIcon />}
                        iconBg="rgba(255, 165, 0, 0.12)"
                        iconColor="#FFA500"
                        label="Retards"
                        {...props('retards')}
                    />
                )}
                <StatCard
                    loading={loadingStats}
                    icon={<CancelOutlinedIcon />}
                    iconBg="rgba(229, 72, 77, 0.12)"
                    iconColor="#e5484d"
                    label="Absences non justifiées"
                    {...props('absence_non_justifiee')}
                />
            </Box>

            <AutorisationsDuJour data={autorisations} loading={loadingAutorisations} />
        </Box>
    );
}
