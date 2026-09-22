import { storage } from '@/utils/storage';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AuthUser,
  ProfileData,
  RegisterData,
  apiGetProfile,
  apiLogin,
  apiLogout,
  apiRegister,
  clearStoredToken,
  clearStoredUser,
  getStoredToken,
  getStoredUser,
  setUnauthorizedHandler,
  storeToken,
  storeUser,
} from '../services/api';

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  profile: ProfileData | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (p: ProfileData | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IS_LOGGED_IN = 'isLoggedIn';

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Decodes a JWT payload and returns its `exp` claim in milliseconds since epoch.
// Returns null if the token is malformed or has no exp claim.
function getTokenExpiryMs(token: string): number | null {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return null;

    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    );

    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  // Clears stored auth data and resets state when the token expires.
  const handleTokenExpiry = useCallback(async () => {
    clearExpiryTimer();
    try {
      await Promise.all([
        clearStoredToken(),
        clearStoredUser(),
        storage.deleteItem(IS_LOGGED_IN),
      ]);
    } catch {
      // ignore — state reset below still happens
    }
    setToken(null);
    setUser(null);
    setProfile(null);
    setIsLoggedIn(false);
  }, [clearExpiryTimer]);

  // Schedules auto-logout based on the token's exp claim whenever the token changes.
  useEffect(() => {
    clearExpiryTimer();

    if (!token) return;

    const expiryMs = getTokenExpiryMs(token);
    if (expiryMs === null) return;

    const msUntilExpiry = expiryMs - Date.now();

    expiryTimerRef.current = setTimeout(() => {
      handleTokenExpiry();
    }, msUntilExpiry);

    return clearExpiryTimer;
  }, [token, clearExpiryTimer, handleTokenExpiry]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredToken().catch(() => {});
      clearStoredUser().catch(() => {});
      setToken(null);
      setUser(null);
      setProfile(null);
      setIsLoggedIn(false);
    });
  }, []);

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

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [tok, usr, isLogged] = await Promise.all([
          getStoredToken(),
          getStoredUser(),
          storage.getItem(IS_LOGGED_IN),
        ]);

        if (!mounted) return;

        if (tok) {
          setToken(tok);
          if (usr) setUser(usr);
          await fetchProfile(tok);
          if (mounted) setIsLoggedIn(JSON.parse(isLogged || 'false'));
        }
      } catch {
        // silently ignore — user will need to log in
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    const accessToken = res.token.access_token;

    // TODO: If user === 'patient' redirect them to a 'download the patient app page'

    // Fetch profile once; derive authUser from login response or embedded profile.rest
    const profileRes = await apiGetProfile(accessToken);
    const authUser: AuthUser | undefined = res.user ?? profileRes?.rest;
    await Promise.all([
      storeToken(accessToken),
      storeUser(authUser || null),
      storage.setItem(IS_LOGGED_IN, JSON.stringify(true)),
    ]);
    setToken(accessToken);
    setUser(authUser || null);
    setProfile(profileRes);
    setIsLoggedIn(true);
  };

  const register = async (data: RegisterData) => {
    await apiRegister(data);
  };

  const logout = async () => {
    if (token) {
      try {
        await apiLogout(token);
      } catch {
        /* ignore */
      }
    }
    clearExpiryTimer();
    await Promise.all([
      clearStoredToken(),
      clearStoredUser(),
      storage.deleteItem(IS_LOGGED_IN),
    ]);
    setToken(null);
    setUser(null);
    setProfile(null);
    setIsLoggedIn(false);
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
        isLoggedIn,
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
