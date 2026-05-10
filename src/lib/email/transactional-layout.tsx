import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

const fontStack =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';

const pageStyle: CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily: fontStack,
  margin: 0,
  padding: "28px 12px",
};

const cardStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e4e4e7",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "480px",
  padding: "28px 24px 24px",
};

const brandStyle: CSSProperties = {
  color: "#0a0a0a",
  fontSize: "15px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: 1.3,
  margin: "0 0 20px",
};

const hrStyle: CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "24px 0",
};

const footerStyle: CSSProperties = {
  color: "#525252",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: 0,
};

/** Body copy — dark text on white card (readable in Gmail/Apple Mail). */
export const emailText: CSSProperties = {
  color: "#171717",
  fontSize: "14px",
  lineHeight: "1.55",
  margin: "0 0 12px",
};

/** Secondary line (still ≥ 4.5:1 on white). */
export const emailMutedText: CSSProperties = {
  ...emailText,
  color: "#525252",
};

export const emailHeading: CSSProperties = {
  color: "#0a0a0a",
  fontSize: "20px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: 1.3,
  margin: "0 0 12px",
};

export function emailPrimaryButtonStyle(): CSSProperties {
  return {
    backgroundColor: "#0a0a0a",
    borderRadius: "8px",
    color: "#fafafa",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1,
    padding: "12px 22px",
    textDecoration: "none",
  };
}

type TransactionalEmailLayoutProps = {
  children: ReactNode;
  /** Shown in inbox preview / React Email dev preview. */
  previewText?: string;
};

/**
 * Shared shell: white card on light gray, brand line, HR, muted footer.
 * Forks should replace the brand label and footer copy here once product naming is final.
 */
export function TransactionalEmailLayout({
  children,
  previewText,
}: TransactionalEmailLayoutProps) {
  return (
    <Html>
      <Head />
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body style={pageStyle}>
        <Container style={cardStyle}>
          <Text style={brandStyle}>Blank SaaS</Text>
          {children}
          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            Transactional message from Blank SaaS. If you did not expect this email, you can ignore
            it. Update branding in{" "}
            <span style={{ wordBreak: "break-all" }}>src/lib/email/transactional-layout.tsx</span>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailPrimaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button href={href} style={{ ...emailPrimaryButtonStyle(), marginTop: "4px" }}>
      {children}
    </Button>
  );
}
