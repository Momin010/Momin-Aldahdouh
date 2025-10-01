import React, { useState, useCallback, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import IdeWorkspace from './components/IdeWorkspace';
import AuthModal from './components/AuthModal';
import * as authService from './services/authService';
import type { User, Workspace, Project } from './types';
import { INITIAL_CHAT_MESSAGE, INITIAL_FILES } from './constants';

const createNewProject = (name: string): Project => ({
  id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  projectName: name,
  history: {
    versions: [{
      files: INITIAL_FILES,
      previewHtml: '',
      chatMessages: [INITIAL_CHAT_MESSAGE],
      hasGeneratedCode: false,
      projectName: name,
      projectPlan: null,
    }],
    currentIndex: 0,
  }
});

const INITIAL_WORKSPACE: Workspace = {
  projects: [createNewProject('Untitled Project')],
  activeProjectId: null,
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<{[email: string]: Workspace}>(() => authService.getAllWorkspaces());
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signUp');
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setIsLoading(false);
  }, []);

  const handleSignIn = (user: User) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
    if (initialPrompt) {
      // User signed in via the landing page prompt flow
      // We'll let the effect below handle project creation
    }
  };

  const handleSignUp = (user: User) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
    // Create an initial workspace for the new user
    setWorkspaces(prev => {
        const newWorkspaces = { ...prev, [user.email]: INITIAL_WORKSPACE };
        authService.saveAllWorkspaces(newWorkspaces);
        return newWorkspaces;
    });
  };

  const handleSignOut = () => {
    authService.signOut();
    setCurrentUser(null);
  };

  const handleStartFromLanding = (prompt: string) => {
    setInitialPrompt(prompt);
    setAuthMode('signUp');
    setAuthModalOpen(true);
  };
  
  const handleOpenSignInModal = () => {
    setAuthMode('signIn');
    setAuthModalOpen(true);
  }

  const userWorkspace = currentUser ? workspaces[currentUser.email] || INITIAL_WORKSPACE : INITIAL_WORKSPACE;
  
  const setUserWorkspace = (updater: Workspace | ((ws: Workspace) => Workspace)) => {
    if (currentUser) {
        const newWorkspace = typeof updater === 'function' ? updater(userWorkspace) : updater;
        setWorkspaces(prev => {
            const newWorkspaces = { ...prev, [currentUser.email]: newWorkspace };
            authService.saveAllWorkspaces(newWorkspaces);
            return newWorkspaces;
        });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <>
      {!currentUser ? (
        <LandingPage onStart={handleStartFromLanding} onSignInClick={handleOpenSignInModal} />
      ) : (
        <IdeWorkspace
          key={currentUser.email} // Force remount on user change
          user={currentUser}
          workspace={userWorkspace}
          setWorkspace={setUserWorkspace}
          onSignOut={handleSignOut}
          initialPrompt={initialPrompt}
          clearInitialPrompt={() => setInitialPrompt(null)}
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
