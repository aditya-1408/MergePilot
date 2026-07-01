"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

interface LogoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function Logout({ children, className }: LogoutProps) {
  const router = useRouter();

  function handleLogout() {
    signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  }

  return (
    <span className={className} onClick={handleLogout}>
      {children}
    </span>
  );
}
