// hooks/usePersonnelRecord.js
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../../../../socket';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Résout l'idpers transmis via la navigation, charge le personnel
 * correspondant, et expose les champs de formulaire pré-remplis.
 * Se rafraîchit automatiquement sur l'événement socket "personnel_update".
 */
export function usePersonnelRecord() {
  const navigate = useNavigate();
  const location = useLocation();
  const { idpers } = location.state || {};

  const [personnel, setPersonnel] = useState(null);
  const [matricule, setMatricule] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [tel, setTel] = useState('');
  const [email, setEmail] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [preview, setPreview] = useState(null);
  const [selectedImageURL, setSelectedImageURL] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPersonnel = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/personnels/by_personnel/${id}`, { credentials: 'include' });
      const data = await res.json();

      if (!res.ok) {
        console.error('Erreur fetch personnel :', data.error);
        return;
      }

      if (Array.isArray(data) && data.length > 0) {
        const p = data[0];
        setPersonnel(p);
        setMatricule(p.matricule || '');
        setNom(p.nom || '');
        setPrenom(p.prenom || '');
        setEmail(p.email || '');
        setTel(p.numtel || '');
        setSelectedService(p.iddiv || '');
        if (p.image) {
          setPreview(`${API_URL}/uploads/${p.image}`);
          setSelectedImageURL(p.image);
        }
      }
    } catch (err) {
      console.error('Erreur fetch personnel :', err);
    }
  };

  // Redirige si aucun idpers n'a été transmis via la navigation
  useEffect(() => {
    if (!idpers) {
      navigate(-1);
    }
  }, [idpers, navigate]);

  // Rafraîchissement temps réel (socket)
  useEffect(() => {
    const handler = (data) => {
      console.log('🔔 Personnel mis à jour :', data);
      setRefreshKey((prev) => prev + 1);
    };
    socket.on('personnel_update', handler);
    return () => socket.off('personnel_update', handler);
  }, []);

  useEffect(() => {
    if (idpers) {
      fetchPersonnel(idpers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idpers, refreshKey]);

  return {
    idpers,
    personnel,
    matricule,
    setMatricule,
    nom,
    setNom,
    prenom,
    setPrenom,
    tel,
    setTel,
    email,
    setEmail,
    selectedService,
    setSelectedService,
    preview,
    setPreview,
    selectedImageURL,
  };
}
