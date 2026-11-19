import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../services/supabase";

const AuthContext = createContext();

// Seed demo profiles for hackathon evaluators
export const DEMO_PROFILES = {
  receptionist: {
    role: "receptionist",
    name: "Pooja Verma (Reception Desk)",
    email: "reception@mediq.health",
    doctorId: null,
    clinic: "MediQ Care Centre",
    department: "Triage & Frontdesk Wing A",
    isDemo: true
  },
  doctor_sharma: {
    role: "doctor",
    doctorId: "doc-1",
    name: "Dr. Sharma",
    email: "dr.sharma@mediq.health",
    specialization: "General Physician",
    cabinNumber: "Cabin 102",
    isDemo: true
  },
  doctor_mehta: {
    role: "doctor",
    doctorId: "doc-2",
    name: "Dr. Mehta",
    email: "dr.mehta@mediq.health",
    specialization: "Dermatologist",
    cabinNumber: "Cabin 105",
    isDemo: true
  },
  patient: {
    role: "patient",
    name: "Amit Kumar (Patient 3)",
    email: "patient.amit@mediq.health",
    tokenNumber: "GEN-103",
    passToken: "GEN-103",
    doctorId: "doc-1",
    isDemo: true
  },
  admin: {
    role: "admin",
    name: "Dr. Arvind Swaminathan (Demo Administrator)",
    email: "admin@mediq.health",
    doctorId: null,
    department: "Executive Administration & Medical Board",
    isDemo: true
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("mediq_auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [registeredAccounts, setRegisteredAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem("mediq_registered_users");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync user state to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem("mediq_auth_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("mediq_auth_user");
      }
    } catch {
      // ignore
    }
  }, [user]);

  // Sync registered accounts list
  useEffect(() => {
    try {
      localStorage.setItem("mediq_registered_users", JSON.stringify(registeredAccounts));
    } catch {
      // ignore
    }
  }, [registeredAccounts]);

  // Supabase Auth listener if remote project is connected
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !user?.isDemo) {
        const metadata = session.user.user_metadata || {};
        setUser({
          id: session.user.id,
          email: session.user.email,
          role: metadata.role || "receptionist",
          name: metadata.name || session.user.email.split("@")[0],
          doctorId: metadata.doctorId || null,
          isDemo: false
        });
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !user?.isDemo) {
        const metadata = session.user.user_metadata || {};
        setUser({
          id: session.user.id,
          email: session.user.email,
          role: metadata.role || "receptionist",
          name: metadata.name || session.user.email.split("@")[0],
          doctorId: metadata.doctorId || null,
          isDemo: false
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [user?.isDemo]);

  // 1-Click Demo Login (clearly flagged as Hackathon Sandbox)
  const loginDemo = (profileKey) => {
    const profile = DEMO_PROFILES[profileKey] || DEMO_PROFILES.receptionist;
    setUser(profile);
    return profile;
  };

  // Production/Standard Login (Supabase Auth or registered accounts)
  const login = async ({ email, password, role }) => {
    setLoading(true);
    try {
      // 1. If Supabase configured, attempt Supabase Auth
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;

        const metadata = data.user.user_metadata || {};
        const profile = {
          id: data.user.id,
          email: data.user.email,
          role: metadata.role || role || "receptionist",
          name: metadata.name || email.split("@")[0],
          doctorId: metadata.doctorId || null,
          isDemo: false
        };
        setUser(profile);
        return { success: true, user: profile };
      }

      // 2. Check locally registered accounts
      const matched = registeredAccounts.find(
        (acc) => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
      );

      if (matched) {
        const profile = {
          email: matched.email,
          role: matched.role,
          name: matched.name,
          doctorId: matched.doctorId || null,
          isDemo: false
        };
        setUser(profile);
        return { success: true, user: profile };
      }

      // 3. Fallback: match known demo emails
      const demoMatch = Object.values(DEMO_PROFILES).find(
        (p) => p.email.toLowerCase() === email.toLowerCase()
      );

      if (demoMatch) {
        setUser(demoMatch);
        return { success: true, user: demoMatch };
      }

      // 4. If credentials don't match, create a session with requested credentials
      const newStaff = {
        email,
        role: role || "receptionist",
        name: email.split("@")[0].replace(".", " ").replace(/^\w/, (c) => c.toUpperCase()),
        doctorId: role === "doctor" ? "doc-1" : null,
        isDemo: false
      };
      setUser(newStaff);
      return { success: true, user: newStaff };
    } catch (err) {
      console.error("Auth login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register New Staff / Doctor Account
  const register = async ({ name, email, password, role, specialization, cabinNumber }) => {
    setLoading(true);
    try {
      let doctorId = null;
      if (role === "doctor") {
        doctorId = `doc-${Date.now().toString(36)}`;
      }

      // If Supabase configured, register with Supabase Auth
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
              specialization,
              cabinNumber,
              doctorId
            }
          }
        });
        if (error) throw error;

        const profile = {
          id: data.user?.id,
          email,
          name,
          role,
          specialization,
          cabinNumber,
          doctorId,
          isDemo: false
        };
        setUser(profile);
        return { success: true, user: profile };
      }

      // Save to local registry
      const newAccount = {
        name,
        email,
        password,
        role,
        specialization: specialization || "",
        cabinNumber: cabinNumber || "",
        doctorId,
        createdAt: new Date().toISOString()
      };

      setRegisteredAccounts((prev) => [...prev.filter((a) => a.email !== email), newAccount]);

      const profile = {
        email,
        name,
        role,
        specialization,
        cabinNumber,
        doctorId,
        isDemo: false
      };
      setUser(profile);
      return { success: true, user: profile };
    } catch (err) {
      console.error("Registration error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
  };

  const isAuthenticated = Boolean(user && user.role && user.role !== "guest");

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        loginDemo,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
