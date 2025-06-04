"use client";

"use client";
import { useForm } from "react-hook-form";

export default function LoginPage() {
  const form = useForm<{ email: string; password: string }>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: { email: string; password: string }) => {
    alert("Login data: " + JSON.stringify(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Login</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...form.register("email", { required: true })}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary"
              placeholder="you@example.com"
              autoComplete="email"
            />
            {form.formState.errors.email && (
              <span className="text-red-500 text-sm">Email is required</span>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Password</label>
            <input
              type="password"
              {...form.register("password", { required: true, minLength: 6 })}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary"
              placeholder="********"
              autoComplete="current-password"
            />
            {form.formState.errors.password && (
              <span className="text-red-500 text-sm">Password is required (min 6 chars)</span>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
