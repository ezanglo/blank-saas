import { Heading, Text } from "@react-email/components";

import {
  EmailPrimaryButton,
  emailText,
  TransactionalEmailLayout,
} from "@/lib/email/transactional-layout";

export type VerifyEmailProps = { verifyUrl: string };

export default function VerifyEmail({ verifyUrl }: VerifyEmailProps) {
  return (
    <TransactionalEmailLayout previewText="Verify your email for Blank SaaS">
      <Heading as="h1" style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 12px" }}>
        Verify your email
      </Heading>
      <Text style={{ ...emailText, marginBottom: "16px" }}>
        Confirm your email address to finish setting up your account.
      </Text>
      <EmailPrimaryButton href={verifyUrl}>Verify email</EmailPrimaryButton>
    </TransactionalEmailLayout>
  );
}
