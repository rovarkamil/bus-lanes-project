/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const UserAuthForm: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
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
        setIsLoading(false);
        return;
      }

      toast.success("Log In successful. Redirecting...");
    } catch (error) {
      console.error(error);
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

  return (
    <form onSubmit={handleLogin}>
      <CardContent className="flex flex-col gap-4">
        <div>
          <CardTitle
            className="w-full text-white font-sans text-5xl font-bold py-4 text-start
          bg-gradient-to-r from-[#C6C7CD] via-[#fff] to-[#f1f1f1] inline-block text-transparent bg-clip-text
          "
          >
            Log In Your Account
          </CardTitle>
          <CardDescription className="mt-3">
            Please Fill in the Form to Log In.
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2">
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
                <span className="text-yellow-500 text-sm mt-1">
                  Caps Lock is on
                </span>
              )}
            </div>
          </div>
          <Button
            className="rounded-xl h-14 border-0 text-white mt-6
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
        </div>
      </CardContent>
    </form>
  );
};

export default UserAuthForm;
