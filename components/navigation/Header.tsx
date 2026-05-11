'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { RoleBasedNav } from './RoleBasedNav';
import { ConnectionStatus } from './ConnectionStatus';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { FontSwitcherDropdown, FontSwitcherMobile } from './FontSwitcherDropdown';

function MobileMenu({
  open,
  user,
  loading,
  roles,
  onSignOut,
  onSignIn,
  onSignUp,
  isAdmin,
  isTeacher,
  isStudent,
}: {
  open: boolean;
  user: { email?: string } | null;
  loading: boolean;
  roles: string[];
  onSignOut: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}) {
  if (!open) return null;
  return (
    <div className="md:hidden mt-3 pb-3 border-t border-primary/50 pt-3">
      {user && (
        <div className="mb-3">
          <RoleBasedNav user={user} isAdmin={isAdmin} isTeacher={isTeacher} isStudent={isStudent} />
        </div>
      )}
      <div className="flex sm:hidden flex-col gap-2 pt-3 border-t border-primary/50">
        <div className="px-2 mb-2 flex items-center justify-between">
          <span className="text-primary-foreground/90">Theme</span>
          <ModeToggle />
        </div>
        <FontSwitcherMobile />
        {loading ? (
          <div className="text-primary-foreground/80">Loading...</div>
        ) : user ? (
          <>
            <div className="flex flex-col py-2 px-2">
              <div className="text-sm font-medium text-primary-foreground/90 break-all">
                {user.email}
              </div>
              <RoleDisplay roles={roles} />
            </div>
            <button
              onClick={onSignOut}
              className="w-full text-left bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onSignIn}
              className="text-left text-primary-foreground/90 hover:text-primary-foreground font-medium transition-colors duration-200 px-4 py-2"
            >
              Sign In
            </button>
            <button
              onClick={onSignUp}
              className="w-full text-left bg-background hover:bg-muted text-primary font-medium px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </div>
  );
}
function RoleDisplay({ roles }: { roles: string[] }) {
  if (roles.length === 0) return null;
  return (
    <div className="flex gap-1 mt-1 flex-wrap">
      {roles.map((role) => (
        <span
          key={role}
          className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary-foreground font-medium"
        >
          {role}
        </span>
      ))}
    </div>
  );
}

function DesktopAuthControls({
  user,
  loading,
  roles,
  onSignOut,
  onSignIn,
  onSignUp,
}: {
  user: { email?: string } | null;
  loading: boolean;
  roles: string[];
  onSignOut: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  return (
    <div className="hidden sm:flex items-center gap-2 sm:gap-3 lg:gap-4">
      <FontSwitcherDropdown />
      <ModeToggle />
      {loading ? (
        <div className="text-primary-foreground/80 text-sm">Loading...</div>
      ) : user ? (
        <>
          <div className="hidden sm:flex flex-col items-end">
            <div className="text-xs sm:text-sm font-medium text-primary-foreground/90 truncate">
              {user.email}
            </div>
            <RoleDisplay roles={roles} />
          </div>
          <button
            onClick={onSignOut}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 text-sm whitespace-nowrap"
          >
            Sign Out
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onSignIn}
            className="text-primary-foreground/90 hover:text-primary-foreground font-medium transition-colors duration-200 text-sm whitespace-nowrap"
          >
            Sign In
          </button>
          <button
            onClick={onSignUp}
            className="bg-background hover:bg-muted text-primary font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 text-sm whitespace-nowrap"
          >
            Sign Up
          </button>
        </>
      )}
    </div>
  );
}

function MobileMenuButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden ml-4 p-2 text-primary-foreground hover:bg-primary/80 rounded-lg transition-colors duration-200"
      aria-label="Toggle menu"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {open ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        )}
      </svg>
    </button>
  );
}

async function signOutAndRedirect(
  router: ReturnType<typeof useRouter>,
  setMobileMenuOpen: (v: boolean) => void
) {
  const supabase = createClient();
  try {
    await supabase.auth.signOut();
  } catch {
    // Sign-out errors are non-critical — redirect proceeds regardless
  }
  router.push('/sign-in');
  setMobileMenuOpen(false);
}

export default function Header({
  user: initialUser,
  isAdmin: initialIsAdmin,
  isTeacher: initialIsTeacher,
  isStudent: initialIsStudent,
}: {
  user: { id?: string; email?: string } | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(initialUser);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [isTeacher, setIsTeacher] = useState(initialIsTeacher);
  const [isStudent, setIsStudent] = useState(initialIsStudent);

  // Sync Header state with auth events.
  //
  // Roles come from SSR props (resolved server-side via RLS-aware queries) and
  // are intentionally NOT refetched here — the prior implementation queried a
  // non-existent `user_roles` table and called router.refresh() on every
  // TOKEN_REFRESHED event (~hourly), causing periodic full-page refreshes.
  //
  // On SIGNED_IN/USER_UPDATED we update the local user object so the email
  // and signed-in UI render immediately; SSR re-hydration on the next
  // navigation keeps role flags consistent. On SIGNED_OUT we clear local
  // state and call router.refresh() so protected server components re-render
  // with the logged-out session.
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        setIsTeacher(false);
        setIsStudent(false);
        router.refresh();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  // Hide header on dashboard routes where Sidebar is used
  if (
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/student') ||
    pathname?.startsWith('/teacher')
  ) {
    return null;
  }

  if (['/sign-in', '/sign-up', '/forgot-password', '/reset-password'].includes(pathname)) {
    return null;
  }

  // Landing page has its own navbar with theme toggle
  if (pathname === '/') {
    return null;
  }

  const handleSignOut = () => signOutAndRedirect(router, setMobileMenuOpen);
  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  const roles = [];
  if (isAdmin) roles.push('Admin');
  if (isTeacher) roles.push('Teacher');
  if (isStudent) roles.push('Student');

  return (
    <header className="bg-linear-to-r from-primary to-primary/90 dark:from-primary/90 dark:to-primary/80 shadow-lg border-b border-primary/50">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
          <div className="flex items-center justify-between w-full md:w-auto">
            {/* Logo */}
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center gap-2 text-xl sm:text-2xl md:text-2xl font-bold text-primary-foreground hover:text-primary-foreground/80 transition-colors duration-200 truncate"
              style={{ minWidth: 0 }}
            >
              <span className="text-2xl sm:text-3xl">🎸</span>
              <span className="hidden sm:inline">Strummy</span>
              <span className="sm:hidden">CRM</span>
            </button>

            <ConnectionStatus />

            {/* Mobile Menu Button (only on mobile) */}
            <MobileMenuButton
              open={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-end w-full md:w-auto gap-3 md:gap-0">
            {/* Navigation - Desktop only */}
            {user && (
              <div className="hidden md:flex items-center mx-0 lg:mx-6">
                <RoleBasedNav
                  user={user}
                  isAdmin={isAdmin}
                  isTeacher={isTeacher}
                  isStudent={isStudent}
                />
              </div>
            )}

            {/* Desktop Auth Controls */}
            <DesktopAuthControls
              user={user}
              loading={false}
              roles={roles}
              onSignOut={handleSignOut}
              onSignIn={() => handleNavigation('/sign-in')}
              onSignUp={() => handleNavigation('/sign-up')}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        <MobileMenu
          open={mobileMenuOpen}
          user={user}
          loading={false}
          roles={roles}
          onSignOut={handleSignOut}
          onSignIn={() => handleNavigation('/sign-in')}
          onSignUp={() => handleNavigation('/sign-up')}
          isAdmin={isAdmin}
          isTeacher={isTeacher}
          isStudent={isStudent}
        />
      </div>
    </header>
  );
}
