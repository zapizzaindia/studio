
import { MainNav } from "@/components/main-nav";
import { MobileNav } from "@/components/mobile-nav";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white">
      <MainNav />
      <main className="flex-1 pt-16 pb-16">{children}</main>
      <MobileNav />
    </div>
  );
}
