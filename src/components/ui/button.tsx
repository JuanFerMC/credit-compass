import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-[background-color,color,transform] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-primary/90",
        secondary: "border border-border bg-surface text-foreground hover:bg-accent-soft",
        outline: "border border-border bg-surface text-foreground hover:bg-accent-soft",
        ghost: "text-muted-foreground hover:bg-accent-soft hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "size-10 px-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
