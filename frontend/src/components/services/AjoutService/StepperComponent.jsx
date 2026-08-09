// StepperComponent.jsx
import React from 'react';
import { Step, StepLabel, Stepper } from '@mui/material';
import { styled } from '@mui/material/styles';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import Check from '@mui/icons-material/Check';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import VideoLabelIcon from '@mui/icons-material/VideoLabel';
import PropTypes from 'prop-types';

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 22 },
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: { backgroundImage: 'linear-gradient(90deg, #00c4cc, #8b69b8)' },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: { backgroundImage: 'linear-gradient(90deg, #00c4cc, #8b69b8)' },
    },
    [`& .${stepConnectorClasses.line}`]: {
        height: 3, border: 0, backgroundColor: '#eaeaf0', borderRadius: 1,
    },
}));

const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
    backgroundColor: '#ccc',
    zIndex: 1,
    color: '#fff',
    width: 55,
    height: 55,
    display: 'flex',
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ...(ownerState.active || ownerState.completed) && {
        backgroundImage: 'linear-gradient(90deg, #00c4cc, #8b69b8)',
        boxShadow: '0 4px 10px rgba(0, 196, 204, 0.3)',
    },
    // Léger zoom au survol quand l'étape est cliquable
    ...(ownerState.clickable && {
        '&:hover': {
            transform: 'scale(1.08)',
            boxShadow: '0 6px 14px rgba(0, 196, 204, 0.35)',
        },
    }),
}));

function ColorlibStepIcon(props) {
    const { active, completed, className, icon, clickable } = props;

    const icons = {
        1: <SettingsIcon />,
        2: <GroupAddIcon />,
        3: <VideoLabelIcon />,
    };

    return (
        <ColorlibStepIconRoot ownerState={{ completed, active, clickable }} className={className}>
            {/* Coche sur les étapes remplies (hors étape active) */}
            {completed && !active ? <Check /> : icons[String(icon)]}
        </ColorlibStepIconRoot>
    );
}

ColorlibStepIcon.propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    completed: PropTypes.bool,
    icon: PropTypes.node,
    clickable: PropTypes.bool,
};

const StepperComponent = ({
    steps,
    activeStep,
    className,
    completedSteps,
    onStepClick,
    canGoToStep,
}) => {
    const isInteractive = typeof onStepClick === 'function';

    return (
        <div className={className}>
            <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />}>
                {steps.map((label, index) => {
                    // Étape remplie (coche + gradient), hors étape courante
                    const completed = !!completedSteps?.[index] && index !== activeStep;
                    // Cliquable si toutes les étapes précédentes sont remplies
                    const reachable = canGoToStep ? canGoToStep(index) : true;
                    const clickable = isInteractive && reachable && index !== activeStep;

                    const handleClick = () => {
                        if (clickable) onStepClick(index);
                    };

                    return (
                        <Step key={label} completed={completed}>
                            <StepLabel
                                onClick={handleClick}
                                slots={{ stepIcon: ColorlibStepIcon }}
                                slotProps={{
                                    stepIcon: { clickable },
                                    label: {
                                        className: 'stepperFont'
                                    }
                                }}
                                sx={{
                                    // Curseur : pointer si accessible, interdit sinon
                                    cursor: clickable
                                        ? 'pointer'
                                        : isInteractive && !reachable
                                            ? 'not-allowed'
                                            : 'default',
                                    '& .MuiStepLabel-iconContainer': {
                                        cursor: 'inherit',
                                    },
                                    '& .MuiStepLabel-label': {
                                        fontFamily: 'Poppins, sans-serif !important',
                                        fontSize: '0.7rem !important',
                                        cursor: 'inherit',
                                    },
                                    // Étape verrouillée : légèrement estompée
                                    ...(isInteractive && !reachable && index !== activeStep && {
                                        opacity: 0.55,
                                    }),
                                }}
                            >
                                {label}
                            </StepLabel>
                        </Step>
                    );
                })}
            </Stepper>
        </div>
    );
};

StepperComponent.propTypes = {
    steps: PropTypes.arrayOf(PropTypes.string).isRequired,
    activeStep: PropTypes.number.isRequired,
    className: PropTypes.string,
    completedSteps: PropTypes.arrayOf(PropTypes.bool),
    onStepClick: PropTypes.func,
    canGoToStep: PropTypes.func,
};

StepperComponent.defaultProps = {
    className: '',
    completedSteps: [],
    onStepClick: undefined,
    canGoToStep: undefined,
};

export default StepperComponent;