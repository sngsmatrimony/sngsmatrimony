'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <Card className="border-2 border-success shadow-2xl">
          <CardContent className="pt-12 pb-8 text-center">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>

            {/* Heading */}
            <h1 className="font-viga text-4xl text-secondary mb-3">
              Payment Successful!
            </h1>

            {/* Message */}
            <p className="font-maven text-gray-600 mb-2">
              Your membership has been activated successfully.
            </p>
            <p className="font-maven text-sm text-gray-500 mb-8">
              You can now explore profiles and connect with matches.
            </p>

            {/* Benefits */}
            <div className="bg-success/5 rounded-lg p-4 mb-8 text-left space-y-2">
              <p className="font-maven text-sm text-gray-700">
                ✓ View detailed profiles
              </p>
              <p className="font-maven text-sm text-gray-700">
                ✓ Unlimited messaging
              </p>
              <p className="font-maven text-sm text-gray-700">
                ✓ Re-view profiles anytime
              </p>
            </div>

            {/* CTA Button */}
            <Button
              onClick={() => router.push('/')}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-telex text-lg mb-4"
            >
              Go to Homepage
            </Button>

            {/* Auto-redirect Notice */}
            <p className="font-telex text-xs text-gray-500">
              Redirecting automatically in 5 seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
