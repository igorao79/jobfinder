"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/dashboard", label: "Главная" },
    { href: "/generate", label: "Создать письмо" },
    { href: "/history", label: "История" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
          : "bg-white/70 backdrop-blur-md"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 bg-[var(--primary)] rounded-xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <span className="relative text-white font-display font-bold text-sm tracking-tight">
                JF
              </span>
            </div>
            <span className="font-display font-bold text-[18px] tracking-tight text-[var(--fg)]">
              Job<span className="text-[var(--primary)]">Finder</span>
            </span>
          </Link>

          {/* Desktop nav */}
          {session && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-[13px] font-semibold tracking-wide uppercase transition-all duration-200 ${
                    isActive(link.href)
                      ? "text-[var(--primary)] bg-[var(--primary-light)]"
                      : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right section */}
          <div className="flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                {/* Clickable avatar + name → scrolls to profile on dashboard */}
                <Link
                  href="/dashboard#profile"
                  className="hidden sm:flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-8 h-8 rounded-full ring-2 ring-white shadow-sm group-hover:ring-[var(--primary-light)] transition-all"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
                      <span className="text-[var(--primary)] font-display font-bold text-xs">
                        {session.user?.name?.[0] ?? "?"}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-[var(--fg-muted)] group-hover:text-[var(--fg)] transition-colors">
                    {session.user?.name?.split(" ")[0]}
                  </span>
                </Link>

                <button
                  onClick={() => signOut()}
                  className="text-[13px] font-medium text-[var(--fg-subtle)] hover:text-[var(--primary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--primary-light)]"
                >
                  Выйти
                </button>

                {/* Mobile hamburger */}
                <button
                  className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Меню"
                >
                  <div className="flex flex-col gap-[5px]">
                    <span
                      className={`block w-5 h-[2px] bg-[var(--fg)] rounded-full transition-all duration-300 ${
                        menuOpen ? "rotate-45 translate-y-[7px]" : ""
                      }`}
                    />
                    <span
                      className={`block w-5 h-[2px] bg-[var(--fg)] rounded-full transition-all duration-300 ${
                        menuOpen ? "opacity-0 scale-0" : ""
                      }`}
                    />
                    <span
                      className={`block w-5 h-[2px] bg-[var(--fg)] rounded-full transition-all duration-300 ${
                        menuOpen ? "-rotate-45 -translate-y-[7px]" : ""
                      }`}
                    />
                  </div>
                </button>
              </div>
            ) : (
              <Link href="/auth/signin" className="btn-primary !py-2.5 !px-5 !text-sm">
                Войти
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {session && menuOpen && (
          <nav className="md:hidden pb-5 animate-slide-down">
            <div className="flex flex-col gap-1 pt-2 border-t border-[var(--border)]">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-[var(--primary)] bg-[var(--primary-light)]"
                      : "text-[var(--fg-muted)] hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/dashboard#profile"
                className="px-4 py-3 rounded-xl text-[15px] font-medium text-[var(--fg-muted)] hover:bg-gray-50 transition-colors"
              >
                Профиль
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
