import { Body, Container, Head, Heading, Html, Text } from "@react-email/components";

export type WelcomeEmailProps = { name: string };

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "sans-serif" }}>
        <Container style={{ margin: "0 auto", padding: "24px", maxWidth: "480px" }}>
          <Heading style={{ fontSize: "20px" }}>Welcome</Heading>
          <Text style={{ fontSize: "14px", lineHeight: "1.5" }}>Hi {name},</Text>
          <Text style={{ fontSize: "14px", lineHeight: "1.5" }}>
            Thanks for joining — your account is ready.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
