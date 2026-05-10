import type { Metadata } from "next";
import Link from "next/link";

import { MotionSection } from "@/components/marketing/motion-section";
import { getMarketingPriceDisplays } from "@/lib/billing/marketing-prices";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Plan limits for API usage, members, storage, and webhooks—aligned with starter quota configuration.",
  openGraph: {
    title: "Pricing — Blank SaaS",
    description:
      "Plan limits for API usage, members, storage, and webhooks—aligned with starter quota configuration.",
  },
};

function fmt(n: number) {
  if (n === Number.POSITIVE_INFINITY) return "Unlimited";
  return n.toLocaleString();
}

const rows: { label: string; keys: (keyof typeof PLANS)[] }[] = [
  { label: "API calls / month", keys: ["free", "pro", "enterprise"] },
  { label: "Members / org", keys: ["free", "pro", "enterprise"] },
  { label: "Storage (GB)", keys: ["free", "pro", "enterprise"] },
  { label: "Webhook endpoints", keys: ["free", "pro", "enterprise"] },
];

function cellValue(rowLabel: string, plan: keyof typeof PLANS) {
  const p = PLANS[plan];
  if (rowLabel === "API calls / month") return fmt(p.apiCallsPerMonth);
  if (rowLabel === "Members / org") return fmt(p.membersPerOrg);
  if (rowLabel === "Storage (GB)") return fmt(p.storageGb);
  return fmt(p.webhookEndpoints);
}

export default async function PricingPage() {
  const stripePrices = await getMarketingPriceDisplays();
  const tiers = [
    {
      key: "free" as const,
      name: "Free",
      price: "$0",
      priceNote: null as string | null,
      description: "Explore and prototype.",
      highlight: false,
    },
    {
      key: "pro" as const,
      name: "Pro",
      price: stripePrices.proMonthly,
      priceNote: `or ${stripePrices.proYearly}`,
      description: "For production workloads.",
      highlight: true,
    },
    {
      key: "enterprise" as const,
      name: "Enterprise",
      price: stripePrices.enterpriseMonthly,
      priceNote: null as string | null,
      description: "Talk to us for scale.",
      highlight: false,
    },
  ];

  return (
    <main className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-semibold tracking-tight">Pricing</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Paid tiers use the same Stripe Price objects as checkout. Limits mirror{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">PLANS</code> in code.
        </p>

        <MotionSection className="mt-12">
          <div className="grid gap-6 lg:grid-cols-3">
            {tiers.map((t) => (
              <Card
                key={t.key}
                className={cn(
                  "flex flex-col",
                  t.highlight && "border-primary ring-2 ring-primary",
                )}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>{t.name}</CardTitle>
                    {t.highlight ? <Badge>Popular</Badge> : null}
                  </div>
                  <CardDescription>{t.description}</CardDescription>
                  <p className="pt-2 text-2xl font-semibold">{t.price}</p>
                  {t.priceNote ? (
                    <p className="text-muted-foreground text-sm font-medium">{t.priceNote}</p>
                  ) : null}
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                  <p>API / mo: {fmt(PLANS[t.key].apiCallsPerMonth)}</p>
                  <p>Members: {fmt(PLANS[t.key].membersPerOrg)}</p>
                  <p>Storage: {fmt(PLANS[t.key].storageGb)} GB</p>
                  <p>Webhooks: {fmt(PLANS[t.key].webhookEndpoints)}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant={t.key === "pro" ? "default" : "outline"} asChild>
                    <Link href="/sign-up">Get started</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </MotionSection>

        <MotionSection className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            Compare limits
          </h2>
          <div className="mt-6 overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Feature</TableHead>
                  <TableHead>Free</TableHead>
                  <TableHead>Pro</TableHead>
                  <TableHead>Enterprise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    {row.keys.map((k) => (
                      <TableCell key={k}>{cellValue(row.label, k)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </MotionSection>
      </div>
    </main>
  );
}
