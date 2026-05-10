import { MotionSection } from "@/components/marketing/motion-section";

function PlaceholderLogo({ name }: { name: string }) {
  return (
    <div className="flex h-10 items-center justify-center rounded-md border bg-card px-4 text-xs font-medium text-muted-foreground">
      {name}
    </div>
  );
}

export function HomeLogoBar() {
  return (
    <MotionSection className="border-y bg-muted/20 px-6 py-10">
      <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Trusted by teams at
      </p>
      <div className="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-5">
        <PlaceholderLogo name="Acme" />
        <PlaceholderLogo name="Northwind" />
        <PlaceholderLogo name="Globex" />
        <PlaceholderLogo name="Umbrella" />
        <PlaceholderLogo name="Stark" />
      </div>
    </MotionSection>
  );
}
