"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/trpc/react";
import { Role } from "../../../generated/prisma";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: Role.usher as Role,
  });
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const signupMutation = api.user.signup.useMutation({
    onSuccess: () => {
      router.push("/login?signup=success");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 20) {
      errors.username = "Username must be at most 20 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email address";
    }

    if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    signupMutation.mutate({
      name: formData.name,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-[#2e026d] to-[#15162c]">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white/10 p-8 shadow-2xl backdrop-blur-sm">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Sign up to get started
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            {/* Name */}
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="relative block w-full appearance-none rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm"
                placeholder="Full Name"
              />
              {validationErrors.name && (
                <p className="mt-1 text-xs text-red-400">
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="relative block w-full appearance-none rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm"
                placeholder="Username"
              />
              {validationErrors.username && (
                <p className="mt-1 text-xs text-red-400">
                  {validationErrors.username}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="relative block w-full appearance-none rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm"
                placeholder="Email address"
              />
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-400">
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="relative block w-full appearance-none rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm"
                placeholder="Password (min. 6 characters)"
              />
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-400">
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="relative block w-full appearance-none rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm"
                placeholder="Confirm Password"
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="sr-only">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="relative block w-full appearance-none rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm"
              >
                <option value={Role.usher}>Usher</option>
                <option value={Role.admin}>Admin</option>
              </select>
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
              disabled={signupMutation.isPending}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {signupMutation.isPending ? "Creating account..." : "Sign up"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-300">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-medium text-purple-400 hover:text-purple-300"
              >
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
