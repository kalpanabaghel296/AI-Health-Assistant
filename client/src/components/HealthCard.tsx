import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface HealthCardProps {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  delay?: number;
}

export function HealthCard({ title, subtitle, className, children, icon, delay = 0 }: HealthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1, ease: "easeOut" }}
      className={cn(
        "bg-card rounded-2xl border border-border/50 p-6 shadow-sm",
        "hover:shadow-md hover:border-primary/20 transition-all duration-300",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-secondary/50 text-primary">
            {icon}
          </div>
        )}
      </div>
      {children}
    </motion.div>
  );
}
