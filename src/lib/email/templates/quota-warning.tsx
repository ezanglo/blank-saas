import { Heading, Link, Text } from "@react-email/components";

import { emailText, TransactionalEmailLayout } from "@/lib/email/transactional-layout";

export type QuotaWarningEmailProps = {
  orgName: string;
  resource: string;
  percentUsed: number;
  upgradeUrl: string;
};

const linkStyle = { color: "#0a0a0a", fontWeight: 600, textDecoration: "underline" };

export default function QuotaWarningEmail({
  orgName,
  resource,
  percentUsed,
  upgradeUrl,
}: QuotaWarningEmailProps) {
  return (
    <TransactionalEmailLayout previewText={`Usage alert for ${orgName}`}>
      <Heading as="h1" style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 12px" }}>
        Usage alert
      </Heading>
      <Text style={emailText}>
        <strong>{orgName}</strong> has used about {Math.round(percentUsed)}% of its{" "}
        <strong>{resource}</strong> allowance.
      </Text>
      <Text style={{ ...emailText, marginBottom: 0 }}>
        <Link href={upgradeUrl} style={linkStyle}>
          Review your plan
        </Link>{" "}
        to avoid interruptions.
      </Text>
    </TransactionalEmailLayout>
  );
}
