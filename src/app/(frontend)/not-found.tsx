import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function FrontendNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        The page you requested doesn&apos;t exist or was moved.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
