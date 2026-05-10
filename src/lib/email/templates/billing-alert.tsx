import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Text,
} from "@react-email/components";

export type BillingAlertKind = "payment_failed" | "subscription_cancelled" | "trial_ending";

export type BillingAlertEmailProps = {
  orgName: string;
  event: BillingAlertKind;
  daysRemaining?: number;
  portalUrl: string;
};

const titles: Record<BillingAlertKind, string> = {
  payment_failed: "Payment failed for your subscription",
  subscription_cancelled: "Your subscription has ended",
  trial_ending: "Your trial is ending soon",
};

export default function BillingAlertEmail({
  orgName,
  event,
  daysRemaining,
  portalUrl,
}: BillingAlertEmailProps) {
  const headline = titles[event];
  let detail: string | undefined;
  if (event === "trial_ending" && daysRemaining !== undefined) {
    detail = `Your trial ends in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}.`;
  } else if (event === "payment_failed") {
    detail =
      "We could not charge your default payment method. Update billing details to avoid losing access.";
  } else if (event === "subscription_cancelled") {
    detail = "Your workspace has been moved to the free plan. You can resubscribe anytime.";
  }

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
          <Button
            href={portalUrl}
            style={{
              display: "inline-block",
              marginTop: "16px",
              padding: "12px 20px",
              backgroundColor: "#111",
              color: "#fff",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            Manage billing
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
