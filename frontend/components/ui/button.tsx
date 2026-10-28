import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const variants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white hover:opacity-90 dark:text-[#21171a]",
        secondary: "border bg-surface text-ink hover:bg-canvas",
        ghost: "text-muted hover:bg-canvas hover:text-ink",
        danger: "bg-brick text-ink hover:opacity-80",
      },
      size: { sm: "h-9 px-3", md: "h-10 px-4", lg: "h-12 px-5", icon: "size-10" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variants> {
  asChild?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(variants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
