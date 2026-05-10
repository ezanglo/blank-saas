import { Heading, Text } from "@react-email/components";

import {
  EmailPrimaryButton,
  emailText,
  TransactionalEmailLayout,
} from "@/lib/email/transactional-layout";

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
    <TransactionalEmailLayout previewText={headline}>
      <Heading as="h1" style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 12px" }}>
        {headline}
      </Heading>
      <Text style={emailText}>Organization: {orgName}</Text>
      {detail ? <Text style={{ ...emailText, color: "#404040" }}>{detail}</Text> : null}
      <EmailPrimaryButton href={portalUrl}>Manage billing</EmailPrimaryButton>
    </TransactionalEmailLayout>
  );
}
