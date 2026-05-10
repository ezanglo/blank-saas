import { Body, Button, Container, Head, Heading, Html, Text } from "@react-email/components";

export type VerifyEmailProps = { verifyUrl: string };

export default function VerifyEmail({ verifyUrl }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "sans-serif" }}>
        <Container style={{ margin: "0 auto", padding: "24px", maxWidth: "480px" }}>
          <Heading style={{ fontSize: "20px" }}>Verify your email</Heading>
          <Text style={{ fontSize: "14px", lineHeight: "1.5" }}>
            Confirm your email address to finish setting up your account.
          </Text>
          <Button
            href={verifyUrl}
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
            Verify email
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
