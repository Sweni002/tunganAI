// components/PersonnelFormFields.jsx
import React from 'react';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import styles from '../ajout_perso.module.css';

const textFieldSx = {
  mt: 1,
  mb: 2,
  width: '100%',
  '& .MuiInputBase-input': {
    padding: '8px 1px',
    fontSize: '0.9rem',
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
    '@media (max-width:600px)': {
      padding: '5px 0px !important',
    },
  },
};

export default function PersonnelFormFields({
  matricule,
  setMatricule,
  nom,
  setNom,
  prenom,
  setPrenom,
  email,
  setEmail,
  selectedService,
  setSelectedService,
  services,
  errors,
}) {
  return (
    <div className={styles.form}>
      <div className={styles.inputM}>
        <label htmlFor="matricule">
          Matricule <span style={{ color: 'red' }}>*</span>
        </label>
        <TextField
          placeholder="Entrez le matricule"
          variant="standard"
          fullWidth
          value={matricule}
          onChange={(e) => setMatricule(e.target.value)}
          error={!!errors.matricule}
          helperText={errors.matricule ? 'Le matricule est requis.' : ''}
          sx={textFieldSx}
        />
      </div>

      <div className={styles.inputM}>
        <label htmlFor="nom">
          Nom <span style={{ color: 'red' }}>*</span>
        </label>
        <TextField
          placeholder="Entrez le nom"
          variant="standard"
          fullWidth
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          error={!!errors.nom}
          helperText={errors.nom ? 'Le nom est requis.' : ''}
          sx={textFieldSx}
        />
      </div>

      <div className={styles.inputM}>
        <label htmlFor="prenom">
          Prenom <span style={{ color: 'red' }}>*</span>
        </label>
        <TextField
          placeholder="Entrez le prenom"
          variant="standard"
          fullWidth
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          error={!!errors.prenom}
          helperText={errors.prenom ? 'Le prenom est requis.' : ''}
          sx={textFieldSx}
        />
      </div>

      <div className={styles.inputM}>
        <label htmlFor="email">
          Email professionelle <span style={{ color: 'red' }}>*</span>
        </label>
        <TextField
          placeholder="Entrez un email valide"
          variant="standard"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!errors.email}
          helperText={errors.email ? "L'email est requis." : ''}
          sx={textFieldSx}
        />
      </div>

      <div className={styles.inputM}>
        <label htmlFor="division">
          Division <span style={{ color: 'red' }}>*</span>
        </label>
        <FormControl variant="standard" fullWidth sx={{ mt: 1, mb: 2 }}>
          <Select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            error={!!errors.services}
            sx={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem' }}
          >
            {services.map((serv) => (
              <MenuItem key={serv.iddiv} value={serv.iddiv} sx={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem' }}>
                {serv.nomdivision}
              </MenuItem>
            ))}
          </Select>

          {errors.services && (
            <Typography color="error" variant="caption" sx={{ color: 'brown' }}>
              Division est requis.
            </Typography>
          )}
        </FormControl>
      </div>
    </div>
  );
}
