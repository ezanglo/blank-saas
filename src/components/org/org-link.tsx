"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";

import { setActiveOrganizationAction } from "@/lib/actions/organization";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";

export function useNavigateToOrganization() {
  const queryClient = useQueryClient();

  return async (org: { id: string; slug: string }) => {
    await setActiveOrganizationAction({ organizationId: org.id });
    await queryClient.invalidateQueries({ queryKey: queryKeys.session });
    await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
  };
}

export function OrgLink({
  href,
  org,
  children,
  className,
}: {
  href: string;
  org: { id: string; slug: string };
  children: React.ReactNode;
  className?: string;
}) {
  const navigate = useNavigateToOrganization();
  const router = useRouter();

  async function activate(e?: React.MouseEvent) {
    e?.preventDefault();
    await navigate(org);
    router.push(href);
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        void activate(e);
      }}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void activate();
        }
      }}
    >
      {children}
    </Link>
  );
}
