import { Heading, Text } from "react-email";

import {
  EmailPrimaryButton,
  emailMutedText,
  emailText,
  TransactionalEmailLayout,
} from "@/lib/email/transactional-layout";

export type InviteMemberEmailProps = {
  inviterName: string;
  orgName: string;
  inviteUrl: string;
  expiresInHours: number;
};

export default function InviteMemberEmail({
  inviterName,
  orgName,
  inviteUrl,
  expiresInHours,
}: InviteMemberEmailProps) {
  return (
    <TransactionalEmailLayout
      previewText={`${inviterName} invited you to ${orgName} on Blank SaaS`}
    >
      <Heading as="h1" style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 12px" }}>
        You&apos;re invited
      </Heading>
      <Text style={emailText}>
        {inviterName} invited you to join <strong>{orgName}</strong>.
      </Text>
      <Text style={emailMutedText}>This invitation expires in {expiresInHours} hours.</Text>
      <EmailPrimaryButton href={inviteUrl}>Accept invitation</EmailPrimaryButton>
    </TransactionalEmailLayout>
  );
}
