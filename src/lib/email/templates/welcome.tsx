import { Heading, Text } from "@react-email/components";

import {
  emailText,
  TransactionalEmailLayout,
} from "@/lib/email/transactional-layout";

export type WelcomeEmailProps = { name: string };

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <TransactionalEmailLayout previewText={`Welcome, ${name}`}>
      <Heading as="h1" style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 12px" }}>
        Welcome
      </Heading>
      <Text style={emailText}>Hi {name},</Text>
      <Text style={{ ...emailText, marginBottom: 0 }}>
        Thanks for joining — your account is ready.
      </Text>
    </TransactionalEmailLayout>
  );
}
