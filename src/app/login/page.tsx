"use client";

import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { api } from "@/trpc/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"username" | "password" | "setup">(
    "username",
  );
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const signupSuccess = searchParams.get("signup") === "success";

  const checkUserPasswordMutation = api.user.checkUserPassword.useMutation({
    onSuccess: (result) => {
      setUsername(result.username ?? "");
      if (result.hasPassword) {
        setStep("password");
      } else {
        setStep("setup");
      }
      setIsLoading(false);
    },
    onError: (err) => {
      // Handle different error types
      const errorMessage = err.message;

      if (
        errorMessage.includes("NOT_FOUND") ||
        errorMessage.includes("User not found")
      ) {
        setError("User not found. Please check your username or email.");
      } else if (
        errorMessage.includes("FORBIDDEN") ||
        errorMessage.includes("disabled")
      ) {
        setError(
          "Your account has been disabled. Please contact an administrator.",
        );
      } else if (errorMessage.includes("fetch")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(errorMessage);
      }
      setIsLoading(false);
    },
  });

  const setupPasswordMutation = api.user.setupPassword.useMutation({
    onSuccess: async () => {
      // After setting password, automatically login
      const result = await signIn("credentials", {
        identifier: username,
        password,
        redirect: false,
      });

      if (result?.ok) {
        const session = await getSession();
        if (session?.user?.role === "admin") {
          router.push("/dashboard");
        } else if (session?.user?.role === "usher") {
          router.push("/usher/scan");
        } else {
          router.push(callbackUrl);
        }
        router.refresh();
      } else {
        setError("Failed to login after setting password");
        setIsLoading(false);
      }
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    },
  });

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate input
    if (!identifier.trim()) {
      setError("Please enter your username or email");
      return;
    }

    if (identifier.trim().length < 3) {
      setError("Username or email must be at least 3 characters");
      return;
    }

    setIsLoading(true);

    // Call the mutation
    checkUserPasswordMutation.mutate({
      identifier: identifier.trim(),
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        identifier: username,
        password: password.trim(),
        redirect: false,
      });

      if (result?.error) {
        if (
          result.error === "Account is disabled" ||
          result.error.includes("disabled")
        ) {
          setError(
            "Your account has been disabled. Please contact an administrator.",
          );
        } else if (
          result.error === "CredentialsSignin" ||
          result.error.includes("password")
        ) {
          setError("Invalid password. Please try again.");
        } else {
          setError("Authentication failed. Please try again.");
        }
        setIsLoading(false);
      } else if (result?.ok) {
        const session = await getSession();
        if (session?.user?.role === "admin") {
          router.push("/dashboard");
        } else if (session?.user?.role === "usher") {
          router.push("/usher");
        } else {
          router.push(callbackUrl);
        }
        router.refresh();
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password
    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password.length > 100) {
      setError("Password must be at most 100 characters");
      return;
    }

    // Validate confirmation
    if (!confirmPassword.trim()) {
      setError("Please confirm your password");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setupPasswordMutation.mutate({
      username,
      password: password.trim(),
    });
  };

  // Step 1: Username input
  if (step === "username") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-white/10 p-8 shadow-2xl backdrop-blur-sm">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-300">
              Enter your username or email
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleUsernameSubmit}>
            <div>
              <label htmlFor="identifier" className="sr-only">
                Username or Email
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                autoFocus
                minLength={3}
                maxLength={100}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="relative block w-full appearance-none rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm"
                placeholder="Username or Email"
              />
            </div>

            {signupSuccess && (
              <div className="rounded-md bg-green-500/10 p-3 text-center text-sm text-green-400">
                Account created successfully! Please sign in.
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-500/10 p-3 text-center text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Checking..." : "Continue"}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-300">
                Don&apos;t have an account?{" "}
                <a
                  href="/signup"
                  className="font-medium text-purple-400 hover:text-purple-300"
                >
                  Sign up
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 2: Password input
  if (step === "password") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-white/10 p-8 shadow-2xl backdrop-blur-sm">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-center text-sm text-gray-300">
              @{username}
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
                minLength={6}
                maxLength={100}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full appearance-none rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm"
                placeholder="Password"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-500/10 p-3 text-center text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep("username");
                  setPassword("");
                  setError("");
                }}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex flex-1 justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 3: Password setup
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white/10 p-8 shadow-2xl backdrop-blur-sm">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Set Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Welcome @{username}! Please create a password for your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handlePasswordSetup}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="new-password" className="sr-only">
                New Password
              </label>
              <input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                autoFocus
                minLength={6}
                maxLength={100}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full appearance-none rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm"
                placeholder="New Password (min 6 characters)"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                maxLength={100}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="relative block w-full appearance-none rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm"
                placeholder="Confirm Password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-500/10 p-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Setting password..." : "Set Password & Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
