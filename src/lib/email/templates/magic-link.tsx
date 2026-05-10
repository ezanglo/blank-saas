import { Heading, Text } from "@react-email/components";

import {
  EmailPrimaryButton,
  emailText,
  TransactionalEmailLayout,
} from "@/lib/email/transactional-layout";

export type MagicLinkEmailProps = { signInUrl: string };

export default function MagicLinkEmail({ signInUrl }: MagicLinkEmailProps) {
  return (
    <TransactionalEmailLayout previewText="Your Blank SaaS sign-in link">
      <Heading as="h1" style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 12px" }}>
        Your sign-in link
      </Heading>
      <Text style={{ ...emailText, marginBottom: "16px" }}>
        Click below to sign in. This link expires soon.
      </Text>
      <EmailPrimaryButton href={signInUrl}>Sign in</EmailPrimaryButton>
    </TransactionalEmailLayout>
  );
}
