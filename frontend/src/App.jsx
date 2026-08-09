// src/App.jsx
import React, { lazy, Suspense, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './AuthContext.jsx';
import PrivateRoute from './PrivateRoute.jsx';
import RoleRoute from './RoleRoute.jsx';


import Global from './components/pointage/Global.jsx';
import ModPerso from './components/content/ModPerso.jsx';
import ModAuto from './components/content/ModAuto.jsx';
import Tableau from './components/pointage/Tableau.jsx';
import Oublier from './components/login/Oublier.jsx';
import Motdepasse from './components/login/Motdepasse.jsx';
import Responsable from './components/content/Responsable.jsx';
import ModRespo from './components/content/ModRespo.jsx';
import Accepte from './components/login/Accepte.jsx';
import ModService from './components/content/ModService.jsx';
import Division from './components/content/Division.jsx';
import AjoutDiv from './components/content/AjoutDiv.jsx';
import ModDiv from './components/content/ModDiv.jsx';
import Type from './components/content/Type.jsx';
import AjoutType from './components/content/AjoutType.jsx';
import ModType from './components/content/ModType.jsx';
import OublieRespo from './components/login/OublieRespo.jsx';
import AccepteRespo from './components/login/AccepteRespo.jsx';
import MotdePasseRespo from './components/login/MotdePasseRespo.jsx';
import SplashScreen from './SplashScreen.jsx';
import Compte from './components/content/Compte.jsx';
import OublierPerso from './components/login/OublierPerso.jsx';
import AcceptePerso from './components/login/AcceptePerso.jsx';
import MotdePassePerso from './components/login/MdpPerso.jsx';
import Conslulter from './components/login/Conslulter.jsx';
import Pointage from './components/login/Pointge.jsx';
import ModPointage from './components/content/ModPointage.jsx';
import ChangerMDP from './components/content/ChangerMDP.jsx';
import Horaires from './components/content/Horaires.jsx';
import AjoutHoraire from './components/content/AjoutHoraire.jsx';
import AjoutService from './components/services/AjoutService/index.jsx';
import AjoutRespo from './components/content/responsables/AjoutRespo.jsx';
import Login from './components/login/_components/Login.jsx';
import Presences from './components/fiches/presences/index.jsx';
import Assiduites from './components/fiches/assuidite/index.jsx';
import AssuiditePerso from './components/fiches/assiduitePerso/index.jsx';
import Autorisations from './components/content/autorisations_absences/index.jsx';
import AutorisationSortie from './components/content/autorisation_sortie/index.jsx';
import Personnels from './components/content/personnels/Personnels.jsx';
import AjoutPerso from './components/content/ajout_perso/AjoutPerso.jsx';
import AjoutAuto from './components/content/AjoutAuto/AjoutAuto.jsx';
import Historique from './components/fiches/historiques/index.jsx';
import Information from './components/content/information/index.jsx';
import Service from './components/services/hooks/index.jsx';



const PointagePage = lazy(() => import('./components/login/_components/PointagePage.jsx'));

function AppContent() {
  const { user, loading } = useContext(AuthContext);
  const [openDateFilter, setOpenDateFilter] = useState(false);

  if (loading) return <SplashScreen />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
  <Route
        path="/pointage"
        element={
          <Suspense fallback={<SplashScreen />}>
            <PointagePage />
          </Suspense>
        }
      />
      <Route path="/change-password" element={<ChangerMDP />} />
      <Route path="/oublie" element={<Oublier />} />
      <Route path="/oublie_respo" element={<OublieRespo />} />
      <Route path="/oublie_perso" element={<OublierPerso />} />

      <Route path="/mdp_respo" element={<MotdePasseRespo />} />
      <Route path="/mdp_perso" element={<MotdePassePerso />} />
      <Route path="/mdp" element={<Motdepasse />} />

      <Route path="/accepte" element={<Accepte />} />
      <Route path="/accepte_respo" element={<AccepteRespo />} />
      <Route path="/accepte_perso" element={<AcceptePerso />} />

      {/* Routes publiques */}

      <Route
        path="/login"
        element={
          !user ? (
            <Login />
          ) : !user.role ? (
            <Login />
          ) : user.role === "admin" ? (
            <Navigate to="/global/service" replace />
          ) : user.role === "responsable" ? (
            <Navigate to="/global/fiche_presence" replace />
          ) : (
            <Navigate to="/global/historique" replace />
          )
        }
      />

      {/* Autres routes publiques... */}

      {/*
        ✅ UN SEUL bloc parent "/global".
        PrivateRoute ne vérifie QUE l'authentification.
        Chaque route enfant définit elle-même ses rôles autorisés via <RoleRoute roles={[...]}>.
        -> Plus de risque de mauvaise redirection liée aux comptes multi-rôles ("conflict"),
           et plus de duplication de "/global" comme route parente.
      */}
      <Route
        path="/global"
        element={
          <PrivateRoute>
            <Global />
          </PrivateRoute>
        }
      >
        {/* ✅ Accessible à tous les utilisateurs connectés (aucun rôle requis) */}
        <Route path="historique" element={<Historique />} />
        <Route path="information" element={<Information />} />
        <Route path="assiduite_perso" element={<AssuiditePerso />} />
        <Route path="compte" element={<Compte />} />
        <Route path="consulter" element={<Conslulter />} />
        <Route path="modifier_pointage" element={<ModPointage />} />
        <Route path="pointages" element={<Pointage />} />

        {/* ✅ Routes ADMIN + RESPONSABLE */}
        <Route
          path="fiche_presence"
          element={
            <RoleRoute roles={["admin", "responsable"]}>
              <Presences />
            </RoleRoute>
          }
        />
        <Route
          path="assiduite"
          element={
            <RoleRoute roles={["admin", "responsable"]}>
              <Assiduites />
            </RoleRoute>
          }
        />
        <Route
          path="autorisation"
          element={
            <RoleRoute roles={["admin", "responsable"]}>
              <Autorisations />
            </RoleRoute>
          }
        />
        <Route
          path="autorisation_sortie"
          element={
            <RoleRoute roles={["admin", "responsable"]}>
              <AutorisationSortie />
            </RoleRoute>
          }
        />
        <Route
          path="tableau_bord"
          element={
            <RoleRoute roles={["admin", "responsable"]}>
              <Tableau />
            </RoleRoute>
          }
        />

        {/* ✅ Routes ADMIN + RESPONSABLE : gestion du personnel de leur propre service */}

        {/* Personnel */}
        <Route
          path="personnel"
          element={
            <RoleRoute roles={["admin", "responsable"]}>
              <Personnels />
            </RoleRoute>
          }
        />
        <Route
          path="ajout_perso"
          element={
            <RoleRoute roles={["admin", "responsable"]}>
              <AjoutPerso />
            </RoleRoute>
          }
        />
        <Route
          path="modifier_perso"
          element={
            <RoleRoute roles={["admin", "responsable"]}>
              <ModPerso />
            </RoleRoute>
          }
        />
        <Route
          path="modifier_auto"
          element={
            <RoleRoute roles={["admin", "responsable"]}>
              <ModAuto />
            </RoleRoute>
          }
        />
        <Route
          path="ajout_auto"
          element={
            <RoleRoute roles={["admin", "responsable"]}>
              <AjoutAuto />
            </RoleRoute>
          }
        />

        {/* ✅ Routes ADMIN UNIQUEMENT */}

        {/* Responsables */}
        <Route
          path="responsable"
          element={
            <RoleRoute roles={["admin"]}>
              <Responsable />
            </RoleRoute>
          }
        />
        <Route
          path="modifier_respo"
          element={
            <RoleRoute roles={["admin"]}>
              <ModRespo />
            </RoleRoute>
          }
        />
        <Route
          path="ajout_respo"
          element={
            <RoleRoute roles={["admin"]}>
              <AjoutRespo />
            </RoleRoute>
          }
        />

        {/* Services */}
        <Route
          path="service"
          element={
            <RoleRoute roles={["admin"]}>
              <Service />
            </RoleRoute>
          }
        />
        <Route
          path="modifier_service"
          element={
            <RoleRoute roles={["admin"]}>
              <ModService />
            </RoleRoute>
          }
        />
        <Route
          path="ajout_service"
          element={
            <RoleRoute roles={["admin"]}>
              <AjoutService />
            </RoleRoute>
          }
        />

        {/* Divisions */}
        <Route
          path="division"
          element={
            <RoleRoute roles={["admin"]}>
              <Division />
            </RoleRoute>
          }
        />
        <Route
          path="modifier_division"
          element={
            <RoleRoute roles={["admin"]}>
              <ModDiv />
            </RoleRoute>
          }
        />
        <Route
          path="ajout_division"
          element={
            <RoleRoute roles={["admin"]}>
              <AjoutDiv />
            </RoleRoute>
          }
        />

        {/* Types */}
        <Route
          path="type"
          element={
            <RoleRoute roles={["admin"]}>
              <Type />
            </RoleRoute>
          }
        />
        <Route
          path="modifier_type"
          element={
            <RoleRoute roles={["admin"]}>
              <ModType />
            </RoleRoute>
          }
        />
        <Route
          path="ajout_type"
          element={
            <RoleRoute roles={["admin"]}>
              <AjoutType />
            </RoleRoute>
          }
        />

        {/* Horaires */}
        <Route
          path="horaires"
          element={
            <RoleRoute roles={["admin"]}>
              <Horaires />
            </RoleRoute>
          }
        />
        <Route
          path="ajout_horaire"
          element={
            <RoleRoute roles={["admin"]}>
              <AjoutHoraire />
            </RoleRoute>
          }
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;