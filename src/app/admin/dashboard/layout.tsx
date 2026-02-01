import { ZapizzaLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

function AdminHeader() {
    return (
        <header className="sticky top-0 z-20 border-b bg-background">
            <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <ZapizzaLogo className="h-8 w-8 text-primary" />
                    <h1 className="font-headline text-xl font-bold text-primary">
                        Zapizza Admin
                    </h1>
                </div>
                <Button asChild variant="ghost">
                    <Link href="/login">Logout</Link>
                </Button>
            </div>
        </header>
    );
}


export default function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full flex-col">
        <AdminHeader />
        <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
