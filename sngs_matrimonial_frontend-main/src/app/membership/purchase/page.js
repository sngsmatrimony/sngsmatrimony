'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, LogOut, Lock, Shield } from 'lucide-react';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { toastSuccess, toastError, toastInfo } from '@/lib/toast';

export default function PurchaseMembershipPage() {
  const router = useRouter();
  const { user, membership, refreshMembership, logout } = useAuthStore();
  const [plans, setPlans] = useState([]);
  const [planLoading, setPlanLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [showSkip, setShowSkip] = useState(false);

  // Fetch all membership plans from backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await client.get('/api/membership/plans');
        if (res.data.data && res.data.data.length > 0) {
          // Set all active plans, sorted by price
          const sortedPlans = res.data.data.sort((a, b) => a.price.amount - b.price.amount);
          setPlans(sortedPlans);
        }
      } catch (error) {
        console.error('Error fetching membership plans:', error);
        toastError('Failed to load membership plans');
      } finally {
        setPlanLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Check if user just registered
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const justRegistered = sessionStorage.getItem('justRegistered');
      if (justRegistered) {
        setShowSkip(true);
        sessionStorage.removeItem('justRegistered');
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handlePurchase = async (plan) => {
    setProcessingPlanId(plan._id);

    try {
      toastInfo('Creating payment order...');

      // Create Razorpay order
      const orderRes = await client.post('/api/membership/create-order', {
        planId: plan._id,
      });

      const { orderId } = orderRes.data.data;

      // Redirect to dedicated payment page
      router.push(`/payment/${orderId}`);

    } catch (error) {
      console.error('Order creation error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create order. Please try again.';

      // Provide better error message for international card restriction
      if (errorMessage.toLowerCase().includes('international')) {
        toastError('International cards are not supported. Please use a domestic Indian card or contact support.');
      } else {
        toastError(errorMessage);
      }
      setProcessingPlanId(null);
    }
  };

  return (
    <>
      {/* Fixed Header */}
      <header className="border-b border-gray-100 fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo + Title */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            <Image
              src="/logo.jpeg"
              alt="SNGS Matrimonial Logo"
              width={48}
              height={48}
              className="h-12 w-auto"
              style={{ width: 'auto', height: 'auto' }}
            />
            <h1 className="font-viga text-2xl text-accent hidden sm:block">
              SNGS Matrimonial
            </h1>
          </Link>

          {/* Welcome Message - Center */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
            <span className="font-maven text-gray-600">Welcome,</span>
            <span className="font-viga text-secondary">{user?.fullName}</span>
          </div>

          {/* Credit Badge (if active) */}
          {membership?.isActive && !membership?.isExpired && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/80 border border-primary/20">
              <span className="font-telex font-semibold text-secondary">
                {membership?.credits} credits
              </span>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 mx-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-telex"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content - Add pt-24 for fixed header spacing */}
      <div className="min-h-screen bg-gray-50 pt-24 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Active Membership Status - Subtle */}
          {membership?.isActive && !membership?.isExpired && (
            <div className="max-w-xl mx-auto mb-8">
              <div className="flex items-center justify-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <p className="font-maven text-sm text-secondary">
                  You have <span className="font-semibold">{membership.credits} credits</span> remaining {membership.expiryDate ? `(expires ${new Date(membership.expiryDate).toLocaleDateString()})` : '(never expires)'}
                </p>
              </div>
            </div>
          )}

          {/* Simple Value Proposition */}
          <div className="text-center mb-12">
            <p className="font-maven text-gray-600">
              1 credit = 1 profile view • Unlimited messaging • Re-view anytime free
            </p>
          </div>

          {/* Membership Plans Grid */}
          {planLoading ? (
            <div className="max-w-5xl mx-auto mb-16">
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="font-maven text-gray-600">Loading membership plans...</p>
              </div>
            </div>
          ) : plans.length > 0 ? (
            <div className="max-w-6xl mx-auto mb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card
                    key={plan._id}
                    className={`border-2 transition-all hover:shadow-xl ${
                      plan.isDefault
                        ? 'border-primary shadow-2xl relative'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    {plan.isDefault && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-accent text-accent-foreground font-telex px-3 py-1">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <CardTitle className="font-viga text-2xl text-secondary mb-2">
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="font-maven text-sm text-gray-600">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Pricing */}
                      <div className="text-center py-4 bg-linear-to-br from-primary/5 to-accent/5 rounded-lg">
                        <div className="font-viga text-5xl text-secondary mb-1">
                          ₹{plan.price.amount.toLocaleString('en-IN')}
                        </div>
                        <p className="font-maven text-sm text-gray-600">
                          {plan.credits} Credits
                        </p>
                        <p className="font-telex text-xs text-gray-500 mt-1">
                          {plan.validityDays === null || plan.validityDays === undefined
                            ? 'Unlimited validity'
                            : `Valid for ${plan.validityDays} days`}
                        </p>
                      </div>

                      {/* Key Features */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-maven text-sm">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                          <span>View {plan.credits} profiles</span>
                        </div>
                        <div className="flex items-center gap-2 font-maven text-sm">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                          <span>Unlimited re-views</span>
                        </div>
                        <div className="flex items-center gap-2 font-maven text-sm">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                          <span>Unlimited messaging</span>
                        </div>
                      </div>

                      {/* Purchase Button */}
                      <Button
                        onClick={() => handlePurchase(plan)}
                        disabled={processingPlanId !== null}
                        className={`w-full h-12 font-telex transition-all ${
                          plan.isDefault
                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg'
                            : 'bg-secondary hover:bg-secondary/90 text-white'
                        }`}
                      >
                        {processingPlanId === plan._id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Buy Now
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Security Badge */}
              <div className="mt-8 flex items-center justify-center gap-2 text-gray-600">
                <Shield className="w-4 h-4" />
                <span className="font-telex text-sm">Secured by Razorpay • 256-bit SSL Encryption</span>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto mb-16">
              <Card className="border-2 border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <p className="font-maven text-gray-600 text-center">
                      No membership plans available at the moment. Please check back later.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Skip for Now - Only shown after registration */}
          {showSkip && (
            <div className="max-w-4xl mx-auto text-center pb-8 md:pb-0">
              <p className="font-maven text-gray-600 mb-3">
                Not ready to purchase? You can explore the platform first.
              </p>
              <Button
                onClick={() => {
                  router.push('/');
                }}
                className="font-telex bg-black hover:bg-gray-800 text-white rounded-full px-8 py-2"
              >
                Skip for Now
              </Button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
