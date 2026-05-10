import { MotionSection } from "@/components/marketing/motion-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is this production-ready?",
    a: "It is a strong foundation: you should still harden auth, observability, and compliance for your domain.",
  },
  {
    q: "Can I swap the database or email provider?",
    a: "Yes—the stack uses standard Postgres and SMTP-friendly email; adapt env and config to your providers.",
  },
  {
    q: "How does billing work?",
    a: "Marketing pricing is illustrative. Stripe and subscription state arrive in a dedicated billing phase.",
  },
] as const;

export function HomeFaq() {
  return (
    <MotionSection className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          FAQ
        </h2>
        <Accordion type="single" collapsible className="mt-10 w-full">
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
