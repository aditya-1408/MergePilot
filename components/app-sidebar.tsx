"use client";

import { BookOpen, Settings, Moon, Sun, LogOut } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
   SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: BookOpen },
  { title: "Repository", url: "/dashboard/repository", icon: FaGithub },
  { title: "Reviews", url: "/dashboard/reviews", icon: BookOpen },
  { title: "Subscription", url: "/dashboard/subscription", icon: BookOpen },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (url: string) => pathname === url;

  const user = session?.user;
  const userName = user?.name || "Guest";
  const userEmail = user?.email || "";
  const userAvatar =user?.image || ""
  const userImage = user?.image || "";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  function handleLogout() {
    signOut({
      fetchOptions: {
        onSuccess: () => router.push("/login"),
      },
    });
  }

  return (
    <Sidebar>
      {/* Header — connected GitHub account */}
      <SidebarHeader className="border-b">
        <div className="px-2 py-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-sidebar-accent/50">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <FaGithub className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                Connected Account
              </p>
              <p className="text-sm font-medium truncate">@{userName}</p>
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <Link href={item.url} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator />

      {/* Footer — user info + theme toggle + logout */}
      <SidebarFooter className="border-t">
        <SidebarMenu>
          {/* Theme toggle */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {mounted && theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* User dropdown */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-12">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={userImage} alt={userName} />
                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium truncate">{userName}</span>
                    <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
