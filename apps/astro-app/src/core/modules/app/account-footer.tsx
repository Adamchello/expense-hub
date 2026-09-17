"use client";

import { LogOut } from "lucide-react";
import { useSignOut } from "@/shared/auth/mutations";
import { UserAvatar } from "@/shared/user/user-avatar";

/**
 * Who is signed in and the way out. Lives at the foot of the navigation so the
 * session-ending control is the last thing in tab order, not the first.
 */
export function AccountFooter({ email }: { email: string | undefined }) {
  const signOut = useSignOut();

  return (
    <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-2.5">
      <UserAvatar email={email} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-sidebar-foreground">
          {email}
        </p>
        <button
          type="button"
          onClick={() => signOut.mutate()}
          disabled={signOut.isPending}
          className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
        >
          <LogOut className="size-3" />
          {signOut.isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
