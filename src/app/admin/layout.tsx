import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import Header from "../_components/header";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "~/components/ui/navigation-menu";
import Link from "next/link";
import { FilePen, Home, Settings } from "lucide-react";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
    const session = await auth();

    if (!session) {
        redirect("/");
    }

    return (
        <Header
            panel={<NavigationMenu className="mt-0 lg:mt-2">
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="/admin">
                                <div className='flex items-center gap-2'>
                                    <Home className="w-5" /> 首頁
                                </div>
                            </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="/admin/settings">
                                <div className='flex items-center gap-2'>
                                    <Settings className="w-5" /> 後端設定
                                </div>
                            </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} bg-lime-100 hover:bg-lime-300`}>
                            <Link href="/admin/evaluate">
                                <div className='flex items-center gap-2'>
                                    <FilePen className="w-5" /> 開始評比
                                </div>
                            </Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>}
        >
            {children}
        </Header>
    );
}
