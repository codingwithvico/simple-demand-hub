import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Logo = ({ className, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <span
      className={cn(
        "font-prompt font-semibold text-gray-900 tracking-tight",
        sizeClasses[size],
        className,
      )}
    >
      pipefx
    </span>
  );
};

export default Logo;
