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
import { toastError, toastSuccess } from '@/lib/toast';
import client from '@/lib/api/client';

const emailSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values) {
    setIsLoading(true);

    try {
      const response = await client.post('/api/auth/forgot-password/send-otp', values);

      if (response.data.success) {
        toastSuccess('OTP sent to your email address');
        // Store email in sessionStorage for next step
        sessionStorage.setItem('resetEmail', values.email);
        router.push('/forgot-password/verify-otp');
      }
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="font-viga text-3xl text-center text-primary">
            Forgot Password
          </CardTitle>
          <CardDescription className="font-maven text-center text-secondary">
            Enter your registered email to receive an OTP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-telex text-secondary font-semibold">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        className="border-2 border-gray-200 focus:border-primary font-maven"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-destructive font-maven" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="font-telex w-full bg-primary hover:bg-primary/90 h-12 text-lg font-semibold text-black"
                disabled={isLoading}
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          </Form>

          <div className="font-maven mt-6 pt-6 border-t border-gray-200 text-center text-sm">
            <Link href="/login" className="text-primary hover:text-primary/80 font-semibold">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
