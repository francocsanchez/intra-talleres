"use client";

import type { ReactNode } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  action: string;
  className?: string;
  iconClassName?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  icon?: ReactNode;
};

export function SignOutButton({
  action,
  className,
  iconClassName,
  label = "Salir",
  variant = "outline",
  size = "sm",
  icon,
}: SignOutButtonProps) {
  return (
    <form action={action} method="post">
      <Button
        type="submit"
        variant={variant}
        size={size}
        className={cn(className)}
      >
        {icon ?? <LogOut className={cn("size-4", iconClassName)} />}
        {label}
      </Button>
    </form>
  );
}
