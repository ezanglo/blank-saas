import { MotionSection } from "@/components/marketing/motion-section";
import { Card, CardContent } from "@/components/ui/card";

const quotes = [
  {
    quote:
      "We replaced three half-finished internal templates with this starter and shipped in weeks.",
    name: "Alex Rivera",
    role: "CTO, Acme Analytics",
  },
  {
    quote:
      "Org switching and quotas were the two things we always underestimated. Here they are day one.",
    name: "Jordan Lee",
    role: "Founder, Northwind Labs",
  },
  {
    quote:
      "The Payload + better-auth wiring saved us from another bespoke auth migration.",
    name: "Sam Patel",
    role: "Engineering Lead, Globex",
  },
] as const;

export function HomeTestimonials() {
  return (
    <MotionSection className="bg-muted/30 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          Teams shipping faster
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {quotes.map((q) => (
            <Card key={q.name}>
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed">&ldquo;{q.quote}&rdquo;</p>
                <p className="mt-4 text-sm font-medium">{q.name}</p>
                <p className="text-xs text-muted-foreground">{q.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
