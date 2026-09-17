"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn, timeAgo } from "@/lib/utils";
import type { ActivityItem } from "@/lib/stats";
import { Avatar, Badge } from "./ui";
import {
  IcBell,
  IcBook,
  IcChart,
  IcDashboard,
  IcFileText,
  IcFolder,
  IcLogout,
  IcMenu,
  IcMessage,
  IcPen,
  IcSearch,
  IcSliders,
  IcSparkles,
  IcTarget,
  IcX,
} from "./icons";

interface ShellUser {
  id: string;
  name: string;
  email: string;
  avatarHue: number;
}

interface SearchResult {
  type: string;
  title: string;
  href: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: (p: { className?: string }) => ReactNode;
  exact?: boolean;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Main",
    items: [{ href: "/dashboard", label: "Dashboard", icon: IcDashboard, exact: true }],
  },
  {
    section: "Learn",
    items: [
      { href: "/dashboard/tutor", label: "AI Tutor", icon: IcMessage },
      { href: "/dashboard/summarizer", label: "Summarizer", icon: IcFileText },
      { href: "/dashboard/quiz", label: "Quiz Generator", icon: IcTarget },
    ],
  },
  {
    section: "Organize",
    items: [
      { href: "/dashboard/notes", label: "Notes", icon: IcPen },
      { href: "/dashboard/materials", label: "Study Materials", icon: IcFolder },
    ],
  },
  {
    section: "Insight",
    items: [{ href: "/dashboard/progress", label: "Progress", icon: IcChart }],
  },
  {
    section: "Account",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: IcSliders }],
  },
];

function Logo({ dark }: { dark?: boolean }) {
  return (
    <a href={dark ? "/dashboard" : "/"} className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm shadow-brand-900/40">
        <IcSparkles className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
      </span>
      <span
        className={cn(
          "font-display text-[17px] font-extrabold tracking-tight",
          dark ? "text-paper" : "text-ink",
        )}
      >
        Study<span className="text-brand-500">AI</span>
      </span>
    </a>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Dashboard">
      {NAV.map((group) => (
        <div key={group.section}>
          <p className="mb-1.5 px-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-paper/30">
            {group.section}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-all",
                      active
                        ? "bg-brand-500/15 text-white"
                        : "text-paper/55 hover:bg-white/5 hover:text-paper",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        active
                          ? "text-brand-400"
                          : "text-paper/40 group-hover:text-paper/70",
                      )}
                    />
                    {item.label}
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function activityIcon(activity: string) {
  switch (activity) {
    case "tutor":
      return IcMessage;
    case "summarizer":
      return IcFileText;
    case "quiz":
      return IcTarget;
    case "notes":
      return IcPen;
    case "materials":
      return IcFolder;
    default:
      return IcBook;
  }
}

export function DashShell({
  user,
  activity,
  aiEnabled,
  children,
}: {
  user: ShellUser;
  activity: ActivityItem[];
  aiEnabled: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced global search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = (await res.json()) as { results: SearchResult[] };
          setResults(data.results);
        }
      } catch {
        /* ignore */
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* fall through — always leave the app on logout */
    }
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-[#0B1512] lg:flex">
        <div className="px-5 py-5">
          <Logo dark />
        </div>
        <NavList />
        <div className="border-t border-white/8 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <Avatar name={user.name} hue={user.avatarHue} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-paper">{user.name}</p>
              <p className="truncate text-[11px] text-paper/40">{user.email}</p>
            </div>
            <button
              onClick={logout}
              disabled={loggingOut}
              className="rounded-md p-2 text-paper/40 transition hover:bg-white/10 hover:text-paper disabled:opacity-50"
              aria-label="Log out"
              title="Log out"
            >
              <IcLogout className="h-4 w-4" />
            </button>
          </div>
          <p
            className={cn(
              "mt-2 flex items-center gap-1.5 px-2 text-[10.5px] font-semibold",
              aiEnabled ? "text-emerald-400" : "text-amber-400",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", aiEnabled ? "bg-emerald-400" : "bg-amber-400")} />
            {aiEnabled ? "AI provider connected" : "Offline AI mode (no API key)"}
          </p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="drawer-in absolute inset-y-0 left-0 flex w-[270px] flex-col bg-[#0B1512] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-5">
              <Logo dark />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 text-paper/50 hover:bg-white/10"
                aria-label="Close menu"
              >
                <IcX className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <NavList onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-white/8 p-4">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-semibold text-paper/60 transition hover:bg-white/5 hover:text-paper"
              >
                <IcLogout className="h-4 w-4" /> Log out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-mist bg-paper/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-ink/60 transition hover:bg-ink/5 lg:hidden"
              aria-label="Open menu"
            >
              <IcMenu className="h-5 w-5" />
            </button>

            {/* Global search */}
            <div ref={searchRef} className="relative hidden max-w-md flex-1 sm:block">
              <IcSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, quizzes, materials…"
                className="h-10 w-full rounded-lg border border-mist bg-white pl-10 pr-4 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                aria-label="Search your study content"
              />
              {results !== null && (
                <div className="absolute inset-x-0 top-12 z-50 max-h-80 overflow-y-auto rounded-xl border border-mist bg-white p-2 shadow-xl">
                  {searching ? (
                    <p className="px-3 py-2.5 text-[13px] text-ink/40">Searching…</p>
                  ) : results.length === 0 ? (
                    <p className="px-3 py-2.5 text-[13px] text-ink/40">
                      No matches for “{query.trim()}”.
                    </p>
                  ) : (
                    results.map((r, i) => (
                      <a
                        key={`${r.type}-${i}`}
                        href={r.href}
                        onClick={() => setQuery("")}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-brand-50"
                      >
                        <Badge tone="brand" className="w-20 justify-center capitalize">
                          {r.type}
                        </Badge>
                        <span className="truncate font-medium text-ink/80">{r.title}</span>
                      </a>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    setMenuOpen(false);
                  }}
                  className={cn(
                    "relative rounded-lg p-2.5 text-ink/55 transition hover:bg-ink/5 hover:text-ink",
                    notifOpen && "bg-ink/5 text-ink",
                  )}
                  aria-label="Notifications"
                >
                  <IcBell className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                  {activity.length > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold-400 ring-2 ring-paper" />
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-mist bg-white p-2 shadow-xl">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-ink/40">
                      Recent activity
                    </p>
                    {activity.length === 0 ? (
                      <p className="px-3 py-3 text-[13px] text-ink/45">
                        Your recent study activity will show up here.
                      </p>
                    ) : (
                      activity.map((a) => {
                        const Icon = activityIcon(a.activity);
                        return (
                          <div key={a.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-ink/3">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-ink/80">
                                <span className="capitalize">{a.activity}</span>
                                {a.topic ? ` · ${a.topic}` : ""}
                              </p>
                              <p className="text-[11.5px] text-ink/40">{timeAgo(a.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* User menu */}
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => {
                    setMenuOpen((v) => !v);
                    setNotifOpen(false);
                  }}
                  className="flex items-center rounded-full transition hover:opacity-85"
                  aria-label="Account menu"
                >
                  <Avatar name={user.name} hue={user.avatarHue} size="md" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-mist bg-white p-2 shadow-xl">
                    <div className="border-b border-mist px-3 pb-2.5 pt-1.5">
                      <p className="truncate text-[13px] font-bold text-ink">{user.name}</p>
                      <p className="truncate text-[12px] text-ink/45">{user.email}</p>
                    </div>
                    <a
                      href="/dashboard/settings"
                      className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-ink/5 hover:text-ink"
                    >
                      <IcSliders className="h-4 w-4" /> Settings
                    </a>
                    <button
                      onClick={logout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <IcLogout className="h-4 w-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1200px] px-4 py-7 sm:px-6 sm:py-9">{children}</main>
      </div>
    </div>
  );
}
