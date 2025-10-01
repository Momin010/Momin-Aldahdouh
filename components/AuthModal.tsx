import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import * as authService from '../services/authService';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (user: User) => void;
  onSignUp: (user: User) => void;
  initialMode: 'signIn' | 'signUp';
  setMode: (mode: 'signIn' | 'signUp') => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSignIn, onSignUp, initialMode, setMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setEmail('');
      setPassword('');
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (initialMode === 'signUp') {
        const newUser = await authService.signUp(email, password);
        onSignUp(newUser);
      } else {
        const user = await authService.signIn(email, password);
        onSignIn(user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-scaleIn" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="relative w-full max-w-sm bg-gray-800/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-white/10 hover:text-white" aria-label="Close">
          <Icon name="close" className="w-5 h-5" />
        </button>

        <div>
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => setMode('signUp')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${initialMode === 'signUp' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}
            >
              Create Account
            </button>
            <button
              onClick={() => setMode('signIn')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${initialMode === 'signIn' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full bg-black/40 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="w-full bg-black/40 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full p-3 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Processing...' : (initialMode === 'signUp' ? 'Sign Up' : 'Sign In')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
