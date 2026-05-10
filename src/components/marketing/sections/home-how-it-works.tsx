import { MotionSection } from "@/components/marketing/motion-section";

const steps = [
  { n: "1", title: "Clone & configure", body: "Copy env from .env.example and run Postgres (Docker or hosted)." },
  { n: "2", title: "Sign up locally", body: "Create a user—the starter promotes the first account so you can explore the app." },
  { n: "3", title: "Iterate on your product", body: "Orgs, invites, and quotas are wired; replace branding and extend collections as you go." },
] as const;

export function HomeHowItWorks() {
  return (
    <MotionSection className="bg-muted/25 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          Quickstart
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
          Same flow as the README—three steps from clone to a running app.
        </p>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((s) => (
            <li key={s.n} className="flex flex-col items-center text-center">
              <span className="flex size-12 items-center justify-center rounded-full border-2 border-primary text-base font-bold tracking-tight text-primary">
                {s.n}
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </MotionSection>
  );
}
