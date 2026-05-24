import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';

import RequireAuth              from './components/RequireAuth';
import RequireAdmin             from './components/RequireAdmin';
import RequireChallengeStarted  from './components/RequireChallengeStarted';

import RecompGames        from './claude_recomp_games.tsx';
import Home               from './pages/Home.jsx';
import CheckIn            from './pages/CheckIn.jsx';
import InitialPhotos      from './pages/InitialPhotos.jsx';
import Activity           from './pages/Activity.jsx';
import Leaderboard        from './pages/Leaderboard.jsx';
import MyProfile          from './pages/MyProfile.jsx';
import ParticipantProfile from './pages/ParticipantProfile.jsx';
import Admin              from './pages/Admin.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* Public landing page — also handles personal-link sign-in via #login= fragment */}
          <Route path="/" element={<RecompGames />} />

          {/* Auth-gated + pre-challenge gated participant routes */}
          <Route path="/app"                element={<RequireChallengeStarted><Home /></RequireChallengeStarted>} />
          <Route path="/app/checkin"        element={<RequireChallengeStarted><CheckIn /></RequireChallengeStarted>} />
          <Route path="/app/initial-photos" element={<RequireChallengeStarted><InitialPhotos /></RequireChallengeStarted>} />
          <Route path="/activity"           element={<RequireChallengeStarted><Activity /></RequireChallengeStarted>} />
          <Route path="/profile"            element={<RequireChallengeStarted><MyProfile /></RequireChallengeStarted>} />
          <Route path="/profile/:userId"    element={<RequireChallengeStarted><ParticipantProfile /></RequireChallengeStarted>} />

          {/* Public leaderboard — auth-optional, no pre-challenge gate */}
          <Route path="/leaderboard" element={<Leaderboard />} />

          {/* Admin — auth-gated but NOT pre-challenge gated; Jeremy needs access pre-launch */}
          <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
