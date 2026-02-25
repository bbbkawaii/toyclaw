import { type JSX } from "react";
import { Link, useLocation } from "react-router-dom";

interface AppHeaderProps {
  variant?: "transparent" | "glass";
}

export function AppHeader({ variant = "glass" }: AppHeaderProps): JSX.Element {
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "首页" },
    { to: "/dashboard", label: "控制台" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${
        variant === "glass"
          ? "glass-nav"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-20 px-6">
        <Link to="/" className="flex items-center space-x-3 group no-underline">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
            <span>T</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            ToyBridge AI
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-10 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`transition-colors no-underline ${
                location.pathname === link.to
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-toy-secondary hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-toy-secondary hover:text-primary transition-colors">
            <i className="fa-regular fa-bell text-lg" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <div className="h-8 w-px bg-gray-200 mx-2" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm">
              <i className="fas fa-user text-gray-500 text-sm" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
