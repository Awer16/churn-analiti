"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { clearSession, getStoredToken } from "@/lib/session";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(Boolean(getStoredToken()));
  }, [pathname]);

  function onLogout() {
    clearSession();
    setIsAuthenticated(false);
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="nav">
      <div className="page-shell nav-inner">
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="brand">
          <span className="brand-mark" />
          <span>ChurnVision</span>
        </Link>
        {isAuthenticated ? (
          <div className="nav-links">
            <Link href="/dashboard" className="muted-link">
              Дашборд
            </Link>
            <Link href="/profile" className="muted-link">
              Профиль
            </Link>
          </div>
        ) : (
          <div className="nav-links">
            {pathname !== "/login" && pathname !== "/register" && (
              <>
                <Link href="/#product" className="muted-link">
                  Возможности
                </Link>
                <Link href="/#analytics" className="muted-link">
                  Как это работает
                </Link>
              </>
            )}
          </div>
        )}
        <div className="nav-actions">
          <ThemeToggle />
          {isAuthenticated ? (
            <button className="button button-primary" type="button" onClick={onLogout}>
              Выйти
            </button>
          ) : (
            <>
              <Link href="/login" className="button button-secondary">
                Войти
              </Link>
              <Link href="/register" className="button button-primary">
                Создать аккаунт
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
