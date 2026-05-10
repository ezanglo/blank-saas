import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Text,
} from "@react-email/components";

export type ResetPasswordEmailProps = { name: string; resetUrl: string };

export default function ResetPasswordEmail({ name, resetUrl }: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "sans-serif" }}>
        <Container style={{ margin: "0 auto", padding: "24px", maxWidth: "480px" }}>
          <Heading style={{ fontSize: "20px" }}>Reset your password</Heading>
          <Text style={{ fontSize: "14px", lineHeight: "1.5" }}>Hi {name},</Text>
          <Text style={{ fontSize: "14px", lineHeight: "1.5" }}>
            We received a request to reset your password. Click the button below to choose a new
            one.
          </Text>
          <Button
            href={resetUrl}
            style={{
              display: "inline-block",
              padding: "12px 20px",
              backgroundColor: "#111",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            Reset password
          </Button>
          <Text style={{ fontSize: "12px", color: "#666", marginTop: "24px" }}>
            If you did not request this, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
