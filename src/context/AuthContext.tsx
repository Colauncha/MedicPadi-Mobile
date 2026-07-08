import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  AuthUser,
  ProfileData,
  RegisterData,
  apiLogin,
  apiRegister,
  apiLogout,
  apiGetProfile,
  setUnauthorizedHandler,
  storeToken,
  getStoredToken,
  clearStoredToken,
  storeUser,
  getStoredUser,
  clearStoredUser,
} from '../services/api';

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  profile: ProfileData | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (p: ProfileData | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    hydrateAuth();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredToken().catch(() => {});
      clearStoredUser().catch(() => {});
      setToken(null);
      setUser(null);
      setProfile(null);
    });
  }, []);

  const hydrateAuth = async () => {
    try {
      const [tok, usr] = await Promise.all([getStoredToken(), getStoredUser()]);
      if (tok) {
        setToken(tok);
        if (usr) setUser(usr);
        await fetchProfile(tok);
      }
    } catch {
      // silently ignore — user will need to log in
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (tok: string) => {
    try {
      const p = await apiGetProfile(tok);
      setProfile(p);
      // Sync user from embedded profile.user if the user state is not yet populated
      if (p?.rest) {
        setUser((prev) => {
          if (prev) return prev;
          storeUser(p.rest!).catch(() => {});
          return p.rest!;
        });
      }
    } catch {
      setProfile(null);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    const accessToken = res.token.access_token;
    // Fetch profile once; derive authUser from login response or embedded profile.rest
    const profileRes = await apiGetProfile(accessToken);
    const authUser: AuthUser | undefined = res.user ?? profileRes?.rest;
    await Promise.all([storeToken(accessToken), storeUser(authUser || null)]);
    setToken(accessToken);
    setUser(authUser || null);
    setProfile(profileRes);
  };

  const register = async (data: RegisterData) => {
    await apiRegister(data);
  };

  const logout = async () => {
    if (token) {
      try { await apiLogout(token); } catch { /* ignore */ }
    }
    await Promise.all([clearStoredToken(), clearStoredUser()]);
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (token) await fetchProfile(token);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        profile,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
