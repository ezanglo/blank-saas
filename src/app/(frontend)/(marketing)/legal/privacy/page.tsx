import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Placeholder privacy policy for Blank SaaS marketing site.",
  openGraph: {
    title: "Privacy — Blank SaaS",
    description: "Placeholder privacy policy for Blank SaaS marketing site.",
  },
};

export default function PrivacyPage() {
  return (
    <main className="px-6 py-12 md:py-16">
      <article className="mx-auto max-w-3xl space-y-6 text-foreground">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy policy</h1>
        <p className="text-muted-foreground">
          This is placeholder legal copy. Replace with counsel-reviewed text
          before production.
        </p>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Data we collect</h2>
          <p className="text-muted-foreground">
            Describe categories of personal data, purposes, retention, and lawful
            bases for your product and regions you serve.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Cookies and analytics</h2>
          <p className="text-muted-foreground">
            Document cookie use, third-party analytics (e.g. PostHog), and
            opt-out mechanisms where required.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-muted-foreground">
            Add a privacy contact or DPA routing email for your company.
          </p>
        </section>
      </article>
    </main>
  );
}
