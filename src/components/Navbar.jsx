
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Gamepad2, Menu, X, House, Music2, Grid2X2 } from "lucide-react";

const links = [
  { to: "/", label: "Alla spel", icon: House, end: true },
  { to: "/latspelet", label: "Låtspelet", icon: Music2 },
  { to: "/ordspelet", label: "Ordspelet", icon: Grid2X2 },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b0c]/95 text-white backdrop-blur">
      <nav className="mx-auto max-w-6xl px-4 sm:px-5">
        <div className="flex min-h-[68px] items-center justify-between">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <Gamepad2 size={23} strokeWidth={2.3} />
            </span>

            <span className="text-xl font-extrabold tracking-tight">
              småspel.se
            </span>
          </Link>

          {/* Dator: visa länkarna direkt */}
          <div className="hidden items-center gap-2 sm:flex">
            {links.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2 text-sm font-semibold transition ${
isActive
  ? "bg-white !text-black"
  : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Mobil: menyknapp */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 transition hover:bg-white/10 sm:hidden"
            aria-label={menuOpen ? "Stäng meny" : "Öppna meny"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        {/* Mobilmeny */}
        {menuOpen && (
          <div className="space-y-1 border-t border-white/10 py-3 sm:hidden">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition ${
isActive
  ? "bg-white !text-black"
  : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon size={19} />
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
