import { MotionSection } from "@/components/marketing/motion-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is this meant for production?",
    a: "It’s a working foundation: you still own security review, compliance, and infra for your environment.",
  },
  {
    q: "Can I swap database or email?",
    a: "Yes—Postgres and SMTP are standard; change env and adapters to match your providers.",
  },
  {
    q: "What about Stripe and quotas on the /pricing page?",
    a: "Those numbers illustrate PLANS in code—they’re not a product you buy here. Wire your own Stripe prices when you ship billing.",
  },
] as const;

export function HomeFaq() {
  return (
    <MotionSection className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Practical answers for developers evaluating or forking the repo.
        </p>
        <Accordion type="single" collapsible className="mt-12 w-full">
          {faqs.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </MotionSection>
  );
}
