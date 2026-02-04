import type { SVGProps } from 'react';
import Image from 'next/image';

/**
 * ZapizzaLogo Component
 * 
 * To use your own custom logo:
 * 1. SVG: Replace the <path> elements inside the <svg> tag below with your own SVG paths.
 * 2. IMAGE (PNG/JPG): 
 *    - Place your logo file (e.g., logo.png) in the /public directory.
 *    - Uncomment the "Image version" code block and comment out the "SVG version".
 */
export function ZapizzaLogo(props: SVGProps<SVGSVGElement>) {
  // --- SVG VERSION (Current) ---
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
      {/* Replace these paths with your custom SVG paths */}
      <path d="M12 2a10 10 0 0 0-9.4 13.5c.6.8 1.5 1.2 2.4 1.2H20a2 2 0 0 0 1.9-2.8A10 10 0 0 0 12 2Z" />
      <path d="M12 12V2" />
      <path d="M15 13a3 3 0 1 0-6 0" />
      <path d="M13.5 10.5a1.5 1.5 0 1 0-3 0" />
    </svg>
  );

  /*
  // --- IMAGE VERSION (Uncomment to use a PNG/JPG from /public) ---
  return (
    <div className={props.className} style={{ width: props.width || '100%', height: props.height || '100%', position: 'relative' }}>
      <img 
        src="/logo.png" 
        alt="Custom Logo" 
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
      />
    </div>
  );
  */
}
