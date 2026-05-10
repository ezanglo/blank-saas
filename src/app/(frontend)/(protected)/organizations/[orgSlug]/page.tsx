import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOrganizationBySlug } from "@/lib/org/load-org";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ orgSlug: string }> };

export async function generateMetadata({ params }: Props) {
  const { orgSlug } = await params;
  const org = await getOrganizationBySlug(orgSlug);
  return {
    title: org ? `${org.name} · Overview` : "Organization",
  };
}

export default async function OrganizationOverviewPage({ params }: Props) {
  const { orgSlug } = await params;
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{org.name}</CardTitle>
          <CardDescription>Workspace slug and billing plan (Stripe in a later phase).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex flex-wrap gap-3">
            <span className="text-muted-foreground">Slug:</span>
            <code className="rounded-md bg-muted px-2 py-0.5 text-xs">{org.slug}</code>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Plan:</span>
            <Badge variant="secondary" className="capitalize">
              {org.plan}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
