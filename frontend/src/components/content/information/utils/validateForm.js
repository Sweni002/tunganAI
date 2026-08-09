// utils/validateForm.js

export function validateForm({ matricule, nom, prenom, email, services }) {
  const errors = {
    matricule: !matricule.trim(),
    nom: !nom.trim(),
    prenom: !prenom.trim(),
    email: !email.trim(),
    services: !services,
  };

  return { errors, isValid: !Object.values(errors).some(Boolean) };
}
