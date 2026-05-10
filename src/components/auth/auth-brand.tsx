import Link from "next/link";
import { GalleryVerticalEnd } from "lucide-react";

import { cn } from "@/lib/utils";

/** Aligns with shadcn login-03 brand row. */
export function AuthBrand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 self-center font-medium", className)}
    >
      <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <GalleryVerticalEnd className="size-4" />
      </div>
      Blank SaaS
    </Link>
  );
}
