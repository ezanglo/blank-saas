import type { Metadata } from "next";

import { ContactForm } from "@/components/marketing/contact-form";
import { PUBLIC_GITHUB_REPO_URL } from "@/lib/marketing/public-repo";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach out about Blank SaaS — or open a GitHub issue for bugs and ideas.",
  openGraph: {
    title: "Contact — Blank SaaS",
    description:
      "Reach out about Blank SaaS — or open a GitHub issue for bugs and ideas.",
  },
};

const githubIssuesUrl = `${PUBLIC_GITHUB_REPO_URL}/issues`;

export default function ContactPage() {
  return (
    <main className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-xl space-y-10">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight">Contact</h1>
          <p className="text-muted-foreground">
            Questions about running or extending this starter? Send a note below. We read everything,
            even if we can&apos;t reply to every message.
          </p>
        </div>
        <ContactForm githubIssuesUrl={githubIssuesUrl} />
      </div>
    </main>
  );
}
