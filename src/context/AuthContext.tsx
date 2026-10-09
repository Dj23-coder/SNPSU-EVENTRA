import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClubUser, ClubAccessRequest } from '../types';
import {
  getAllClubs,
  addClub,
  updateClub,
  toggleClubVerified,
  toggleClubActive,
  getAllAccessRequests,
  saveAccessRequest,
  updateAccessRequestStatus,
} from '../services/storageService';
import {
  createClubWithSecondaryFirebaseApp,
  sendClubPasswordReset,
} from '../services/firebaseService';
import { ADMIN_USER } from '../data/sampleData';

interface AuthContextType {
  currentUser: ClubUser | null;
  isAdmin: boolean;
  isClub: boolean;
  isStudent: boolean;
  clubs: ClubUser[];
  accessRequests: ClubAccessRequest[];
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  quickLoginAs: (clubIdOrAdmin: string) => { success: boolean; message?: string };
  createClub: (data: {
    name: string;
    email: string;
    category?: string;
    coordinatorName: string;
    contactPhone?: string;
    logoUrl?: string;
    isVerified?: boolean;
  }) => Promise<{ success: boolean; club?: ClubUser; message: string }>;
  updateClubDetails: (clubId: string, updates: Partial<ClubUser>) => ClubUser | null;
  toggleVerifiedStatus: (clubId: string) => void;
  toggleActiveStatus: (clubId: string) => { success: boolean; active: boolean; message: string };
  resetPasswordForClub: (clubId: string) => Promise<{ success: boolean; message: string }>;
  submitAccessRequest: (req: Omit<ClubAccessRequest, 'id' | 'status' | 'requestedAt'>) => void;
  handleAccessRequest: (requestId: string, action: 'approved' | 'rejected') => void;
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
  const [accessRequests, setAccessRequests] = useState<ClubAccessRequest[]>(() => getAllAccessRequests());

  const refreshClubs = () => {
    setClubs(getAllClubs());
  };

  const refreshRequests = () => {
    setAccessRequests(getAllAccessRequests());
  };

  useEffect(() => {
    const handleClubsUpdate = () => refreshClubs();
    const handleRequestsUpdate = () => refreshRequests();

    window.addEventListener('snpsu-clubs-updated', handleClubsUpdate);
    window.addEventListener('snpsu-requests-updated', handleRequestsUpdate);

    return () => {
      window.removeEventListener('snpsu-clubs-updated', handleClubsUpdate);
      window.removeEventListener('snpsu-requests-updated', handleRequestsUpdate);
    };
  }, []);

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
      // SUSPENDED CLUB CHECK (SECTION 5)
      if (foundClub.active === false) {
        return {
          success: false,
          message: 'Your club access is paused. Contact the Student Affairs Office.',
        };
      }
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

  const quickLoginAs = (id: string): { success: boolean; message?: string } => {
    if (id === 'admin') {
      setCurrentUser(ADMIN_USER);
      return { success: true };
    }
    const currentClubs = getAllClubs();
    const found = currentClubs.find(c => c.id === id);
    if (found) {
      if (found.active === false) {
        return {
          success: false,
          message: 'Your club access is paused. Contact the Student Affairs Office.',
        };
      }
      setCurrentUser(found);
      return { success: true };
    }
    return { success: false, message: 'Club not found.' };
  };

  const createClub = async (data: {
    name: string;
    email: string;
    category?: string;
    coordinatorName: string;
    contactPhone?: string;
    logoUrl?: string;
    isVerified?: boolean;
  }): Promise<{ success: boolean; club?: ClubUser; message: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();

    // Block duplicate email or name
    const currentClubs = getAllClubs();
    if (currentClubs.some(c => c.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: `A club account with email ${cleanEmail} already exists.` };
    }
    if (currentClubs.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      return { success: false, message: `A club named "${cleanName}" already exists.` };
    }

    // Safe secondary Firebase Authentication initialization
    const firebaseRes = await createClubWithSecondaryFirebaseApp({
      name: cleanName,
      coordinatorName: data.coordinatorName.trim(),
      email: cleanEmail,
      isVerified: data.isVerified ?? false,
      category: data.category || 'Technical',
      contactPhone: data.contactPhone,
      logoUrl: data.logoUrl,
      createdBy: currentUser?.id || 'admin-snpsu',
    });

    // Save authoritative record in storage
    const newClub = addClub({
      name: cleanName,
      email: cleanEmail,
      category: data.category || 'Technical',
      isVerified: data.isVerified ?? false,
      coordinatorName: data.coordinatorName.trim(),
      contactPhone: data.contactPhone || '',
      logoUrl: data.logoUrl,
    });

    refreshClubs();
    return {
      success: true,
      club: newClub,
      message: firebaseRes.message || `Club ${cleanName} created! Password reset instructions dispatched.`,
    };
  };

  const updateClubDetails = (clubId: string, updates: Partial<ClubUser>): ClubUser | null => {
    const res = updateClub(clubId, updates);
    refreshClubs();
    if (currentUser?.id === clubId && res) {
      setCurrentUser(res);
    }
    return res;
  };

  const toggleVerifiedStatus = (clubId: string) => {
    const updated = toggleClubVerified(clubId);
    refreshClubs();
    if (currentUser && currentUser.id === clubId && updated) {
      setCurrentUser(updated);
    }
  };

  const toggleActiveStatus = (clubId: string): { success: boolean; active: boolean; message: string } => {
    const updated = toggleClubActive(clubId);
    refreshClubs();
    if (currentUser && currentUser.id === clubId) {
      if (updated && !updated.active) {
        // Log out suspended club if currently logged in
        setCurrentUser(null);
      } else if (updated) {
        setCurrentUser(updated);
      }
    }
    const isActive = Boolean(updated?.active);
    return {
      success: true,
      active: isActive,
      message: isActive
        ? 'Club reactivated. Events are now visible to students.'
        : 'Club suspended. Events hidden from students and coordinator access paused.',
    };
  };

  const resetPasswordForClub = async (clubId: string): Promise<{ success: boolean; message: string }> => {
    const currentClubs = getAllClubs();
    const club = currentClubs.find(c => c.id === clubId);
    if (!club) {
      return { success: false, message: 'Club not found.' };
    }
    return sendClubPasswordReset(club.email);
  };

  const submitAccessRequest = (req: Omit<ClubAccessRequest, 'id' | 'status' | 'requestedAt'>) => {
    saveAccessRequest(req);
    refreshRequests();
  };

  const handleAccessRequest = (requestId: string, action: 'approved' | 'rejected') => {
    updateAccessRequestStatus(requestId, action);
    refreshRequests();
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
        accessRequests,
        login,
        logout,
        quickLoginAs,
        createClub,
        updateClubDetails,
        toggleVerifiedStatus,
        toggleActiveStatus,
        resetPasswordForClub,
        submitAccessRequest,
        handleAccessRequest,
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

