
import React, { useState, useCallback, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import IdeWorkspace from './components/IdeWorkspace';
import AuthModal from './components/AuthModal';
import * as authService from './services/authService';
import * as projectService from './services/projectService';
import type { User, Workspace, FileAttachment } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signUp');
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [initialAttachment, setInitialAttachment] = useState<FileAttachment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          const userWorkspace = await projectService.getWorkspace();
          setWorkspace(userWorkspace);
        }
      } catch (error) {
        console.error("Error during session check:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleSignIn = async (user: User) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
    setIsLoading(true);
    try {
        const userWorkspace = await projectService.getWorkspace();
        setWorkspace(userWorkspace);
    } catch (error) {
        console.error("Failed to fetch workspace after sign in:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSignUp = async (user: User) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
    setIsLoading(true);
     try {
        // The backend should have created a default workspace on signup. We fetch it here.
        const userWorkspace = await projectService.getWorkspace();
        setWorkspace(userWorkspace);
    } catch (error) {
        console.error("Failed to fetch workspace after sign up:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
        await authService.signOut();
    } catch(error) {
        console.error("Failed to sign out:", error);
    } finally {
        setCurrentUser(null);
        setWorkspace(null);
    }
  };

  const handleStartFromLanding = (prompt: string, attachment?: FileAttachment | null) => {
    setInitialPrompt(prompt);
    setInitialAttachment(attachment || null);
    setAuthMode('signUp');
    setAuthModalOpen(true);
  };
  
  const handleOpenSignInModal = () => {
    setAuthMode('signIn');
    setAuthModalOpen(true);
  }
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <>
      {!currentUser || !workspace ? (
        <LandingPage onStart={handleStartFromLanding} onSignInClick={handleOpenSignInModal} />
      ) : (
        <IdeWorkspace
          key={currentUser.email} // Force remount on user change
          user={currentUser}
          initialWorkspace={workspace}
          onSignOut={handleSignOut}
          initialPrompt={initialPrompt}
          clearInitialPrompt={() => setInitialPrompt(null)}
          initialAttachment={initialAttachment}
          clearInitialAttachment={() => setInitialAttachment(null)}
        />
      )}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        initialMode={authMode}
        setMode={setAuthMode}
      />
    </>
  );
};

export default App;
