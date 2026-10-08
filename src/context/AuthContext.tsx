import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClubUser } from '../types';
import { getAllClubs, addClub, toggleClubVerified } from '../services/storageService';
import { ADMIN_USER } from '../data/sampleData';

interface AuthContextType {
  currentUser: ClubUser | null;
  isAdmin: boolean;
  isClub: boolean;
  isStudent: boolean;
  clubs: ClubUser[];
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  quickLoginAs: (clubIdOrAdmin: string) => void;
  createClub: (data: {
    name: string;
    email: string;
    category: string;
    coordinatorName: string;
    contactPhone: string;
    isVerified?: boolean;
  }) => ClubUser;
  toggleVerifiedStatus: (clubId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'snpsu_eventra_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<ClubUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [clubs, setClubs] = useState<ClubUser[]>(() => getAllClubs());

  const refreshClubs = () => {
    setClubs(getAllClubs());
  };

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_USER_KEY);
      }
    } catch (e) {
      console.warn('Failed to sync auth user to localStorage', e);
    }
  }, [currentUser]);

  const login = async (email: string, _password?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Check Admin
    if (cleanEmail === ADMIN_USER.email.toLowerCase() || cleanEmail === 'admin@snpsu.edu.in' || cleanEmail === 'admin') {
      setCurrentUser(ADMIN_USER);
      return { success: true };
    }

    // Check Clubs
    const currentClubs = getAllClubs();
    const foundClub = currentClubs.find(c => c.email.toLowerCase() === cleanEmail);

    if (foundClub) {
      setCurrentUser(foundClub);
      return { success: true };
    }

    return {
      success: false,
      message: 'Account not found. Clubs cannot self-register. Please contact the Student Affairs Office (Admin).',
    };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const quickLoginAs = (id: string) => {
    if (id === 'admin') {
      setCurrentUser(ADMIN_USER);
      return;
    }
    const currentClubs = getAllClubs();
    const found = currentClubs.find(c => c.id === id);
    if (found) {
      setCurrentUser(found);
    }
  };

  const createClub = (data: {
    name: string;
    email: string;
    category: string;
    coordinatorName: string;
    contactPhone: string;
    isVerified?: boolean;
  }): ClubUser => {
    const newClub = addClub({
      name: data.name,
      email: data.email,
      category: data.category,
      isVerified: data.isVerified ?? true,
      role: 'club',
      coordinatorName: data.coordinatorName,
      contactPhone: data.contactPhone,
    });
    refreshClubs();
    return newClub;
  };

  const toggleVerifiedStatus = (clubId: string) => {
    toggleClubVerified(clubId);
    refreshClubs();
    // If the current logged-in club is toggled, update session too
    if (currentUser && currentUser.id === clubId) {
      setCurrentUser(prev => prev ? { ...prev, isVerified: !prev.isVerified } : null);
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isClub = currentUser?.role === 'club';
  const isStudent = !currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isClub,
        isStudent,
        clubs,
        login,
        logout,
        quickLoginAs,
        createClub,
        toggleVerifiedStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
