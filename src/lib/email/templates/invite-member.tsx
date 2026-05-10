import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Text,
} from "@react-email/components";

export type InviteMemberEmailProps = {
  inviterName: string;
  orgName: string;
  inviteUrl: string;
  expiresInHours: number;
};

export default function InviteMemberEmail({
  inviterName,
  orgName,
  inviteUrl,
  expiresInHours,
}: InviteMemberEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "sans-serif" }}>
        <Container style={{ margin: "0 auto", padding: "24px", maxWidth: "480px" }}>
          <Heading style={{ fontSize: "20px" }}>You&apos;re invited</Heading>
          <Text style={{ fontSize: "14px", lineHeight: "1.5" }}>
            {inviterName} invited you to join <strong>{orgName}</strong>.
          </Text>
          <Text style={{ fontSize: "14px", lineHeight: "1.5", color: "#666" }}>
            This invitation expires in {expiresInHours} hours.
          </Text>
          <Button
            href={inviteUrl}
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
            Accept invitation
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
