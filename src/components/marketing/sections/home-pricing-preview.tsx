"use client";

import Link from "next/link";
import { useState } from "react";

import { MotionSection } from "@/components/marketing/motion-section";
import { PLANS } from "@/lib/quota/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const tiers = [
  {
    key: "free" as const,
    name: "Free",
    description: "Try the stack and validate your flow.",
    monthly: 0,
    annual: 0,
  },
  {
    key: "pro" as const,
    name: "Pro",
    description: "For growing teams that need higher limits.",
    monthly: 29,
    annual: 290,
    highlighted: true,
  },
  {
    key: "enterprise" as const,
    name: "Enterprise",
    description: "Custom limits and support when you need it.",
    monthly: null,
    annual: null,
  },
];

function formatLimit(n: number) {
  if (n === Number.POSITIVE_INFINITY) return "Unlimited";
  return n.toLocaleString();
}

export function HomePricingPreview() {
  const [annual, setAnnual] = useState(false);

  return (
    <MotionSection id="pricing" className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Pricing</h2>
          <p className="max-w-xl text-muted-foreground">
            Display-only preview—billing connects in a later phase. Numbers
            reflect quota configuration in code.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Label htmlFor="billing-toggle" className="text-sm text-muted-foreground">
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={annual}
              onCheckedChange={setAnnual}
              aria-label="Toggle annual billing display"
            />
            <span className="text-sm text-muted-foreground">Annual</span>
          </div>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => {
            const limits = PLANS[tier.key];
            const price =
              tier.monthly === null
                ? "Custom"
                : annual
                  ? `$${tier.annual}/yr`
                  : `$${tier.monthly}/mo`;

            return (
              <Card
                key={tier.key}
                className={cn(
                  "flex flex-col",
                  tier.highlighted && "border-primary ring-2 ring-primary",
                )}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>{tier.name}</CardTitle>
                    {tier.highlighted ? <Badge>Popular</Badge> : null}
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                  <p className="pt-2 text-2xl font-semibold">{price}</p>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                  <p>API calls / month: {formatLimit(limits.apiCallsPerMonth)}</p>
                  <p>Members / org: {formatLimit(limits.membersPerOrg)}</p>
                  <p>Storage (GB): {formatLimit(limits.storageGb)}</p>
                  <p>Webhooks: {formatLimit(limits.webhookEndpoints)}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant={tier.highlighted ? "default" : "outline"} asChild>
                    <Link href="/sign-up">Get started</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </MotionSection>
  );
}
