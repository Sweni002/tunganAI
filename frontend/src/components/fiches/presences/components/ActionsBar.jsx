// components/ActionsBar.jsx
import React, { useRef } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Spin } from 'antd';
import { Box, Popper, ClickAwayListener } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { StaticDatePicker } from '@mui/x-date-pickers';
import frLocale from 'date-fns/locale/fr';
import dayjs from 'dayjs';
import styles from '../presences.module.css';
import bar from './actionsBar.module.css';

export default function ActionsBar({
  selectedDate,
  setSelectedDate,
  setDateDebutFiltre,
  setDateFinFiltre,
  searchText,
  setSearchText,
  poppers,
  onCreerFicheVide,
  onSaisieManuelle,
  onExport,
  loadingPdf1,
  menuExportJourAnchorEl,
  openMenuExportJour,
  onOpenMenuExportJour,
  onCloseMenuExportJour,
  tabValue,
  onTabChange,
}) {
  const dateInputRef = useRef(null);
  const { anchorEl3, openPopper3, openNouvelle, closeAll } = poppers;

  return (
    <>
      <div className={bar.bar}>
        <div className={bar.actions}>
          {/* Filtrer par date */}
          <button
            type="button"
            className={bar.btn}
            onClick={() => dateInputRef.current && dateInputRef.current.showPicker()}
          >
            <i className="fa-regular fa-calendar" aria-hidden="true"></i>
            {selectedDate ? dayjs(selectedDate).format('DD/MM/YYYY') : 'Filtrer par date'}
          </button>
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

          {/* Nouvelle fiche vide */}
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={frLocale}>
            <button type="button" className={bar.btn} onClick={openNouvelle}>
              <i className="fa-solid fa-plus" aria-hidden="true"></i>
              Nouvelle fiche
            </button>
            <Popper open={openPopper3} anchorEl={anchorEl3} placement="bottom-start" style={{ zIndex: 1300 }}>
              <ClickAwayListener onClickAway={closeAll}>
                <Box sx={{ bgcolor: 'background.paper', p: 1, borderRadius: '24px', boxShadow: '0 16px 40px rgba(16,40,46,0.18)' }}>
                  <StaticDatePicker
                    displayStaticWrapperAs="desktop"
                    value={selectedDate}
                    onChange={(newValue) => {
                      if (!newValue) return;
                      setSelectedDate(dayjs(newValue).format('YYYY-MM-DD'));
                      onCreerFicheVide(newValue);
                      closeAll();
                    }}
                  />
                </Box>
              </ClickAwayListener>
            </Popper>
          </LocalizationProvider>

          {/* Saisie manuelle (coupure de la reconnaissance faciale) */}
          <button type="button" className={`${bar.btn} ${bar.btnPrimary}`} onClick={onSaisieManuelle}>
            <i className="fa-solid fa-keyboard" aria-hidden="true"></i>
            Saisie manuelle
          </button>

          {/* Export Excel */}
          <button
            type="button"
            className={`${bar.btn} ${bar.btnIcon}`}
            onClick={onOpenMenuExportJour}
            disabled={loadingPdf1}
            aria-label="Exporter en Excel"
            aria-haspopup="menu"
            title="Exporter en Excel"
          >
            {loadingPdf1 ? (
              <Spin size="small" />
            ) : (
              <>
                <i className="fa-solid fa-download" aria-hidden="true"></i>
                <i className={`fa-solid fa-chevron-down ${bar.chevron}`} aria-hidden="true"></i>
              </>
            )}
          </button>
          <Menu
            anchorEl={menuExportJourAnchorEl}
            open={openMenuExportJour}
            onClose={onCloseMenuExportJour}
            slotProps={{ paper: { sx: { fontFamily: 'Poppins', borderRadius: '20px', mt: 1, minWidth: 200 } } }}
          >
            <MenuItem onClick={() => onExport('all')} sx={{ fontFamily: 'Poppins', fontSize: '0.85rem', py: 1.4, px: 2.5 }}>
              Tout
            </MenuItem>
            <MenuItem onClick={() => onExport('bureau')} sx={{ fontFamily: 'Poppins', fontSize: '0.85rem', py: 1.4, px: 2.5 }}>
              Agent de bureau
            </MenuItem>
            <MenuItem onClick={() => onExport('surface')} sx={{ fontFamily: 'Poppins', fontSize: '0.85rem', py: 1.4, px: 2.5 }}>
              Agent de surface
            </MenuItem>
          </Menu>
        </div>

        {/* Recherche */}
        <label className={bar.search}>
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input
            type="search"
            placeholder="Rechercher un agent…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Rechercher"
          />
        </label>
      </div>

      <div className={`${styles.onglet} ${bar.tabs}`}>
        <Tabs
          value={tabValue}
          onChange={onTabChange}
          sx={{
            width: '100%',
            minHeight: 44,
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            '& .MuiTab-root': {
              fontSize: '0.85rem',
              fontFamily: "'Poppins', sans-serif",
              minHeight: 44,
              minWidth: 160,
              width: 190,
              textTransform: 'none',
            },
          }}
        >
          <Tab label="Agents de bureau" />
          <Tab label="Agents de surface" />
        </Tabs>
      </div>
    </>
  );
}
