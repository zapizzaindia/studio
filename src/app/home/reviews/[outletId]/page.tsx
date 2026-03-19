import { redirect } from "next/navigation";

export function generateStaticParams() {
  return [{ outletId: 'id' }];
}

export default function Page() {
  // Static export placeholder - redirects to the main search-param based reviews page
  redirect("/home/reviews");
  return null;
}
