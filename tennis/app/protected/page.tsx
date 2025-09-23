import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to TennisGrids!</h1>
        <p className="text-muted-foreground mb-8">
          Ready to test your tennis knowledge with today's grid challenge?
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link 
            href="/game" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium transition-colors"
          >
            Play Today's Grid
          </Link>
          <Link 
            href="/stats" 
            className="border border-input bg-background hover:bg-accent hover:text-accent-foreground px-6 py-3 rounded-md font-medium transition-colors"
          >
            View Stats
          </Link>
        </div>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-6">
        <h2 className="font-semibold mb-2">How to Play</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Find tennis players that match both the row and column criteria</li>
          <li>• Each cell requires a player who satisfies both conditions</li>
          <li>• Complete the 3x3 grid to finish today's challenge</li>
          <li>• New puzzle available daily!</li>
        </ul>
      </div>
    </div>
  );
}