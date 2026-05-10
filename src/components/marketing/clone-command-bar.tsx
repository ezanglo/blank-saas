"use client";

import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GIT_CLONE_COMMAND,
  PUBLIC_GITHUB_REPO_URL,
  publicGithubRepoLabel,
} from "@/lib/marketing/public-repo";

type Variant = "hero" | "inline";

export function CloneCommandBar({
  variant = "inline",
  showCaption = true,
}: {
  variant?: Variant;
  /** Show title + GitHub link (inline section only). */
  showCaption?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(GIT_CLONE_COMMAND);
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select the command and copy manually");
    }
  }

  const bar = (
    <>
      {variant === "hero" ? (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-4 text-zinc-50 shadow-xl sm:flex-row sm:items-center sm:gap-3 sm:py-3"
          aria-label="Git clone command"
        >
          <code className="min-w-0 flex-1 overflow-x-auto font-mono text-sm leading-relaxed sm:text-[0.9375rem]">
            {GIT_CLONE_COMMAND}
          </code>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="shrink-0 border-white/10 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="mr-2 size-4" aria-hidden />
            ) : (
              <Copy className="mr-2 size-4" aria-hidden />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <div
            className="flex min-h-11 flex-1 items-center overflow-x-auto rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm text-foreground"
            role="region"
            aria-label="Git clone command"
          >
            <span className="whitespace-nowrap">{GIT_CLONE_COMMAND}</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 sm:w-auto"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="mr-2 size-4" aria-hidden />
            ) : (
              <Copy className="mr-2 size-4" aria-hidden />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}
    </>
  );

  if (variant === "hero") {
    return (
      <div className={cn("w-full max-w-4xl")}>
        {bar}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Source:{" "}
          <Link
            href={PUBLIC_GITHUB_REPO_URL}
            className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
          >
            {publicGithubRepoLabel()}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      {showCaption ? (
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
          <div className="min-w-0 shrink-0 md:max-w-xs">
            <h2 className="text-lg font-semibold tracking-tight">Clone the repository</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Same remote as the marketing site—follow the README after clone.
            </p>
          </div>
          <div className="min-w-0 flex-1">{bar}</div>
        </div>
      ) : (
        bar
      )}
    </div>
  );
}
