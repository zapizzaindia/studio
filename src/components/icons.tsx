import type { SVGProps } from 'react';

/**
 * ZapizzaLogo Component
 * 
 * TO UPDATE YOUR LOGO:
 * 1. Upload your PNG file to the "public" folder.
 * 2. Rename it to "logo.png".
 * 3. The component below will automatically display it.
 */
export function ZapizzaLogo(props: SVGProps<SVGSVGElement>) {
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
}
