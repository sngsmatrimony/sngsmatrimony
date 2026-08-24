'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/store/authStore';
import { toastError, toastSuccess } from '@/lib/toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values) {
    setIsLoading(true);

    const result = await login(values.email, values.password);

    if (result.success) {
      toastSuccess('Sign in successful! Redirecting...');
      router.push('/');
    } else {
      toastError(result.error || 'Sign in failed. Please try again.');
    }

    setIsLoading(false);
  }

  return (
    <div className="w-full max-w-md">
      <Card className="border-0 shadow-lg bg-white">
      <CardHeader className="space-y-2 pb-6">
        <div className="text-center mb-2">
          <div className="inline-block p-3 bg-gradient-warm-subtle rounded-full mb-4">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        <CardTitle className="font-viga text-3xl text-center text-primary">Welcome Back</CardTitle>
        <CardDescription className="font-maven text-center text-secondary">Sign in to your account to continue finding your perfect match</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-telex text-secondary font-semibold">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      type="email"
                      autoComplete="username"
                      className="border-2 border-gray-200 focus:border-primary focus:ring-primary transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="font-telex text-secondary font-semibold">Password</FormLabel>
                    <Link href="/forgot-password" className="font-maven text-sm text-black font-semibold hover:text-secondary/80 hover:underline">
                      Forgot?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      autoComplete="current-password"
                      className="border-2 border-gray-200 focus:border-primary focus:ring-primary transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="font-telex w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Form>

        <div className="font-maven mt-6 pt-6 border-t border-gray-200 text-center text-sm">
          <span className="text-secondary/70">Don&apos;t have an account? </span>
          <Link href="/register" className="text-black hover:text-secondary/80 font-semibold hover:underline transition-colors mx-2">
            Sign up
          </Link>
        </div>
      </CardContent>
      </Card>
    </div>
  );
}
