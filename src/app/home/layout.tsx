import { MainNav } from "@/components/main-nav";
import { MobileNav } from "@/components/mobile-nav";
import { City } from "@/lib/types";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <MainNav />
      <main className="flex-1 pb-24 pt-16">{children}</main>
      <MobileNav />
    </div>
  );
}
