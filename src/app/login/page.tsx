"use client";

import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const signupSuccess = searchParams.get("signup") === "success";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username/email or password");
        setIsLoading(false);
      } else if (result?.ok) {
        // Get the session to access user role
        const session = await getSession();

        // Redirect based on role
        if (session?.user?.role === "admin") {
          router.push("/dashboard");
        } else if (session?.user?.role === "usher") {
          router.push("/usher");
        } else {
          // Fallback to callbackUrl or home
          router.push(callbackUrl);
        }
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white/10 p-8 shadow-2xl backdrop-blur-sm">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Enter your username or email and password
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
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
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="relative block w-full appearance-none rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm"
                placeholder="Username or Email"
              />
            </div>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full appearance-none rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm"
                placeholder="Password"
              />
            </div>
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
              {isLoading ? "Signing in..." : "Sign in"}
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
