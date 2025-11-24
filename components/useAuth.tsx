/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type SignupFormState = {
  name: string;
  username: string;
  password: string;
};

const UserAuthForm: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [signupData, setSignupData] = useState<SignupFormState>({
    name: "",
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as keyof SignupFormState;
    setSignupData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await signIn("credentials", {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (response?.error) {
        toast.error("Invalid username or password.");
        return;
      }

      toast.success("Log In successful. Redirecting...");
    } catch (error) {
      console.error(error);
      toast.error("Unable to log in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSignupLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        toast.error(payload?.message ?? "Unable to create account.");
        return;
      }

      toast.success("Account created. Signing you in...");
      const signinResponse = await signIn("credentials", {
        username: signupData.username,
        password: signupData.password,
        redirect: false,
      });

      if (signinResponse?.error) {
        toast.error("Unable to sign in after creating the account.");
        return;
      }

      toast.success("Log In successful. Redirecting...");
    } catch (error) {
      console.error(error);
      toast.error("Unable to create account. Please try again.");
    } finally {
      setIsSignupLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleSignupPasswordVisibility = () => {
    setShowSignupPassword(!showSignupPassword);
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

  const descriptionCopy =
    activeTab === "login"
      ? "Please Fill in the Form to Log In."
      : "Create your account to get started.";

  return (
    <CardContent className="flex flex-col gap-4">
      <div>
        <CardTitle
          className="w-full text-white font-sans text-5xl font-bold py-4 text-start
          bg-gradient-to-r from-[#C6C7CD] via-[#fff] to-[#f1f1f1] inline-block text-transparent bg-clip-text
          "
        >
          Log In Your Account
        </CardTitle>
        <CardDescription className="mt-3">{descriptionCopy}</CardDescription>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "login" | "signup")}
        className="flex flex-col gap-6"
      >
        <TabsList className="grid grid-cols-2 rounded-2xl bg-[#1C1E20] p-1 text-white">
          <TabsTrigger
            value="login"
            className="rounded-xl text-sm font-medium data-[state=active]:bg-[#25272B]"
          >
            Log In
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="rounded-xl text-sm font-medium data-[state=active]:bg-[#25272B]"
          >
            Sign Up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="m-0">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col space-y-1.5">
              <Input
                required
                id="username"
                className="rounded-xl h-14 border-0
                bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1C1E20] to-[#25272B] text-white"
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <div className="relative flex flex-col gap-1">
                <div className="relative flex items-center gap-2">
                  <Input
                    className="rounded-xl h-14 border-0
                  bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1C1E20] to-[#25272B] text-white
                  "
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <Button
                    onClick={togglePasswordVisibility}
                    className="h-14 px-4"
                    variant="ghost"
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {isCapsLockOn && (
                  <span className="mt-1 text-sm text-yellow-500">
                    Caps Lock is on
                  </span>
                )}
              </div>
            </div>
            <Button
              className="rounded-xl h-14 border-0 text-white mt-2
                bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1bef7ac2] to-[#1bef7a]
                disabled:bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] disabled:from-[#43454C] disabled:to-[#55565E]
                duration-300 ease-in-out
                "
              type="submit"
              disabled={!formData.username || !formData.password || isLoading}
              variant={
                !formData.username || !formData.password ? "outline" : "default"
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="m-0">
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="flex flex-col space-y-1.5">
              <Input
                required
                id="signup-name"
                name="name"
                className="rounded-xl h-14 border-0
                bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1C1E20] to-[#25272B] text-white"
                type="text"
                placeholder="Full Name"
                value={signupData.name}
                onChange={handleSignupChange}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Input
                required
                id="signup-username"
                name="username"
                className="rounded-xl h-14 border-0
                bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1C1E20] to-[#25272B] text-white"
                type="text"
                placeholder="Username"
                value={signupData.username}
                onChange={handleSignupChange}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <div className="relative flex flex-col gap-1">
                <div className="relative flex items-center gap-2">
                  <Input
                    required
                    id="signup-password"
                    name="password"
                    className="rounded-xl h-14 border-0
                  bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1C1E20] to-[#25272B] text-white
                  "
                    type={showSignupPassword ? "text" : "password"}
                    placeholder="Password"
                    value={signupData.password}
                    onChange={handleSignupChange}
                  />
                  <Button
                    onClick={toggleSignupPasswordVisibility}
                    className="h-14 px-4"
                    variant="ghost"
                    type="button"
                  >
                    {showSignupPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {isCapsLockOn && (
                  <span className="mt-1 text-sm text-yellow-500">
                    Caps Lock is on
                  </span>
                )}
              </div>
            </div>
            <Button
              className="rounded-xl h-14 border-0 text-white mt-2
                bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1bef7ac2] to-[#1bef7a]
                disabled:bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] disabled:from-[#43454C] disabled:to-[#55565E]
                duration-300 ease-in-out
                "
              type="submit"
              disabled={
                !signupData.name ||
                !signupData.username ||
                !signupData.password ||
                isSignupLoading
              }
              variant={
                !signupData.name || !signupData.username || !signupData.password
                  ? "outline"
                  : "default"
              }
            >
              {isSignupLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </CardContent>
  );
};

export default UserAuthForm;
