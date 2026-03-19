import { RedirectToReviews } from "./redirect-component";

export function generateStaticParams() {
  return [{ outletId: 'id' }];
}

export default function Page() {
  return <RedirectToReviews />;
}
