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
      if (user && user.email) {
        setCurrentUserEmail(user.email);
        localStorage.setItem('voxam_current_user', user.email);
      } else {
        // Check local storage for persistent session
        const savedUser = localStorage.getItem('voxam_current_user');
        if (savedUser) {
          setCurrentUserEmail(savedUser);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (email: string) => {
    setCurrentUserEmail(email);
    localStorage.setItem('voxam_current_user', email);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      // offline signOut
    }
    localStorage.removeItem('voxam_current_user');
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
