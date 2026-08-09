// AjoutService.jsx
import Breadcrumbs from '@mui/material/Breadcrumbs';
import React, { useState } from "react";
import styles from "../ajout_service.module.css";
import Perso from "../../../assets/v3.png";
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useNavigate } from "react-router-dom";
import { useSnackbar } from '../hooks/useSnackbar';
import { useServiceForm } from '../hooks/useServiceForm';
import ServiceForm from './ServiceForm';
import HeureForm from './HeureForm';
import RecapForm from './RecapForm';
import ServiceSnackbar from './ServiceSnackbar';
import StepperComponent from './StepperComponent';
import PageHeader from '../../content/autorisations_absences/components/PageHeader';

const AjoutService = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Informations du service', 'Horaires', 'Confirmation'];

    const {
        snackbarState,
        showSnackbar,
        handleCloseSnackbar
    } = useSnackbar();

    const {
        formState,
        errors,
        preview,
        handleInputChange,
        handleFileChange,
        handleSelectAddress,
        validateForm,
        validateHoraires,
        handleCreateService,
        resetForm,
        loading,
        setLoading,
        setFormState
    } = useServiceForm(showSnackbar);

    const goBack = () => {
        navigate(-1);
    };

    // -----------------------------------------------------------------------
    // Complétude de chaque étape (basée sur le formState)
    // -----------------------------------------------------------------------
    const isStep0Complete =
        !!formState.code &&
        !!formState.nom &&
        !!formState.sigle &&
        !!formState.addresse &&
        !!preview;

    const isStep1Complete =
        !!formState.entreeMatinDebut &&
        !!formState.entreeMatinFin &&
        !!formState.sortieMatinDebut &&
        !!formState.sortieMatinFin &&
        !!formState.entreeSoirDebut &&
        !!formState.entreeSoirFin &&
        !!formState.sortieSoirDebut &&
        !!formState.sortieSoirFin;

    const completedSteps = [isStep0Complete, isStep1Complete, false];

    const canGoToStep = (stepIndex) => {
        for (let i = 0; i < stepIndex; i++) {
            if (!completedSteps[i]) return false;
        }
        return true;
    };

    const handleStepClick = (stepIndex) => {
        if (stepIndex === activeStep) return;
        if (canGoToStep(stepIndex)) {
            setActiveStep(stepIndex);
        }
    };

    const handleNext = () => {
        setActiveStep((prev) => prev + 1);
    };

    const handleBackStep = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleEditStep = (stepIndex) => {
        setActiveStep(stepIndex);
    };

    // -----------------------------------------------------------------------
    // DÉCLENCHÉ PAR LE BOUTON "SAUVEGARDER" DU RECAPFORM :
    // enchaîne les 2 APIs (POST service → POST horaires) via le hook.
    // Si tout réussit → redirection vers la liste des services.
    // Si échec → on reste sur le récap, le snackbar affiche l'erreur backend
    // (et au retry, le service déjà créé n'est pas recréé).
    // -----------------------------------------------------------------------
    const handleFinalSubmit = async () => {
        const success = await handleCreateService();
        if (success) {
            setActiveStep(0); // remet le stepper à zéro (formState déjà reset)
          
        }
    };

    return (
        <div className={styles.personnels} style={{ maxWidth: "88%", margin: "0 auto" }}>
       
       <PageHeader
                title="Ajout d'un service"
                subtitle="Créez un nouveau service et configurez ses horaires"
            />

            <div className={styles.card}>
                <div className={styles.container} style={{border:"none"}}>
                    <div className={styles.retour} onClick={goBack}>
                        <IconButton aria-label="more" size="large">
                            <i className="fa-solid fa-arrow-left"></i>
                        </IconButton>
                    </div>

                    <div className={styles.sary}>
                        <div className={styles.sary1}>
                            <img src={Perso} alt="" />
                        </div>
                    </div>

                    <div className={styles.stepperContainer}>
                        <StepperComponent
                            steps={steps}
                            activeStep={activeStep}
                            completedSteps={completedSteps}
                            onStepClick={handleStepClick}
                            canGoToStep={canGoToStep}
                        />
                    </div>

                    {/* Étape 1 : Informations du service */}
                    {activeStep === 0 && (
                        <ServiceForm
                            formState={formState}
                            errors={errors}
                            preview={preview}
                            loading={loading}
                            onInputChange={handleInputChange}
                            onFileChange={handleFileChange}
                            onAddressSelect={handleSelectAddress}
                            onSubmit={handleNext}
                            onValidate={validateForm}
                            onBack={goBack}
                            setFormState={setFormState}
                        />
                    )}

                    {/* Étape 2 : Horaires (validation locale avant d'avancer) */}
                    {activeStep === 1 && (
                        <HeureForm
                            formState={formState}
                            errors={errors}
                            loading={loading}
                            onInputChange={handleInputChange}
                            onBack={handleBackStep}
                            onSubmit={handleNext}
                            onValidate={validateHoraires}
                            setFormState={setFormState}
                        />
                    )}

                    {/* Étape 3 : Récapitulatif → Sauvegarder déclenche les 2 APIs */}
                    {activeStep === 2 && (
                        <RecapForm
                            formState={formState}
                            preview={preview}
                            loading={loading}
                            onBack={handleBackStep}
                            onEditStep={handleEditStep}
                            onSubmit={handleFinalSubmit}
                        />
                    )}
                </div>
            </div>

            <ServiceSnackbar
                open={snackbarState.open}
                message={snackbarState.message}
                severity={snackbarState.severity}
                onClose={handleCloseSnackbar}
                onViewServices={() => navigate("/global/service")}
            />
        </div>
    );
};

export default AjoutService;