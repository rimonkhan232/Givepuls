import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../lib/db";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("givepulse:session");
    if (savedId) {
      const found = db.users.get(savedId);
      if (found && !found.banned) {
        setUser(found);
      } else if (found?.banned) {
        localStorage.removeItem("givepulse:session");
      }
    }
    setLoading(false);
  }, []);

  const login = ({ email, password }) => {
    const found = db.users.list().find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return { ok: false, error: "Invalid email or password." };
    if (found.banned) {
      return { ok: false, error: "This account has been suspended by an admin. Contact support for details." };
    }
    localStorage.setItem("givepulse:session", found.id);
    setUser(found);
    return { ok: true, user: found };
  };

  const register = ({ fullName, email, password }) => {
    const exists = db.users.list().some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return { ok: false, error: "An account with this email already exists." };
    const created = db.users.create({ fullName, email, password, role: "user" });
    db.donorProfiles.create({
      userId: created.id,
      fullName,
      bloodGroup: "O+",
      division: "Dhaka",
      address: "",
      phone: "",
      wants: "both",
      lastDonationDate: null,
      about: "",
      available: true,
      rating: 0,
      totalDonations: 0,
    });
    localStorage.setItem("givepulse:session", created.id);
    setUser(created);
    return { ok: true, user: created };
  };

  const logout = () => {
    localStorage.removeItem("givepulse:session");
    setUser(null);
  };

  const resetPassword = ({ email, newPassword }) => {
    const found = db.users.list().find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { ok: false, error: "No account found with that email." };
    db.users.update(found.id, { password: newPassword });
    return { ok: true };
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
