'use client';

import type { SVGProps } from 'react';
import { Pizza } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ZapizzaLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const [error, setError] = useState(false);

  return (
    <div 
      className={cn("relative flex items-center justify-center shrink-0", className)}
      style={{
        width: props.width,
        height: props.height,
      }}
    >
      {!error ? (
        <img 
          src="/logo.png" 
          alt="Zapizza Logo" 
          className="max-h-full max-w-full object-contain select-none"
          onError={() => setError(true)}
        />
      ) : (
        <Pizza className="text-primary w-full h-full" />
      )}
    </div>
  );
}
