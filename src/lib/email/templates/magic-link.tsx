import { Body, Button, Container, Head, Heading, Html, Text } from "@react-email/components";

export type MagicLinkEmailProps = { signInUrl: string };

export default function MagicLinkEmail({ signInUrl }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "sans-serif" }}>
        <Container style={{ margin: "0 auto", padding: "24px", maxWidth: "480px" }}>
          <Heading style={{ fontSize: "20px" }}>Your sign-in link</Heading>
          <Text style={{ fontSize: "14px", lineHeight: "1.5" }}>
            Click below to sign in. This link expires soon.
          </Text>
          <Button
            href={signInUrl}
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
            Sign in
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
