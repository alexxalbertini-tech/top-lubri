import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export function PremiumCard({ children, className, animate = true, ...props }: PremiumCardProps) {
  const content = (
    <div 
      className={cn(
        "bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 backdrop-blur-md relative overflow-hidden group",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity group-hover:before:opacity-100 before:pointer-events-none",
        className
      )}
      {...props}
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />
      {children}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {content}
    </motion.div>
  );
}

interface PremiumButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  glow?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PremiumButton({ 
  children, 
  className, 
  variant = 'primary', 
  glow = true,
  size = 'md',
  ...props 
}: PremiumButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={cn(
        "relative flex items-center justify-center font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        size === 'sm' && "px-4 py-2 text-xs rounded-xl",
        size === 'md' && "px-6 py-3 rounded-2xl",
        size === 'lg' && "px-8 py-4 text-lg rounded-3xl",
        variant === 'primary' && "bg-primary text-primary-foreground hover:brightness-110",
        variant === 'secondary' && "bg-zinc-800 text-white hover:bg-zinc-700",
        variant === 'outline' && "bg-transparent border border-zinc-700 text-white hover:border-primary/50",
        variant === 'ghost' && "bg-transparent text-zinc-400 hover:text-white",
        glow && variant === 'primary' && "glow-primary glow-primary-hover",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
