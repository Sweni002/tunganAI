// components/TabPanel.jsx
import React from 'react';
import { Box } from '@mui/material';
import { ThreeDot } from 'react-loading-indicators';

export default function TabPanel({ children, value, index, loading }) {
  return (
    <div hidden={value !== index}>
      {value === index && (
        <Box sx={{ p: 1, minHeight: '300px', position: 'relative', width: '100%' }}>
          {loading ? (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
              <ThreeDot color="rgb(115, 97, 196)" size="small" textColor="#555" />
            </Box>
          ) : (
            children
          )}
        </Box>
      )}
    </div>
  );
}