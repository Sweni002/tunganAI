// components/DateRangeFilter.jsx
import React from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Spin } from 'antd';
import { InputAdornment, Popper, Box, ClickAwayListener } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { StaticDatePicker } from '@mui/x-date-pickers';
import frLocale from 'date-fns/locale/fr';
import styles from '../presences.module.css';

export default function DateRangeFilter({
  dateDebutFiltre,
  setDateDebutFiltre,
  dateFinFiltre,
  setDateFinFiltre,
  poppers,
  onFiltrer,
  onReset,
  downloadPDF,
  downloadPDF1,
  loadingPdf,
  menuExportAnchorEl,
  openMenuExport,
  onOpenMenuExport,
  onCloseMenuExport,
}) {
  const { anchorEl, anchorEl2, pickerType, openDebut, openFin, closeAll, openPopper, openPopper2 } = poppers;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={frLocale}>
      <div className={styles.filtreContainer} style={{maxWidth:1700}}>
        <div className={styles.filtreGroup}>
          <div className={styles.champ}>
            <label>
              Date début <span style={{ color: 'red' }}>*</span>
            </label>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TextField
                onClick={openDebut}
                value={dateDebutFiltre ? dateDebutFiltre.toLocaleDateString() : 'Sélectionner une date'}
                variant="standard"
                fullWidth
                sx={{
                  mt: 1,
                  mb: 2,
                  fontFamily: " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                  width: '100%',
                  '& .MuiInputBase-input': {
                    color: dateDebutFiltre ? '#000' : '#9e9e9e',
                    padding: '8px 1px',
                    fontSize: '0.85rem',
                    '@media (max-width:600px)': { padding: '5px 0px !important' },
                  },
                }}
                InputLabelProps={{ style: { fontSize: '1.1rem', letterSpacing: '1px' } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" onClick={openDebut} size="large">
                        <CalendarTodayIcon style={{ fontSize: '1.0rem' }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Popper open={openPopper} anchorEl={anchorEl} placement="bottom-start">
                <ClickAwayListener onClickAway={closeAll}>
                  <Box sx={{ bgcolor: 'background.paper', p: 1, boxShadow: 3 }}>
                    <StaticDatePicker
                      displayStaticWrapperAs="desktop"
                      value={pickerType === 'debut' ? dateDebutFiltre : dateFinFiltre}
                      onChange={(newValue) => {
                        if (pickerType === 'debut') setDateDebutFiltre(newValue);
                        else setDateFinFiltre(newValue);
                        closeAll();
                      }}
                    />
                  </Box>
                </ClickAwayListener>
              </Popper>
            </LocalizationProvider>
          </div>

          <div className={styles.champ}>
            <label>
              Date fin <span style={{ color: 'red' }}>*</span>
            </label>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TextField
                onClick={openFin}
                value={dateFinFiltre ? dateFinFiltre.toLocaleDateString() : 'Sélectionner une date'}
                variant="standard"
                fullWidth
                sx={{
                  mt: 1,
                  mb: 2,
                  fontFamily: " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                  width: '100%',
                  '& .MuiInputBase-input': {
                    color: dateFinFiltre ? '#000' : '#9e9e9e',
                    padding: '8px 1px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    '@media (max-width:600px)': { padding: '5px 0px !important' },
                  },
                }}
                InputLabelProps={{ style: { fontSize: '1.0rem', letterSpacing: '1px' } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" onClick={openFin} size="large">
                        <CalendarTodayIcon style={{ fontSize: '1.0rem' }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Popper open={openPopper2} anchorEl={anchorEl2} placement="bottom-start">
                <ClickAwayListener onClickAway={closeAll}>
                  <Box sx={{ bgcolor: 'background.paper', p: 1, boxShadow: 3 }}>
                    <StaticDatePicker
                      displayStaticWrapperAs="desktop"
                      value={pickerType === 'fin' ? dateFinFiltre : dateDebutFiltre}
                      onChange={(newValue) => {
                        if (pickerType === 'fin') setDateFinFiltre(newValue);
                        else setDateDebutFiltre(newValue);
                        closeAll();
                      }}
                    />
                  </Box>
                </ClickAwayListener>
              </Popper>
            </LocalizationProvider>
          </div>

          <Button
            variant="contained"
            sx={{
              background: '#1b6979',
              p: 1.2,
              pl: 3,
              pr: 3,
              fontSize: '0.75rem',
              fontFamily: " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
              '@media (max-width:1369px)': { py: 0.8 },
            }}
            onClick={onFiltrer}
          >
            Filtrer
          </Button>

          <Button
            onClick={onReset}
            variant="outlined"
            disabled={!dateDebutFiltre || !dateFinFiltre}
            color="secondary"
            sx={{
              p: 1.2,
              pl: 3,
              pr: 3,
              fontSize: '0.75rem',
              fontFamily: " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
              '@media (max-width:1369px)': { py: 0.8 },
            }}
            startIcon={<i className="fa-solid fa-eye-slash" style={{ fontSize: '0.9rem' }}></i>}
          >
            Reintinialiser
          </Button>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
            <Button
              onClick={downloadPDF}
              variant="outlined"
              disabled={!dateDebutFiltre && !dateFinFiltre}
              color="secondary"
              sx={{
                p: 1.2,
                pl: 3,
                pr: 3,
                color: '#2DAC60',
                fontSize: '0.75rem',
                fontFamily: " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
              }}
              startIcon={loadingPdf ? <Spin size="small" /> : <i className="fa-solid fa-download" style={{ fontSize: '0.9rem' }}></i>}
            >
              Exporter en excel
            </Button>

            <Button
              onClick={onOpenMenuExport}
              variant="outlined"
              disabled={!dateDebutFiltre && !dateFinFiltre}
              color="secondary"
              sx={{
                width: 30,
                height: 42,
                borderBottomRightRadius: 13,
                borderTopRightRadius: 13,
                color: '#2DAC60',
                fontFamily: " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
              }}
            >
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.9rem' }}></i>
            </Button>

            <Menu anchorEl={menuExportAnchorEl} open={openMenuExport} onClose={onCloseMenuExport} PaperProps={{ sx: { fontFamily: 'Poppins' } }}>
              <MenuItem onClick={() => downloadPDF1('all')} sx={{ fontFamily: 'Poppins', fontSize: '0.9rem' }}>
                Tout
              </MenuItem>
              <MenuItem onClick={() => downloadPDF1('bureau')} sx={{ fontFamily: 'Poppins', fontSize: '0.9rem' }}>
                Agent de bureau
              </MenuItem>
              <MenuItem onClick={() => downloadPDF1('surface')} sx={{ fontFamily: 'Poppins', fontSize: '0.9rem' }}>
                Agent de surface
              </MenuItem>
            </Menu>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
}