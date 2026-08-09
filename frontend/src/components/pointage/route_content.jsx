// route_content.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Personnels from '../content/Personnels';
import Conge from '../content/Conge';         // Crée ce composant

const RouteContent = () => {
  return (
    <Routes>
      <Route path="personnel" element={<Personnels />} />
      <Route path="conge" element={<Conge />} />
    </Routes>
  );
};

export default RouteContent;
