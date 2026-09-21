import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-[background-color,color,transform] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-primary/90",
        secondary: "border border-border bg-surface text-foreground hover:bg-accent-soft",
        // Igual de neutro que "secondary" (borde + fondo transparente), pero sin
        // superficie propia: pensado para usarse sobre fondos que ya tienen
        // color (por ejemplo, dentro de un diálogo). Varios primitivos de
        // shadcn (alert-dialog, carousel, pagination) esperan una variante
        // "outline" por convención de la librería.
        outline: "border border-border bg-transparent text-foreground hover:bg-accent-soft",
        ghost: "text-muted-foreground hover:bg-accent-soft hover:text-foreground",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10",
        sm: "h-9 px-3 text-xs",
        icon: "size-10 px-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

// forwardRef porque varios primitivos de shadcn (Calendar, Sidebar, Carousel)
// le pasan un ref directamente a <Button> — sin esto no compilan.
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
