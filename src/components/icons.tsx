import type { SVGProps } from 'react';

export function ZapizzaLogo(props: SVGProps<SVGSVGElement>) {
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
}
