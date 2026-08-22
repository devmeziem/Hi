import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { VoxamFactoryApp } from './components/VoxamFactoryApp';
import { dbAdapter } from './dbAdapter';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export const App: React.FC = () => {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [approvedUsers, setApprovedUsers] = useState<string[]>(['devmeziem@gmail.com']);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check approved users
    dbAdapter.getApprovedUsers().then(users => {
      setApprovedUsers(users || ['devmeziem@gmail.com']);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setCurrentUserEmail(user.email);
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

  return <VoxamFactoryApp userEmail={currentUserEmail} onSignOut={handleSignOut} />;
};

export default App;
