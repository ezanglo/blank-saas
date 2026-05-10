import { InviteAcceptClient } from "../invite-accept-client";

type Props = { params: Promise<{ invitationId: string }> };

export default async function InvitePage({ params }: Props) {
  const { invitationId } = await params;
  return <InviteAcceptClient invitationId={invitationId} />;
}
