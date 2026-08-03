import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Mail, CheckCircle2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { db } from "../lib/db";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const exists = db.users.list().some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!exists) {
      setError("No account found with that email.");
      return;
    }
    setError("");
    setSent(true);
    setTimeout(() => navigate("/reset-password", { state: { email } }), 1400);
  };

  return (
    <AuthLayout
      icon={<KeyRound className="text-white" size={22} />}
      title="Reset your password"
      subtitle="We'll help you get back into your account"
      footer={
        <span>
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-crimson-700 hover:underline">
            Log in
          </Link>
        </span>
      }
    >
      {sent ? (
        <div className="text-center py-6">
          <CheckCircle2 className="mx-auto text-crimson-600" size={40} />
          <p className="mt-3 text-sm text-crimson-900/70">
            Verified — taking you to set a new password…
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-crimson-950">Email</label>
            <div className="mt-1.5 relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-crimson-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-crimson-200 focus-ring bg-white/80 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-sm text-crimson-700 bg-crimson-50 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-95 transition-opacity"
          >
            Send reset link
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
