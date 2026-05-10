import { redirect } from "next/navigation";

type Props = { params: Promise<{ orgSlug: string }> };

export default async function OrganizationInvitationsLegacyRedirect({ params }: Props) {
  const { orgSlug } = await params;
  redirect(`/organizations/${orgSlug}/team?tab=invites`);
}
