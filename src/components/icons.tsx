import type { SVGProps } from 'react';
import Image from 'next/image';

/**
 * ZapizzaLogo Component
 * 
 * HOW TO USE YOUR CUSTOM LOGO:
 * 1. Upload your image file (e.g., logo.png) to the "public" folder.
 * 2. Ensure the filename matches what is used in the <img> tag below.
 */
export function ZapizzaLogo(props: SVGProps<SVGSVGElement>) {
  // --- IMAGE VERSION (Active) ---
  // This uses a PNG file from your /public folder.
  // To use your own, upload a file named "logo.png" to the public folder.
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
      <img 
        src="/logo.png" 
        alt="Zapizza" 
        style={{ 
          maxWidth: '100%', 
          maxHeight: '100%', 
          objectFit: 'contain' 
        }} 
      />
    </div>
  );

  /*
  // --- SVG VERSION (Commented Out) ---
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2a10 10 0 0 0-9.4 13.5c.6.8 1.5 1.2 2.4 1.2H20a2 2 0 0 0 1.9-2.8A10 10 0 0 0 12 2Z" />
      <path d="M12 12V2" />
      <path d="M15 13a3 3 0 1 0-6 0" />
      <path d="M13.5 10.5a1.5 1.5 0 1 0-3 0" />
    </svg>
  );
  */
}
