// hooks/useMenuAnchor.js
import { useState } from 'react';

export function useMenuAnchor() {
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  return { anchorEl, openMenu, handleOpenMenu, handleCloseMenu };
}
