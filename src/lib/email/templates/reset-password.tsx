import { Heading, Text } from "@react-email/components";

import {
  EmailPrimaryButton,
  emailMutedText,
  emailText,
  TransactionalEmailLayout,
} from "@/lib/email/transactional-layout";

export type ResetPasswordEmailProps = { name: string; resetUrl: string };

export default function ResetPasswordEmail({ name, resetUrl }: ResetPasswordEmailProps) {
  return (
    <TransactionalEmailLayout previewText="Reset your Blank SaaS password">
      <Heading as="h1" style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 12px" }}>
        Reset your password
      </Heading>
      <Text style={emailText}>Hi {name},</Text>
      <Text style={emailText}>
        We received a request to reset your password. Use the button below to choose a new one.
      </Text>
      <EmailPrimaryButton href={resetUrl}>Reset password</EmailPrimaryButton>
      <Text style={{ ...emailMutedText, marginTop: "20px", marginBottom: 0 }}>
        If you did not request this, you can ignore this email.
      </Text>
    </TransactionalEmailLayout>
  );
}
