import { UserRound } from "lucide-react";
import { cn } from "@/libs/ui/utils";
import { avatarInitial } from "./user-display";

interface UserAvatarProps {
  email: string | undefined;
  className?: string;
}

/**
 * The signed-in person's initial in the brand circle. When the email offers no
 * readable letter, a neutral person glyph stands in — never "?", which reads
 * as an error.
 */
export function UserAvatar({ email, className }: UserAvatarProps) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground",
        className,
      )}
    >
      {avatarInitial(email) ?? <UserRound className="size-4" aria-hidden />}
    </span>
  );
}
