// components/RowActionsMenu.jsx
import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const ITEM_HEIGHT = 48;

export default function RowActionsMenu({ anchorEl, open, onClose, onModifier, onDemandeSuppression }) {
  return (
    <Menu
      id="long-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{ style: { maxHeight: ITEM_HEIGHT * 4.5, width: '30ch' } }}
      MenuListProps={{ 'aria-labelledby': 'long-button' }}
    >
      <MenuItem onClick={onModifier}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <i className="fa-solid fa-pencil" style={{ color: 'blue', marginRight: 12, fontSize: '0.8rem' }}></i>
          <span style={{ fontSize: '0.85rem' }}>Modifier</span>
        </div>
      </MenuItem>
      <MenuItem
        onClick={() => {
          onDemandeSuppression();
          onClose();
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <i className="fa-regular fa-trash-can" style={{ color: '#ff4d4f', marginRight: 12, fontSize: '0.9rem' }}></i>
          <span style={{ fontSize: '0.85rem' }}>Supprimer</span>
        </div>
      </MenuItem>
    </Menu>
  );
}