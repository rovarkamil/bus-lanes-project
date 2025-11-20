/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Loader2,
  User,
  AlertTriangle,
  Languages,
  Lock,
  ArrowRight,
} from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/i18n/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getIpFromHeaders } from "@/lib/utils/get-ip";
import { motion } from "framer-motion";
import { UserType } from "@prisma/client";

const LogInPage = () => {
  const router = useRouter();
  const session = useSession();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation("Auth");

  // Check session and redirect if already authenticated
  useEffect(() => {
    if (session.status === "loading") return;
    if (session.data) {
      const userType = session.data.user?.userType as UserType;
      switch (userType) {
        case UserType.SUPER_ADMIN:
        case UserType.EMPLOYEE:
          router.push("/dashboard");
          break;
        default:
          router.push("/dashboard");
      }
    }
  }, [router, session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const ipAddress = getIpFromHeaders(new Headers());

      const response = await signIn("credentials", {
        username: formData.username,
        password: formData.password,
        ipAddress,
        redirect: false,
      });

      if (response?.error) {
        toast.error(t("InvalidCredentials"));
        setIsLoading(false);
        return;
      }

      toast.success(t("LogInSuccessful"));

      // Get user type from session
      const updatedSession = await session.update();
      const userType = updatedSession?.user?.userType as UserType;

      // Role-based redirects
      switch (userType) {
        case UserType.SUPER_ADMIN:
        case UserType.EMPLOYEE:
          router.push("/dashboard");
          break;
        default:
          router.push("/dashboard");
      }
    } catch (error) {
      console.error(error);
      toast.error(t("LoginFailed"));
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    setIsCapsLockOn(e.getModifierState("CapsLock"));
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("keyup", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      window.removeEventListener("keyup", handleKeyPress);
    };
  }, []);

  // Add language options
  const languages = [
    { code: "en", label: "English" },
    { code: "ar", label: "العربية" },
    { code: "kr", label: "کوردی" },
  ];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    document.dir = langCode === "ar" || langCode === "kr" ? "rtl" : "ltr";
  };

  // Show loading state while checking session
  if (session.status === "loading") {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-background/50 to-muted/50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-semibold text-foreground animate-pulse">
          {t("CheckingAuthentication")}
        </h2>
        <p className="text-muted-foreground">{t("PleaseWait")}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),transparent_55%)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.35),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.35),transparent_30%)] blur-3xl" />
      <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-white/[0.03]" />

      <div className="fixed top-4 right-4 flex items-center gap-3 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full hover:bg-background/80 backdrop-blur-sm border-primary/20"
            >
              <Languages className="h-5 w-5" />
              <span className="sr-only">{t("SelectLanguage")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[120px] backdrop-blur-md bg-background/80 border-primary/20"
          >
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "cursor-pointer transition-colors",
                  i18n.language === lang.code && "bg-primary/10 text-primary"
                )}
              >
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full hover:bg-background/80 backdrop-blur-sm border-primary/20"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t("ToggleTheme")}</span>
        </Button>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full flex-col justify-center px-4 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-center">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex w-full justify-center"
          >
            <Card className="w-full max-w-[480px] bg-background/80 backdrop-blur-xl border-primary/10 shadow-2xl shadow-primary/10 overflow-hidden">
              <div className="absolute h-1 top-0 left-0 right-0 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />

              <CardHeader className="space-y-4 pt-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative w-28 h-32">
                    <Link href="/">
                      <Image
                        src="/images/project-logo.png"
                        alt={t("LogoAlt")}
                        fill
                        className="object-contain"
                      />
                    </Link>
                  </div>
                </motion.div>
                <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-primary/90 to-primary">
                  {t("WelcomeTo")} {t("AppName")}
                </CardTitle>
                <CardDescription className="text-center text-base text-muted-foreground/80">
                  {t("PleaseLogIn")}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium">
                        {t("Username")}
                      </Label>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-300">
                          <User className="h-5 w-5" />
                        </div>
                        <Input
                          id="username"
                          type="text"
                          placeholder={t("EnterUsername")}
                          value={formData.username}
                          onChange={handleChange}
                          className="pl-10 bg-background/50 border-border/50 focus:border-primary/70 ring-primary/20 focus:ring-2 transition-all duration-300 h-12 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">
                        {t("Password")}
                      </Label>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-300">
                          <Lock className="h-5 w-5" />
                        </div>
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t("EnterPassword")}
                          value={formData.password}
                          onChange={handleChange}
                          className="pl-10 pr-12 bg-background/50 border-border/50 focus:border-primary/70 ring-primary/20 focus:ring-2 transition-all duration-300 h-12 rounded-xl"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-10 w-10 rounded-lg hover:bg-background/80"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground/60" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground/60" />
                          )}
                        </Button>
                      </div>
                      {isCapsLockOn && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 text-yellow-500 dark:text-yellow-400 text-sm mt-2"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <span>{t("CapsLockOn")}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className={cn(
                      "w-full h-12 font-medium text-base transition-all duration-300",
                      "bg-primary hover:bg-primary/90 rounded-xl",
                      "shadow-lg hover:shadow-primary/30 shadow-primary/20",
                      "flex items-center justify-center gap-2",
                      "group"
                    )}
                    disabled={
                      !formData.username || !formData.password || isLoading
                    }
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t("SigningIn")}
                      </>
                    ) : (
                      <>
                        {t("LogIn")}
                        <ArrowRight className="h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pb-8">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="text-xs text-center text-muted-foreground/70"
                >
                  {t("PoweredBy")}{" "}
                  <span className="font-medium">{t("PoweredByText")}</span>
                </motion.p>
              </CardFooter>
            </Card>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
};

export default LogInPage;
