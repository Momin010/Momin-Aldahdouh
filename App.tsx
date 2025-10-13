
import React, { useState, useCallback, useEffect, useRef } from 'react';
import LandingPage from './components/LandingPage';
import IdeWorkspace from './components/IdeWorkspace';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { ThemeProvider } from './lib/themeContext';
import * as authService from './services/authService';
import * as projectService from './services/projectService';
import usePersistentState from './hooks/usePersistentState';
import { useDebounce } from './hooks/useDebounce';
import type { User, Workspace, FileAttachment, Project } from './types';
import { v4 as uuidv4 } from 'uuid';
import { INITIAL_CHAT_MESSAGE } from './constants';

const createDefaultWorkspace = (projectName: string): Workspace => {
  const newProject: Project = {
    id: uuidv4(),
    projectName: projectName || 'Untitled Project',
    history: {
      versions: [{
        files: {},
        previewHtml: '',
        standaloneHtml: '',
        chatMessages: [INITIAL_CHAT_MESSAGE],
        hasGeneratedCode: false,
        projectName: projectName || 'Untitled Project',
        projectPlan: null,
      }],
      currentIndex: 0,
    },
  };
  return {
    projects: [newProject],
    activeProjectId: newProject.id,
  };
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userWorkspace, setUserWorkspace] = useState<Workspace | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestWorkspace, setGuestWorkspace] = usePersistentState<Workspace | null>('mominai_guest_workspace', null);

  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signUp');
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [initialAttachment, setInitialAttachment] = useState<FileAttachment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  const isInitialMountRef = useRef(true);

  // Debounce the active project from the current workspace for saving
  const activeUserProject = useDebounce(userWorkspace?.projects.find(p => p.id === userWorkspace.activeProjectId), 2000);

  // Auto-save debounced project changes for logged-in users
  useEffect(() => {
    if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        return;
    }
    if (activeUserProject && currentUser) {
        projectService.updateProject(activeUserProject).catch(err => {
            console.error("Failed to auto-save project:", err);
        });
    }
  }, [activeUserProject, currentUser]);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          const workspaceData = await projectService.getWorkspace();
          setUserWorkspace(workspaceData);
        }
      } catch (error) {
        console.error("Error during session check:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const migrateGuestWorkspace = async (user: User) => {
    if (!guestWorkspace || guestWorkspace.projects.length === 0) {
      return;
    }
    setIsMigrating(true);
    try {
      for (const guestProject of guestWorkspace.projects) {
        const newServerProject = await projectService.createProject(guestProject.projectName);
        await projectService.updateProject({ ...guestProject, id: newServerProject.id });
      }
      const finalWorkspace = await projectService.getWorkspace();
      setUserWorkspace(finalWorkspace);
      setGuestWorkspace(null); // Clear guest data from local storage
      setIsGuest(false);
    } catch (error) {
      console.error("Failed to migrate guest workspace:", error);
      alert("There was an issue saving your temporary work. Please try again or download your project as a ZIP file.");
    } finally {
      setIsMigrating(false);
    }
  };

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
    await migrateGuestWorkspace(user);
    
    // Fetch workspace if not migrating or migration failed to ensure user sees something
    if (!isMigrating) {
        setIsLoading(true);
        try {
            const workspaceData = await projectService.getWorkspace();
            setUserWorkspace(workspaceData);
        } catch (error) {
            console.error("Failed to fetch workspace after auth:", error);
        } finally {
            setIsLoading(false);
        }
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setCurrentUser(null);
      setUserWorkspace(null);
      setIsGuest(false);
    }
  };

  const handleStartFromLanding = (prompt: string, attachment?: FileAttachment | null) => {
    setInitialPrompt(prompt);
    setInitialAttachment(attachment || null);
    if (!guestWorkspace) {
      setGuestWorkspace(createDefaultWorkspace(prompt.substring(0, 30)));
    }
    setIsGuest(true);
  };
  
  const handleOpenAuthModal = (mode: 'signIn' | 'signUp') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };
  
  const handleWorkspaceChange = useCallback((updater: React.SetStateAction<Workspace | null>) => {
      if (currentUser) {
        setUserWorkspace(updater);
      } else {
        setGuestWorkspace(updater);
      }
  }, [currentUser, setGuestWorkspace]);

  if (isLoading || isMigrating) {
    const message = isMigrating ? 'Saving your work to your account...' : 'Loading...';
    return (
      <div className="h-screen bg-gray-900 text-white">
        <LoadingSpinner message={message} size="lg" className="h-full" />
      </div>
    );
  }
  
  const workspaceForRender = currentUser ? userWorkspace : (isGuest ? guestWorkspace : null);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        {workspaceForRender ? (
          <IdeWorkspace
            key={currentUser?.email || 'guest'}
            user={currentUser}
            workspace={workspaceForRender}
            onWorkspaceChange={handleWorkspaceChange}
            onSignOut={handleSignOut}
            onSignUpClick={() => handleOpenAuthModal('signUp')}
            initialPrompt={initialPrompt}
            clearInitialPrompt={() => setInitialPrompt(null)}
            initialAttachment={initialAttachment}
            clearInitialAttachment={() => setInitialAttachment(null)}
          />
        ) : (
          <LandingPage onStart={handleStartFromLanding} onSignInClick={() => handleOpenAuthModal('signIn')} />
        )}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSignIn={handleAuthSuccess}
          onSignUp={handleAuthSuccess}
          initialMode={authMode}
          setMode={setAuthMode}
        />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
