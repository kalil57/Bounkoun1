import { useAuth } from "../context/AuthContext";
import { GraduationCap, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="border-b border-border-warm bg-cream px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand / Logo Wordmark */}
        <Link to="/projects" className="flex items-center gap-2 text-ink hover:opacity-90">
          <GraduationCap className="h-6 w-6 text-brand" />
          <span className="serif-heading text-lg font-bold tracking-tight text-brand">Bounkoun</span>
          <span className="hidden text-xs text-ink-muted/80 sm:inline">| AI Academic Advisor</span>
        </Link>

        {/* User Stats & Logout */}
        <div className="flex items-center gap-4">
          <span className="hidden text-xs font-medium text-ink-muted sm:inline-block">
            {user.email}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-md border border-border-warm bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-cream-dark transition-colors duration-150 shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
