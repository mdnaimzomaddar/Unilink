"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import { toast } from "react-toastify";
import { signOut } from "@/lib/auth-client";
import Avatar from "@/components/avatar";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/theme-toggle";
import { Container } from "@/components/layout-kit";
import {
  IconBell,
  IconBriefcase,
  IconChat,
  IconClose,
  IconGrid,
  IconLogout,
  IconMedal,
  IconMenu,
  IconPlus,
  IconShield,
  IconZap,
} from "@/components/icons";

export type NavUser = {
  name: string;
  email: string;
  role: string;
  notif: number;
  chat: number;
  connects: number;
  silver: number;
};

const LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/about", label: "About" },
];

function menuItems(user: NavUser): { href: string; label: string; icon: IconType }[] {
  return [
    { href: "/dashboard", label: "Dashboard", icon: IconGrid },
    { href: "/dashboard?tab=jobs", label: "আমার Job", icon: IconBriefcase },
    { href: "/dashboard?tab=messages", label: "Messages", icon: IconChat },
    { href: "/dashboard?tab=wallet", label: "Connect ও Silver post", icon: IconZap },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Admin panel", icon: IconShield }] : []),
  ];
}

function useLogout(after?: () => void) {
  const router = useRouter();
  return async function logout() {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message || "Logout করা যায়নি, আবার চেষ্টা করো");
      return;
    }
    after?.();
    router.push("/login?flash=logout");
    router.refresh();
  };
}

function NavLinkItem({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

// usePathname শুধু এই কম্পোনেন্টে, তাই এটাকে Suspense দিয়ে মুড়ে ব্যবহার করতে হয়
function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((l) => (
        <NavLinkItem
          key={l.href}
          {...l}
          active={pathname === l.href || pathname.startsWith(`${l.href}/`)}
          onClick={onClick}
        />
      ))}
    </>
  );
}

// লোড হওয়ার আগের মুহূর্তে (active রং ছাড়া)
function StaticNavLinks({ onClick }: { onClick?: () => void }) {
  return (
    <>
      {LINKS.map((l) => (
        <NavLinkItem key={l.href} {...l} active={false} onClick={onClick} />
      ))}
    </>
  );
}

function CountBadge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}

function IconLinkButton({
  href,
  label,
  count,
  children,
}: {
  href: string;
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
      <CountBadge n={count ?? 0} />
    </Link>
  );
}

function WalletChip({ user }: { user: NavUser }) {
  return (
    <Link
      href="/dashboard?tab=wallet"
      className="hidden items-center gap-3 rounded-full border bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition hover:border-indigo-300 lg:flex"
    >
      <span className="flex items-center gap-1 text-amber-700" title="Connect">
        <IconZap className="h-4 w-4" /> {user.connects}
      </span>
      <span className="h-4 w-px bg-slate-200" />
      <span className="flex items-center gap-1 text-slate-600" title="Silver post">
        <IconMedal className="h-4 w-4" /> {user.silver}
      </span>
    </Link>
  );
}

function UserMenu({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const logout = useLogout(() => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full p-0.5 transition hover:ring-2 hover:ring-indigo-200"
      >
        <Avatar name={user.name} size="h-9 w-9" text="text-sm" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border bg-white p-1.5 shadow-xl"
        >
          <div className="flex items-center gap-3 border-b px-3 py-3">
            <Avatar name={user.name} size="h-10 w-10" text="text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <div className="py-1.5">
            {menuItems(user).map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <Icon className="h-4 w-4 text-slate-500" /> {m.label}
                </Link>
              );
            })}
          </div>
          <div className="border-t pt-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <IconLogout className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NavClient({
  user,
  loading = false,
}: {
  user: NavUser | null;
  loading?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);
  const logout = useLogout(close);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <Container className="flex h-[4.5rem] items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            <Suspense fallback={<StaticNavLinks />}>
              <NavLinks />
            </Suspense>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {!loading && user && (
            <>
              <IconLinkButton href="/notifications" label="Notification" count={user.notif}>
                <IconBell className="h-[18px] w-[18px]" />
              </IconLinkButton>
              <span className="hidden md:block">
                <IconLinkButton href="/dashboard?tab=messages" label="Message" count={user.chat}>
                  <IconChat className="h-[18px] w-[18px]" />
                </IconLinkButton>
              </span>
              <WalletChip user={user} />
              <Link
                href="/jobs/new"
                className="hidden items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 md:inline-flex"
              >
                <IconPlus className="h-4 w-4" /> Job post
              </Link>
            </>
          )}

          {!loading && !user && (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </div>
          )}

          <ThemeToggle />

          {!loading && user && (
            <span className="hidden md:block">
              <UserMenu user={user} />
            </span>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="মেনু"
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 md:hidden"
          >
            {mobileOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {/* মোবাইল মেনু */}
      {mobileOpen && (
        <div className="border-t bg-white md:hidden">
          <Container className="space-y-1 py-3">
            <Suspense fallback={<StaticNavLinks onClick={close} />}>
              <NavLinks onClick={close} />
            </Suspense>

            {user ? (
              <>
                <div className="my-2 flex items-center justify-between rounded-xl border bg-slate-50 px-3 py-2.5 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <Avatar name={user.name} /> {user.name}
                  </span>
                  <span className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-amber-700">
                      <IconZap className="h-3.5 w-3.5" /> {user.connects}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <IconMedal className="h-3.5 w-3.5" /> {user.silver}
                    </span>
                  </span>
                </div>
                {menuItems(user).map((m) => {
                  const Icon = m.icon;
                  return (
                    <Link
                      key={m.href}
                      href={m.href}
                      onClick={close}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <Icon className="h-4 w-4 text-slate-500" /> {m.label}
                      {m.label === "Messages" && user.chat > 0 && (
                        <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                          {user.chat}
                        </span>
                      )}
                    </Link>
                  );
                })}
                <Link
                  href="/jobs/new"
                  onClick={close}
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white"
                >
                  <IconPlus className="h-4 w-4" /> Job post করো
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <IconLogout className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={close}
                  className="flex-1 rounded-lg border px-3 py-2.5 text-center text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={close}
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2.5 text-center text-sm font-medium text-white"
                >
                  Sign up
                </Link>
              </div>
            )}
          </Container>
        </div>
      )}
    </header>
  );
}