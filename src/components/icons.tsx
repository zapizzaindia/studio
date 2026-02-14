'use client';

import type { SVGProps } from 'react';
import { Pizza } from 'lucide-react';
import { useState } from 'react';

export function ZapizzaLogo(props: SVGProps<SVGSVGElement>) {
  const [error, setError] = useState(false);

  return (
    <div 
      className={props.className} 
      style={{ 
        width: props.width || '100%', 
        height: props.height || '100%', 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {!error ? (
        <img 
          src="/logo.png" 
          alt="Zapizza" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%', 
            objectFit: 'contain' 
          }} 
          onError={() => setError(true)}
        />
      ) : (
        <Pizza className="text-primary w-full h-full" />
      )}
    </div>
  );
}
