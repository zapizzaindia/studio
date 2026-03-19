import { RedirectToDelivery } from "./redirect-component";

export function generateStaticParams() {
  return [{ orderId: 'id' }];
}

export default function Page() {
  return <RedirectToDelivery />;
}
