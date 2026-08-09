// hooks/useDatePickerPoppers.js
import { useState, useCallback } from 'react';

export function useDatePickerPoppers() {
  const [anchorEl, setAnchorEl] = useState(null); // début
  const [anchorEl2, setAnchorEl2] = useState(null); // fin
  const [anchorEl3, setAnchorEl3] = useState(null); // nouvelle fiche
  const [pickerType, setPickerType] = useState(null); // 'debut' | 'fin' | 'nouvelle'

  const openDebut = useCallback((event) => {
    setPickerType('debut');
    setAnchorEl(event.currentTarget);
  }, []);

  const openFin = useCallback((event) => {
    setPickerType('fin');
    setAnchorEl2(event.currentTarget);
  }, []);

  const openNouvelle = useCallback((event) => {
    setPickerType('nouvelle');
    setAnchorEl3(event.currentTarget);
  }, []);

  const closeAll = useCallback(() => {
    setAnchorEl(null);
    setAnchorEl2(null);
    setAnchorEl3(null);
  }, []);

  return {
    anchorEl,
    anchorEl2,
    anchorEl3,
    pickerType,
    openDebut,
    openFin,
    openNouvelle,
    closeAll,
    openPopper: Boolean(anchorEl),
    openPopper2: Boolean(anchorEl2),
    openPopper3: Boolean(anchorEl3),
  };
}