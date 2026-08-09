// components/DivisionsToggleButton.jsx
import React from 'react';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function DivisionsToggleButton({ open, onToggle, hasActiveFilter }) {
  return (
    <Button
      onClick={onToggle}
      variant="text"
      sx={{
        color: '#1b6979',
        textTransform: 'none',
        fontSize: '0.8rem',
        fontFamily: " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
        gap: 0.8,
        px: 1,
        '&:hover': { backgroundColor: 'rgba(27, 105, 121, 0.08)' },
      }}
      startIcon={
        <Badge color="error" variant="dot" invisible={!hasActiveFilter}>
          <i className="fa-solid fa-layer-group" style={{ fontSize: '0.85rem' }}></i>
        </Badge>
      }
      endIcon={
        <ExpandMoreIcon
          sx={{
            fontSize: '1.1rem',
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      }
    >
      Filtrer par division
    </Button>
  );
}