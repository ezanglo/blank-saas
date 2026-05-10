"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createOrgSamlConnectionAction,
  deleteOrgSamlConnectionAction,
} from "@/lib/actions/sso";

export type OrgSsoSummary =
  | { connected: false }
  | {
      connected: true;
      providerId: string;
      issuer: string | null;
      domain: string | null;
      spMetadataUrl: string;
      acsUrl: string;
      callbackUrl: string;
    };

export function OrgSsoPanel(props: {
  orgId: string;
  orgSlug: string;
  summary: OrgSsoSummary;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"xml" | "url">("xml");
  const [domain, setDomain] = useState("");
  const [metadataXml, setMetadataXml] = useState("");
  const [metadataUrl, setMetadataUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function connect() {
    setBusy(true);
    try {
      await createOrgSamlConnectionAction({
        organizationId: props.orgId,
        orgSlug: props.orgSlug,
        domain,
        metadataXml: mode === "xml" ? metadataXml : undefined,
        metadataUrl: mode === "url" ? metadataUrl : undefined,
      });
      toast.success("SAML connection saved");
      router.refresh();
      setMetadataXml("");
      setMetadataUrl("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save SAML settings");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await deleteOrgSamlConnectionAction({
        organizationId: props.orgId,
        orgSlug: props.orgSlug,
      });
      toast.success("SAML connection removed");
      setConfirmOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove SAML connection");
    } finally {
      setBusy(false);
    }
  }

  async function testSso() {
    if (!props.summary.connected) return;
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const callbackURL = `${origin}/dashboard`;
    try {
      const res = await fetch(`${origin}/api/auth/sign-in/sso`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: props.summary.providerId,
          callbackURL,
          providerType: "saml",
        }),
      });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.message ?? "SSO sign-in failed");
      }
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
        return;
      }
      throw new Error("No redirect URL returned");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start SSO test");
    }
  }

  if (props.summary.connected) {
    const s = props.summary;
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Connected IdP</CardTitle>
            <CardDescription>
              Users with email @{s.domain ?? "your-domain"} can sign in through your IdP.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Issuer</span>
              <p className="font-mono wrap-break-word">{s.issuer ?? "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email domain</span>
              <p className="font-mono">{s.domain ?? "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">SP metadata URL</span>
              <p className="font-mono wrap-break-word">{s.spMetadataUrl}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Assertion Consumer Service (ACS)</span>
              <p className="font-mono wrap-break-word">{s.acsUrl}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => void testSso()}>
                Test SSO login
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
              >
                Delete connection
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent showCloseButton>
            <DialogHeader>
              <DialogTitle>Delete SAML connection?</DialogTitle>
              <DialogDescription>
                SSO users in this domain will need another sign-in method until you reconnect an IdP.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" disabled={busy} onClick={() => void disconnect()}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect IdP</CardTitle>
        <CardDescription>
          Connect one SAML identity provider. Provide the email domain for SSO (e.g. acme.com) and
          IdP federation metadata.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sso-domain">SSO email domain</Label>
            <Input
              id="sso-domain"
              placeholder="acme.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value.trim().toLowerCase())}
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "xml" ? "default" : "outline"}
              onClick={() => setMode("xml")}
            >
              Paste metadata XML
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "url" ? "default" : "outline"}
              onClick={() => setMode("url")}
            >
              Metadata URL
            </Button>
          </div>

          {mode === "xml" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="sso-xml">IdP metadata XML</Label>
              <Textarea
                id="sso-xml"
                className="min-h-40 font-mono text-xs"
                placeholder="<EntityDescriptor ..."
                value={metadataXml}
                onChange={(e) => setMetadataXml(e.target.value)}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="sso-metadata-url">Metadata URL</Label>
              <Input
                id="sso-metadata-url"
                placeholder="https://idp.example.com/app/xxx/sso/saml/metadata"
                value={metadataUrl}
                onChange={(e) => setMetadataUrl(e.target.value)}
              />
            </div>
          )}

          <Button type="button" disabled={busy || !domain} onClick={() => void connect()}>
            Connect IdP
          </Button>
        </CardContent>
      </Card>
    );
}
