import { Body, Container, Head, Heading, Html, Text } from "@react-email/components";

/** Stub for Stripe billing webhooks (Phase 7). Props will align with invoice/payment events. */
export type BillingAlertEmailProps = {
  orgName: string;
  headline: string;
  detail?: string;
};

export default function BillingAlertEmail({ orgName, headline, detail }: BillingAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "sans-serif" }}>
        <Container style={{ margin: "0 auto", padding: "24px", maxWidth: "480px" }}>
          <Heading style={{ fontSize: "20px" }}>{headline}</Heading>
          <Text style={{ fontSize: "14px", lineHeight: "1.5" }}>Organization: {orgName}</Text>
          {detail ? (
            <Text style={{ fontSize: "14px", lineHeight: "1.5", color: "#444" }}>{detail}</Text>
          ) : null}
        </Container>
      </Body>
    </Html>
  );
}
