// information/index.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

import styles from '../ajout_perso.module.css';

import { useIsMobile } from './hooks/useIsMobile';
import { useAdminAndDivisions } from './hooks/useAdminAndDivisions';
import { usePersonnelRecord } from './hooks/usePersonnelRecord';
import { useFaceModels } from './hooks/useFaceModels';
import { useWebcamCapture } from './hooks/useWebcamCapture';
import { usePhotoUpload } from './hooks/usePhotoUpload';
import { useMenuAnchor } from './hooks/useMenuAnchor';
import { useSnackbar } from './hooks/useSnackbar';
import { useSimpleSnack } from './hooks/useSimpleSnack';
import { useSavePersonnel } from './hooks/useSavePersonnel';
import { validateForm } from './utils/validateForm';

import PageBreadcrumb from './components/PageBreadcrumb';
import AvatarUploader from './components/AvatarUploader';
import PersonnelFormFields from './components/PersonnelFormFields';

// Réutilisé tel quel depuis le module presences/ (même pattern Modal + ThreeDot)
import FullPageLoader from '../../fiches/presences/components/FullPageLoader';
import PageHeader from '../autorisations_absences/components/PageHeader';

const Information = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // --- Identité / contexte ---
  const { admin, services } = useAdminAndDivisions({ navigate });

  // --- Personnel édité ---
  const {
    idpers,
    personnel,
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
    preview,
    setPreview,
  } = usePersonnelRecord();

  // --- Erreurs de formulaire ---
  const [errors, setErrors] = React.useState({
    matricule: false,
    nom: false,
    prenom: false,
    tel: false,
    division: false,
    services: false,
    photo: false,
    email: false,
  });

  // --- Notifications ---
  const { snackbarOpen, snackbarMessage, snackbarSeverity, showSnackbar, closeSnackbar } = useSnackbar();
  const { msg, setMsg, openSnack, setOpenSnack, handleCloseSnack } = useSimpleSnack();

  // --- Reconnaissance faciale (modèles) ---
  const modelsLoaded = useFaceModels();

  // --- Photo : webcam ---
  const [selectedFaceDescriptor, setSelectedFaceDescriptor] = React.useState(null);
  const webcam = useWebcamCapture({
    modelsLoaded,
    onNoFaceDetected: (message) => showSnackbar(message, 'warning'),
    onCaptureSuccess: ({ imageSrc, imageFile, faceDescriptor }) => {
      setPreview(imageSrc);
      setSelectedImage(imageFile);
      setSelectedFaceDescriptor(faceDescriptor);
    },
  });

  // --- Photo : upload fichier ---
  const { fileInputRef, selectedImage, setSelectedImage, handleChooseFile, handlePhotoClick, handleFileChange } = usePhotoUpload({
    errors,
    setErrors,
  });

  // --- Menu de choix de la source photo (webcam / upload) ---
  const photoMenu = useMenuAnchor();

  // --- Chargement de la page tant que personnel + services ne sont pas prêts ---
  const loadingPage = !(personnel && services.length > 0);

  // --- Sauvegarde ---
  const { loading, handleCreateResponsable } = useSavePersonnel({ idpers, personnel, setMsg, setOpenSnack });

  const handleSave = () => {
    const { errors: newErrors, isValid } = validateForm({ matricule, nom, prenom, email, services: selectedService });
    setErrors((prev) => ({ ...prev, ...newErrors }));
    if (!isValid) return;

    handleCreateResponsable({
      matricule,
      nom,
      prenom,
      email,
      selectedService,
      selectedImage,
      selectedFaceDescriptor,
    });
  };

  if (loadingPage) {
    return <FullPageLoader open={loadingPage} />;
  }

  return (
    <div className={styles.personnels} style={{ maxWidth: "88%", margin: "0 auto" }}>
      <PageHeader
        title={`${nom} ${prenom}`}
        subtitle="Consultez vos informations"
      />

      <div className={styles.card}>
        <div className={styles.container} style={{ border: isMobile ? 'none' : "none" }}>
          <AvatarUploader preview={preview} isMobile={isMobile} onClick={photoMenu.handleOpenMenu} />

          <PersonnelFormFields
            matricule={matricule}
            setMatricule={setMatricule}
            nom={nom}
            setNom={setNom}
            prenom={prenom}
            setPrenom={setPrenom}
            email={email}
            setEmail={setEmail}
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            services={services}
            errors={errors}
          />
        </div>
      </div>

      {/* Input fichier caché, déclenché par handleChooseFile / handlePhotoClick */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, setPreview)}
      />
    </div>
  );
};

export default Information;
