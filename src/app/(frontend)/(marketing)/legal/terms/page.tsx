import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Placeholder terms of service for Blank SaaS marketing site.",
  openGraph: {
    title: "Terms — Blank SaaS",
    description: "Placeholder terms of service for Blank SaaS marketing site.",
  },
};

export default function TermsPage() {
  return (
    <main className="px-6 py-12 md:py-16">
      <article className="mx-auto max-w-3xl space-y-6 text-foreground">
        <h1 className="text-4xl font-semibold tracking-tight">Terms of service</h1>
        <p className="text-muted-foreground">
          This is placeholder legal copy. Replace with counsel-reviewed text
          before production.
        </p>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Acceptance</h2>
          <p className="text-muted-foreground">
            Describe how users accept these terms, eligibility, and account
            responsibilities.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Subscriptions and fees</h2>
          <p className="text-muted-foreground">
            Outline billing cycles, trials, taxes, refunds, and how changes to
            pricing are communicated.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Limitation of liability</h2>
          <p className="text-muted-foreground">
            Add jurisdiction-appropriate limitation and disclaimer language.
          </p>
        </section>
      </article>
    </main>
  );
}
