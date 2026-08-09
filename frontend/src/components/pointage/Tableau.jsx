import React, { useEffect, useState } from 'react';
import styles from './tableau.module.css';
import ReactApexChart from 'react-apexcharts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Navigate } from 'react-router-dom';

const fetchWithAuth = async (url, options = {}) => {
  const response = await fetch(url, { credentials: 'include', ...options });

  if (response.status === 401) {
    Navigate('/login');
    throw new Error('Session expirée, veuillez vous reconnecter.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erreur inconnue');
  }

  return response.json();
};

// PolarArea ApexCharts
const ApexPolarArea = () => {
  const [series, setSeries] = useState([]);
  const [labels, setLabels] = useState([]);
  const colors = [
    '#ff7f0e', '#8a2be2', '#1f77b4', '#d62728',
    '#ff6347', '#9370db', '#1e90ff', '#ff4500', '#6a5acd'
  ];

  const apexOptions = {
    chart: { type: 'polarArea' },
    labels,
    stroke: { colors: ['#fff'] },
    fill: { opacity: 0.8 },
    colors,
    legend: { show: false }
  };

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchWithAuth('https://192.168.43.10:5000/api/divisions/with_count');
        setLabels(data.map(d => d.nomdivision));
        setSeries(data.map(d => d.total_personnels));
      } catch (error) {
        console.error('Erreur récupération données polar area:', error);
      }
    };
    getData();
  }, []);

  return (
    <div style={{ width: '100%', minHeight: 250 }}>
      <ReactApexChart options={apexOptions} series={series} type="polarArea" height={250} />
    </div>
  );
};

// Composant principal Tableau
const Tableau = () => {
  const [dataColumn1, setDataColumn1] = useState([]);
  const [dataLine1, setDataLine1] = useState([]);
  const [dataLine2, setDataLine2] = useState([]);

  // Présence par division (BarChart)
  useEffect(() => {
    const fetchPresence = async () => {
      try {
        const data = await fetchWithAuth('https://192.168.43.10:5000/api/divisions/presence-par-division-courant');
        const chartData = data.map(item => ({
          name: item.nomdivision,
          presenceCeMois: item.total_presence,
        }));
        console.log(data)
        setDataColumn1(chartData);
      } catch (error) {
        console.error('Erreur récupération présence par division:', error);
      }
    };
    fetchPresence();
  }, []);

  // Tendance retards par jour (LineChart)
  useEffect(() => {
    const fetchRetards = async () => {
      try {
        const data = await fetchWithAuth('https://192.168.43.10:5000/api/divisions/tendance-retards-par-jour');
        const chartData = data.map(item => ({
          name: item.jour,
          total_retard: item.total_retard,
        }));
        setDataLine1(chartData);
      } catch (err) {
        console.error('Erreur récupération retards :', err);
      }
    };
    fetchRetards();
  }, []);

  // Évolution présence par mois (LineChart)
  useEffect(() => {
    const fetchEvolutionPresence = async () => {
      try {
        const data = await fetchWithAuth('https://192.168.43.10:5000/api/divisions/evolution-presence-par-mois');
        const chartData = data.map(item => ({
          name: item.mois,
          uv: item.total_presence,
          pv: item.total_presence,
        }));
        setDataLine2(chartData);
      } catch (error) {
        console.error('Erreur récupération évolution présence :', error);
      }
    };
    fetchEvolutionPresence();
  }, []);

  return (
    <div className={styles.personnels}>
      {/* Titre */}
      <div className={styles.listes}>
        <h1>Tableau de bord</h1>
      </div>

      {/* Ligne 1 - PolarArea Apex */}
     

      {/* Ligne 2 - BarChart présence par division */}
      <div className={styles.flexRow}>
        <div className={styles.card}>
          <h3 style={{ textAlign: 'center', color: '#000' }}>Présence par division</h3>
      <ResponsiveContainer width="100%" height="80%">
  <BarChart
    data={dataColumn1}
    margin={{ top: 40, right: 20, left: 0, bottom: 5 }} // <-- top augmenté pour descendre le graphique
  >
    <XAxis dataKey="name" angle={-8} textAnchor="end" style={{ fontSize: "0.9rem" }} />
    <YAxis />
    <Tooltip />
  <Legend
  verticalAlign="bottom"
  content={(props) => {
    const { payload } = props;
    return (
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        {payload.map((entry, index) => (
          <span key={`item-${index}`} style={{ color: entry.color, marginRight: 10 }}>
            {entry.value}
          </span>
        ))}
      </div>
    );
  }}
/>
   <Bar dataKey="presenceCeMois" name="Présence ce mois-ci" fill="#ff7f0e" />
  </BarChart>
</ResponsiveContainer>

        </div>
      </div>

   

      {/* Ligne 4 - LineChart évolution présence */}
 
    </div>
  );
};

export default Tableau;
