import { Building2, Shield, Users } from "lucide-react";

import { MotionSection } from "@/components/marketing/motion-section";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const items = [
  {
    icon: Building2,
    title: "Organizations first",
    description:
      "Members, roles, and invitations with a clear path to granular permissions later.",
  },
  {
    icon: Users,
    title: "Built-in collaboration",
    description:
      "Switch org context, invite teammates, and keep product data scoped per tenant.",
  },
  {
    icon: Shield,
    title: "Operational guardrails",
    description:
      "Rate limits and quotas aligned with your plans so growth stays predictable.",
  },
] as const;

export function HomeFeatures() {
  return (
    <MotionSection id="features" className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          Everything you need to launch
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Opinionated defaults for multi-tenant SaaS—extend when you need more.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="mb-2 size-8 text-primary" aria-hidden />
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
