import Image from 'next/image';

interface LogoProps {
    className?: string;
    height?: number;
    width?: number;
    variant?: 'default' | 'white';
}

export default function Logo({ className = '', height = 150, variant = 'default' }: LogoProps) {
    return (
        <img
            src="/uploads/bgr.png"
            alt="StressAway Logo"
            style={{ 
                height: `${height}px`, 
                width: 'auto',
                filter: variant === 'white' ? 'brightness(0) invert(1)' : 'none'
            }}
            className={`object-contain ${className}`}
        />
    );
}



