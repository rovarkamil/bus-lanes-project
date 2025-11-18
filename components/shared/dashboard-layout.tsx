import { FC, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import { useTranslation } from "@/i18n/client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import LogOutButton from "@/components/logout-button";
import ThemeToggleButton from "@/components/theme-toggle-button";
import LanguageSwitcherDropdown from "@/components/language-switcher-dropdown";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "next-auth/react";
import { Loader } from "@/components/loader-table";

interface SidebarHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  title: string;
}

const SidebarHeader: FC<SidebarHeaderProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  title,
}) => {
  const { i18n } = useTranslation("Dashboard");
  const isRTL = i18n.language !== "en";

  return (
    <div className="flex min-h-16 max-h-16 items-center justify-between px-4 border-b">
      {isSidebarOpen && (
        <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {title}
        </h2>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="rounded-full hover:bg-primary/10"
      >
        {isRTL ? (
          isSidebarOpen ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )
        ) : isSidebarOpen ? (
          <ChevronLeft className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};

interface NavigationProps {
  isSidebarOpen: boolean;
  setIsOpen?: (value: boolean) => void;
  status: "loading" | "authenticated" | "unauthenticated";
  routes: {
    label: string;
    routes: {
      path: string;
      label: string;
      icon: JSX.Element;
      disabled?: boolean;
      completed?: boolean;
    }[];
  }[];
}

const Navigation: FC<NavigationProps> = ({
  isSidebarOpen,
  setIsOpen,
  status,
  routes,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation("Dashboard");

  const handleRouteClick = (path: string) => {
    router.push(path);
    if (setIsOpen) {
      setIsOpen(false);
    }
  };

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader />
        <h2 className="text-lg font-semibold text-muted-foreground">
          {t("Status.LoadingRoutes")}
        </h2>
      </div>
    );
  }

  // If no routes are available, show message
  if (routes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <h2 className="text-lg font-semibold text-muted-foreground">
          {t("Status.NoRoutesAvailable")}
        </h2>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 py-4">
      <nav className="space-y-6 px-2">
        {routes.map((group, index) => (
          <div key={index} className="space-y-2">
            {isSidebarOpen && (
              <h3 className="px-4 text-sm font-medium text-muted-foreground">
                {group.label}
              </h3>
            )}
            <div className="space-y-1">
              {group.routes.map((route) => (
                <Button
                  key={route.path}
                  variant={pathname === route.path ? "secondary" : "ghost"}
                  className={cn(
                    "w-full gap-4",
                    route.completed && "relative",
                    isSidebarOpen ? "px-4" : "justify-center px-2"
                  )}
                  onClick={() => handleRouteClick(route.path)}
                  disabled={route.disabled}
                >
                  {route.icon}
                  {isSidebarOpen && (
                    <span className="flex-1 text-sm text-left">
                      {route.label}
                    </span>
                  )}
                  {route.completed && (
                    <CheckCircle
                      size={10}
                      className="absolute right-2 -translate-y-1/2 text-green-500"
                    />
                  )}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </ScrollArea>
  );
};

const SidebarContent: FC<{
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  setIsOpen?: (value: boolean) => void;
  status: "loading" | "authenticated" | "unauthenticated";
  title: string;
  routes: {
    label: string;
    routes: {
      path: string;
      label: string;
      icon: JSX.Element;
      disabled?: boolean;
      completed?: boolean;
    }[];
  }[];
}> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  setIsOpen,
  status,
  title,
  routes,
}) => {
  return (
    <div className="flex h-full flex-col">
      <SidebarHeader
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        title={title}
      />
      <Navigation
        isSidebarOpen={isSidebarOpen}
        setIsOpen={setIsOpen}
        status={status}
        routes={routes}
      />
    </div>
  );
};

const MobileSidebar: FC<{
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  trigger?: React.ReactNode;
  status: "loading" | "authenticated" | "unauthenticated";
  title: string;
  routes: {
    label: string;
    routes: {
      path: string;
      label: string;
      icon: JSX.Element;
      disabled?: boolean;
      completed?: boolean;
    }[];
  }[];
}> = ({ isOpen, setIsOpen, trigger, status, title, routes }) => {
  const { i18n } = useTranslation("Dashboard");
  const isRTL = i18n.language !== "en";

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent side={isRTL ? "right" : "left"} className="p-0 w-72">
        <SidebarContent
          isSidebarOpen={true}
          setIsSidebarOpen={() => {}}
          setIsOpen={setIsOpen}
          status={status}
          title={title}
          routes={routes}
        />
      </SheetContent>
    </Sheet>
  );
};

interface SharedDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  routes: {
    label: string;
    routes: {
      path: string;
      label: string;
      icon: JSX.Element;
      disabled?: boolean;
      completed?: boolean;
    }[];
  }[];
}

const SharedDashboardLayout: FC<SharedDashboardLayoutProps> = ({
  children,
  title,
  routes,
}) => {
  const { i18n, t } = useTranslation("Dashboard");
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const isRTL = i18n.language !== "en";
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed top-0 h-screen border-x border-line bg-card/50 backdrop-blur-xl transition-all duration-300 hidden lg:block z-40",
          isRTL ? "right-0" : "left-0",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        <SidebarContent
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          status={status}
          title={title}
          routes={routes}
        />
      </aside>

      {/* Mobile Drawer */}
      <MobileSidebar
        isOpen={isMobileDrawerOpen}
        setIsOpen={setIsMobileDrawerOpen}
        status={status}
        title={title}
        routes={routes}
      />

      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          isRTL
            ? isSidebarOpen
              ? "mr-0 lg:mr-64"
              : "mr-0 lg:mr-16"
            : isSidebarOpen
              ? "ml-0 lg:ml-64"
              : "ml-0 lg:ml-16"
        )}
      >
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 border-b border-line bg-background/80 backdrop-blur-lg min-h-16 max-h-16">
          <div className="flex min-h-16 max-h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="rounded-full hover:bg-primary/10 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              {status === "authenticated" && (
                <h2 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {session?.user?.name}
                </h2>
              )}
              {status === "loading" && (
                <h2 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  {t("Status.Loading")}
                </h2>
              )}
              {status === "unauthenticated" && (
                <h2 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  {t("Status.Unauthenticated")}
                </h2>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                className={cn(
                  "bg-primary/20 text-primary hover:bg-primary/30",
                  "w-full gap-4",
                  isSidebarOpen && "px-4",
                  !isSidebarOpen && "justify-center px-2"
                )}
                onClick={() => router.push("/pos")}
              >
                <DollarSign />
                POS
              </Button>
              <div className="md:flex hidden items-center gap-1 sm:gap-2">
                <ThemeToggleButton isExpanded={false} />
                <LanguageSwitcherDropdown />
              </div>
              <LogOutButton isExpanded={false} />
            </div>
          </div>
        </header>

        <main className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="transition-all p-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SharedDashboardLayout;
