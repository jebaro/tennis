import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { TennisGrid } from "../components/tennis-grid";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  
  // Check if user is logged in (but don't require it)
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = !!data?.claims;

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        {/* Navigation */}
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>TennisGrids</Link>
            </div>
            <div className="flex gap-2 items-center">
              {!hasEnvVars ? (
                <EnvVarWarning />
              ) : isLoggedIn ? (
                <div className="flex gap-4 items-center">
                  <Link href="/stats" className="text-muted-foreground hover:text-foreground transition-colors">
                    Stats
                  </Link>
                  <AuthButton />
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <Link 
                    href="/auth/login" 
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    Sign In
                  </Link>
                  <span className="text-muted-foreground">|</span>
                  <Link 
                    href="/auth/sign-up"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Main Game Content */}
        <div className="flex-1 w-full max-w-5xl p-5">
          <div className="flex flex-col gap-6 items-center">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">TennisGrids</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Find tennis players that match both row and column criteria
              </p>
              
              {/* Optional sign-up prompt for anonymous users - smaller and less intrusive */}
              {!isLoggedIn && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <Link href="/auth/sign-up" className="text-blue-600 hover:underline font-medium">
                    Sign up
                  </Link> to track your stats and compete on leaderboards
                </div>
              )}
            </div>
            
            {/* The Game Grid - Main Feature */}
            <TennisGrid isLoggedIn={isLoggedIn} />
            
            {/* Instructions - Compact and at bottom */}
            <div className="bg-muted/30 rounded-lg p-4 max-w-2xl text-center">
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Click cells to enter players • Each player used once • Complete all 9 cells to win</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
          <p className="text-muted-foreground">
            Daily tennis trivia for tennis enthusiasts
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}