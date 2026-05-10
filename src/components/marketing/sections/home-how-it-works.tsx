import { MotionSection } from "@/components/marketing/motion-section";

const steps = [
  { n: "1", title: "Create your workspace", body: "Sign up and spin up an organization in minutes." },
  { n: "2", title: "Invite your team", body: "Roles and invitations keep access understandable." },
  { n: "3", title: "Ship with confidence", body: "Quotas and audit-friendly patterns scale with you." },
] as const;

export function HomeHowItWorks() {
  return (
    <MotionSection className="bg-muted/30 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          How it works
        </h2>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="flex flex-col items-center text-center">
              <span className="flex size-10 items-center justify-center rounded-full border-2 border-primary text-sm font-semibold">
                {s.n}
              </span>
              <h3 className="mt-4 font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </MotionSection>
  );
}
