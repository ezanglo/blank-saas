"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { acceptInvitationAction, rejectInvitationAction } from "@/lib/actions/invitations";
import { authApiUrl } from "@/lib/auth/app-url";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";

type InvitationPreview = {
  id: string;
  email: string;
  role: string;
  organizationName: string;
  organizationSlug: string;
  status: string;
  expiresAt: string;
};

export function InviteAcceptClient({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [inv, setInv] = useState<InvitationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const url = `${authApiUrl("/organization/get-invitation")}?id=${encodeURIComponent(invitationId)}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("Could not load invitation");
        const data = (await res.json()) as InvitationPreview;
        if (!canceled) setInv(data);
      } catch (e) {
        if (!canceled) setError(e instanceof Error ? e.message : "Failed to load invitation");
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    void run();
    return () => {
      canceled = true;
    };
  }, [invitationId]);

  async function afterAcceptNavigate(orgSlug?: string | null, orgId?: string | null) {
    await queryClient.invalidateQueries({ queryKey: queryKeys.session });
    await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
    await queryClient.invalidateQueries({ queryKey: ["members"] });
    await queryClient.invalidateQueries({ queryKey: ["invitations"] });

    if (orgSlug) {
      router.push(`/organizations/${orgSlug}`);
      router.refresh();
      return;
    }

    if (orgId) {
      const url = authApiUrl("/organization/list");
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const orgs = (await res.json()) as { id: string; slug: string }[];
        const found = orgs.find((o) => o.id === orgId)?.slug;
        if (found) {
          router.push(`/organizations/${found}`);
          router.refresh();
          return;
        }
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function accept() {
    setSubmitting(true);
    try {
      const res = await acceptInvitationAction(invitationId);
      const body = res as unknown as {
        invitation?: { organizationId?: string; organizationSlug?: string };
        member?: { organizationId?: string };
      };
      const orgId = body.member?.organizationId ?? body.invitation?.organizationId ?? null;
      const slugFromInvitation = body.invitation?.organizationSlug;
      const orgSlug = slugFromInvitation ?? inv?.organizationSlug ?? null;

      toast.success("You joined the organization");
      await afterAcceptNavigate(orgSlug, orgId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not accept invitation");
    } finally {
      setSubmitting(false);
    }
  }

  async function reject() {
    setSubmitting(true);
    try {
      await rejectInvitationAction(invitationId);
      toast.success("Invitation declined");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not decline");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Loading invitation…</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error || !inv) {
    return (
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Invitation unavailable</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {error ?? "Check that you signed in with the invited email."}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle>You&apos;re invited</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p>
          Join <strong>{inv.organizationName}</strong> as{" "}
          <span className="capitalize">{inv.role}</span>.
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button disabled={submitting} onClick={() => void accept()}>
          Accept
        </Button>
        <Button variant="outline" disabled={submitting} onClick={() => void reject()}>
          Decline
        </Button>
      </CardFooter>
    </Card>
  );
}
