import type { ComponentProps } from "react";

export const MDX_COMPONENTS = {
  h1: (props: ComponentProps<"h1">) => (
    <h1
      className="mt-10 scroll-m-20 text-3xl font-bold tracking-tight first:mt-0"
      {...props}
    />
  ),
  h2: (props: ComponentProps<"h2">) => (
    <h2
      className="mt-10 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0"
      {...props}
    />
  ),
  h3: (props: ComponentProps<"h3">) => (
    <h3 className="mt-8 scroll-m-20 text-xl font-semibold tracking-tight" {...props} />
  ),
  p: (props: ComponentProps<"p">) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />
  ),
  a: (props: ComponentProps<"a">) => (
    <a
      className="font-medium text-primary underline underline-offset-4"
      {...props}
    />
  ),
  code: (props: ComponentProps<"code">) => (
    <code
      className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm"
      {...props}
    />
  ),
  pre: (props: ComponentProps<"pre">) => (
    <pre
      className="mb-4 mt-6 overflow-x-auto rounded-lg border bg-muted p-4 font-mono text-sm"
      {...props}
    />
  ),
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote className="mt-6 border-l-2 pl-6 italic text-muted-foreground" {...props} />
  ),
};
