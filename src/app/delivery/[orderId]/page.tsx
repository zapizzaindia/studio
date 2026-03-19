import { redirect } from "next/navigation";

export function generateStaticParams() {
  return [{ orderId: 'id' }];
}

export default function Page() {
  // Static export placeholder - redirects to the main search-param based terminal
  redirect("/delivery");
  return null;
}
