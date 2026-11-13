import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
      default:
        "pastel-accent-bg text-white shadow-xs focus-visible:ring-slate-700",
      secondary:
        "pastel-accent-pill border hover:opacity-90 focus-visible:ring-slate-400",
      outline:
        "border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50/80 hover:text-slate-900 focus-visible:ring-slate-400",
      ghost:
        "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400",
      destructive:
        "bg-rose-500 text-white hover:bg-rose-600 shadow-xs focus-visible:ring-rose-500",
    };

    const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
      default: "h-9 px-3.5 py-2 text-sm",
      sm: "h-8 rounded-md px-2.5 text-xs",
      lg: "h-10 rounded-md px-5 text-sm",
      icon: "h-8 w-8",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
