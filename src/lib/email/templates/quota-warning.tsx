import { Body, Container, Head, Heading, Html, Link, Text } from "@react-email/components";

export type QuotaWarningEmailProps = {
  orgName: string;
  resource: string;
  percentUsed: number;
  upgradeUrl: string;
};

export default function QuotaWarningEmail({
  orgName,
  resource,
  percentUsed,
  upgradeUrl,
}: QuotaWarningEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "sans-serif" }}>
        <Container style={{ margin: "0 auto", padding: "24px", maxWidth: "480px" }}>
          <Heading style={{ fontSize: "20px" }}>Usage alert</Heading>
          <Text style={{ fontSize: "14px", lineHeight: "1.5" }}>
            <strong>{orgName}</strong> has used about {Math.round(percentUsed)}% of its{" "}
            <strong>{resource}</strong> allowance.
          </Text>
          <Text style={{ fontSize: "14px", lineHeight: "1.5" }}>
            <Link href={upgradeUrl}>Review your plan</Link> to avoid interruptions.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
