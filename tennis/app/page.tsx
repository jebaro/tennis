import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>TennisGrids</Link>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </nav>
        
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <div className="flex flex-col gap-16 items-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-center">
              TennisGrids
            </h1>
            <p className="text-xl lg:text-2xl text-center text-muted-foreground max-w-2xl">
              Daily tennis trivia grid game. Find players that match dual criteria and challenge your tennis knowledge.
            </p>
            
            <div className="flex gap-4">
              <Link 
                href="/game" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-md font-medium transition-colors"
              >
                Play Today's Grid
              </Link>
              {!hasEnvVars && (
                <p className="text-sm text-muted-foreground self-center">
                  Setup Supabase to enable the game
                </p>
              )}
            </div>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p className="text-muted-foreground">
            Daily tennis trivia for tennis enthusiasts
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}