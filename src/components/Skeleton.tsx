import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rounded', ...props }) => {
    const baseClasses = "animate-pulse bg-neutral-700/50";
    const variantClasses = {
        text: "h-4 w-full rounded",
        circular: "rounded-full",
        rectangular: "rounded-none",
        rounded: "rounded-md"
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            {...props}
        />
    );
};
