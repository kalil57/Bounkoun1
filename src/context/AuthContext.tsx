import { createContext, useState, useContext, ReactNode } from "react";

interface AuthContextType {
  token: string | null;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  apiBaseUrl: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL || "https://bounkoun-core.onrender.com";

  const login = async (email: string, password: string) => {
    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to log in.");
    }

    if (data?.session?.access_token) {
      setToken(data.session.access_token);
      setUser(data.user || { email });
    } else {
      throw new Error("Invalid server response format. Missing access token.");
    }
  };

  const signup = async (email: string, password: string) => {
    const response = await fetch(`${apiBaseUrl}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to sign up.");
    }

    // After signup, let's auto-login if the signup returned a session, or throw so they log in
    if (data?.session?.access_token) {
      setToken(data.session.access_token);
      setUser(data.user || { email });
    } else {
      // If Supabase requires email verification, we alert.
      // But standard Supabase config in bounkoun core has autologin.
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, signup, logout, apiBaseUrl }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
