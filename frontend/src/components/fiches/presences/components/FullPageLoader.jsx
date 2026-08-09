// components/FullPageLoader.jsx
import React from 'react';
import Modal from '@mui/material/Modal';
import { Box } from '@mui/material';
import { ThreeDot } from 'react-loading-indicators';

export default function FullPageLoader({ open }) {
  return (
    <div style={{ height: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 12 }}>
      <Modal open={open} aria-labelledby="loading-modal" aria-describedby="loading-data" disableEscapeKeyDown>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            borderRadius: 2,
            px: 4,
            py: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            minWidth: 260,
          }}
        >
          <ThreeDot color="#ffffffff" size="medium" textColor="#555" />
        </Box>
      </Modal>
    </div>
  );
}