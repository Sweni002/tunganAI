// components/Toolbar.jsx
import React, { useRef } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { Tooltip, Spin } from 'antd';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import styles from '../../presences.module.css';

export default function Toolbar({
  selectedDate,
  setSelectedDate,
  setDateDebutFiltre,
  setDateFinFiltre,
  searchText,
  setSearchText,
  onExportJour,
  loadingPdf1,
}) {
  const dateInputRef = useRef(null);

  return (
    <div className={styles.searchBar}>
      <div className={styles.flexible}>
        <div className={styles.debuts}>
          <Button
            onClick={() => dateInputRef.current?.showPicker()}
            variant="outlined"
            sx={{
              p: 1.2,
              pl: 3,
              pr: 3,
              gap: 1,
              color: 'gray',
              backgroundColor: 'transparent',
              border: '1px solid #ebecee',
              textTransform: 'none',
              fontSize: '0.75rem',
              fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
              '@media (max-width:1369px)': { py: 0.8 },
              '&:hover': { backgroundColor: 'rgba(27, 105, 121, 0.08)' },
            }}
            startIcon={<i className="fa-solid fa-calendar" style={{ fontSize: '0.9rem' }}></i>}
          >
            {selectedDate ? dayjs(selectedDate).format('DD/MM/YYYY') : 'Filtrer par date'}
          </Button>
          <input
            type="date"
            ref={dateInputRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setDateDebutFiltre('');
              setDateFinFiltre('');
            }}
          />

          <Tooltip title="Exporter en Excel" arrow>
            <div className={styles.pdf3} onClick={onExportJour} aria-label="Exporter en Excel">
              <IconButton size="large">{loadingPdf1 ? <Spin size="default" /> : <i className="fa-solid fa-download"></i>}</IconButton>
            </div>
          </Tooltip>
        </div>
      </div>

      <div className={styles.searchB}>
        <input type="text" placeholder="Rechercher ..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        <MagnifyingGlassIcon size={22} color="#14535f" />
      </div>
    </div>
  );
}
