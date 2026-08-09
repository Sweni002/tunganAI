// components/ActionsBar.jsx
import React, { useRef } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Spin } from 'antd';
import { Tooltip, Box, Popper, ClickAwayListener } from '@mui/material';
import { CiSearch } from 'react-icons/ci';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { StaticDatePicker } from '@mui/x-date-pickers';
import frLocale from 'date-fns/locale/fr';
import dayjs from 'dayjs';
import styles from '../presences.module.css';

export default function ActionsBar({
  selectedDate,
  setSelectedDate,
  setDateDebutFiltre,
  setDateFinFiltre,
  searchText,
  setSearchText,
  poppers,
  onCreerFicheVide,
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
      <div className={styles.searchBar}>
        <div className={styles.flexible}>
          <div className={styles.debuts}>
            <Button
              onClick={() => dateInputRef.current && dateInputRef.current.showPicker()}
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
                fontFamily: " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                '@media (max-width:1369px)': { py: 0.8 },
                '&:hover': { backgroundColor: ' rgba(27, 105, 121, 0.08)' },
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

            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={frLocale}>
              <Button
                onClick={openNouvelle}
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
                  fontFamily: " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                  '@media (max-width:1369px)': { py: 0.8 },
                  '&:hover': { backgroundColor: ' rgba(27, 105, 121, 0.08)' },
                }}
                startIcon={<i className="fa-solid fa-plus" style={{ fontSize: '0.9rem' }}></i>}
              >
                Nouvelle fiche
              </Button>
              <Popper open={openPopper3} anchorEl={anchorEl3} placement="bottom-start">
                <ClickAwayListener onClickAway={closeAll}>
                  <Box sx={{ bgcolor: 'background.paper', p: 1, boxShadow: 3 }}>
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

            <Tooltip title="Exporter en Excel" arrow>
              <div className={styles.pdf3} aria-label="Exporter en Excel">
                <IconButton size="medium" onClick={onOpenMenuExportJour} sx={{ gap: 0.7 }}>
                  {loadingPdf1 ? (
                    <Spin size="default" />
                  ) : (
                    <>
                      <i className="fa-solid fa-download"></i>
                      <ArrowDropDownIcon fontSize="small" />
                    </>
                  )}
                </IconButton>
              </div>
            </Tooltip>
            <Menu anchorEl={menuExportJourAnchorEl} open={openMenuExportJour} onClose={onCloseMenuExportJour} PaperProps={{ sx: { fontFamily: 'Poppins' } }}>
              <MenuItem onClick={() => onExport('all')} sx={{ fontFamily: 'Poppins', fontSize: '0.9rem' }}>
                Tout
              </MenuItem>
              <MenuItem onClick={() => onExport('bureau')} sx={{ fontFamily: 'Poppins', fontSize: '0.9rem' }}>
                Agent de bureau
              </MenuItem>
              <MenuItem onClick={() => onExport('surface')} sx={{ fontFamily: 'Poppins', fontSize: '0.9rem' }}>
                Agent de surface
              </MenuItem>
            </Menu>
          </div>
        </div>

        <div className={styles.searchB}>
          <input type="text" placeholder="Rechercher ..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          <CiSearch size={22} />
        </div>
      </div>

      <div className={styles.onglet}>
        <Tabs
          value={tabValue}
          onChange={onTabChange}
          sx={{
            width: '96%',
            minHeight: 36,
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            '& .MuiTab-root': {
              fontSize: '0.8rem',
              fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
              minHeight: 36,
              minWidth: 160,
              width: 180,
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