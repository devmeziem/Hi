import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { RoadblockScreen } from './components/RoadblockScreen';
import { VoxamFactoryApp } from './components/VoxamFactoryApp';
import { dbAdapter } from './dbAdapter';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const OWNER_EMAIL = 'devmeziem@gmail.com';

export const App: React.FC = () => {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [approvedUsers, setApprovedUsers] = useState<string[]>([OWNER_EMAIL]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch latest whitelist of approved users
    dbAdapter.getApprovedUsers().then(users => {
      setApprovedUsers(users && users.length > 0 ? users : [OWNER_EMAIL]);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isExplicitlyLocked = localStorage.getItem('voxam_workspace_locked') === 'true';
      if (user && user.email && !isExplicitlyLocked) {
        setCurrentUserEmail(user.email);
        localStorage.setItem('voxam_current_user', user.email);
      } else {
        // Strict site lock: require explicit authentication
        setCurrentUserEmail(null);
        localStorage.removeItem('voxam_current_user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (email: string) => {
    localStorage.removeItem('voxam_workspace_locked');
    setCurrentUserEmail(email);
    localStorage.setItem('voxam_current_user', email);
  };

  const handleSignOut = async () => {
    localStorage.setItem('voxam_workspace_locked', 'true');
    localStorage.removeItem('voxam_current_user');
    try {
      await signOut(auth);
    } catch {
      // offline signOut
    }
    setCurrentUserEmail(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        Initializing Voxam Content Factory...
      </div>
    );
  }

  if (!currentUserEmail) {
    return <AuthScreen onSuccess={handleLoginSuccess} approvedUsers={approvedUsers} />;
  }

  // Check authorization status: must be owner (devmeziem@gmail.com) or in approved whitelist
  const normalizedUserEmail = currentUserEmail.trim().toLowerCase();
  const isApproved =
    normalizedUserEmail === OWNER_EMAIL.toLowerCase() ||
    approvedUsers.map(u => u.trim().toLowerCase()).includes(normalizedUserEmail);

  if (!isApproved) {
    return <RoadblockScreen userEmail={currentUserEmail} onSignOut={handleSignOut} />;
  }

  return <VoxamFactoryApp userEmail={currentUserEmail} onSignOut={handleSignOut} />;
};

export default App;
