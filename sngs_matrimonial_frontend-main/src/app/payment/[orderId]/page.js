'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Script from 'next/script';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { toastSuccess, toastError, toastInfo } from '@/lib/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { user, refreshMembership } = useAuthStore();
  const [orderData, setOrderData] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('loading'); // loading, processing, success
  const [transactionData, setTransactionData] = useState(null);
  const checkoutOpenedRef = useRef(false);

  // Fetch order details on mount
  useEffect(() => {
    // Guard: Only fetch if orderId is available
    if (!params.orderId) {
      console.warn('Order ID not available yet');
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const res = await client.get(`/api/membership/order/${params.orderId}`);
        setOrderData(res.data.data);
      } catch (error) {
        console.error('Error fetching order:', error);
        toastError('Failed to load payment details');
        setTimeout(() => {
          router.push('/membership/purchase');
        }, 1500);
      }
    };

    fetchOrderDetails();
  }, [params.orderId, router]);

  // Check if Razorpay script is loaded (handles cached scripts)
  useEffect(() => {
    // If already loaded via state, skip
    if (scriptLoaded) return;

    // Poll for Razorpay (in case onLoad doesn't fire for cached scripts)
    const checkInterval = setInterval(() => {
      if (window.Razorpay) {
        console.log('[PaymentPage] Razorpay detected via polling, setting scriptLoaded=true');
        setScriptLoaded(true);
        clearInterval(checkInterval);
      }
    }, 100); // Check every 100ms

    // Cleanup interval after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      if (!window.Razorpay) {
        console.error('[PaymentPage] Razorpay failed to load after 5 seconds');
        toastError('Failed to load payment gateway');
      }
    }, 5000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [scriptLoaded]);

  // Handler: Payment Success
  const handlePaymentSuccess = useCallback(async (response) => {
    try {
      toastInfo('Verifying payment...');

      await client.post('/api/membership/verify-payment', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      toastSuccess('🎉 Payment successful! Membership activated.');
      await refreshMembership();

      // Set success state with transaction details
      setPaymentStatus('success');
      setTransactionData({
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
      });

    } catch (error) {
      console.error('Payment verification error:', error);
      toastError('Payment verification failed. Please contact support.');
      setTimeout(() => {
        router.push('/membership/purchase');
      }, 2000);
    }
  }, [refreshMembership, router]);

  // Handler: Payment Dismissed
  const handlePaymentDismiss = useCallback(() => {
    toastError('Payment cancelled');
    // Redirect back to purchase page
    setTimeout(() => {
      router.push('/membership/purchase');
    }, 1500);
  }, [router]);

  // Handler: Open Razorpay Checkout
  const openRazorpayCheckout = useCallback(() => {
    // Set status at the start of opening checkout
    setPaymentStatus('processing');

    // Safety checks
    if (!window.Razorpay) {
      console.error('Razorpay script not loaded');
      toastError('Payment gateway not loaded');
      return;
    }

    if (!orderData) {
      console.error('Order data not available');
      toastError('Order details not available');
      return;
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'SNGS Matrimonial',
      description: orderData.planName,
      order_id: orderData.orderId,
      handler: handlePaymentSuccess,
      prefill: {
        name: user?.fullName,
        email: user?.email,
        contact: user?.mobileNumber,
      },
      theme: {
        // razorpay gateway theme
        // color: '#FFE100',
        backdrop_color: '#000000', // Black backdrop
      },
      modal: {
        ondismiss: handlePaymentDismiss,
        backdropclose: false, // Prevent closing by clicking backdrop
        escape: true, // Allow ESC key
      },
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error opening Razorpay modal:', error);
      toastError('Failed to open payment modal');
    }
  }, [orderData, user, handlePaymentSuccess, handlePaymentDismiss]);

  // Auto-open Razorpay when script loads and order is fetched
  useEffect(() => {
    console.log('[PaymentPage] Auto-open effect triggered', {
      scriptLoaded,
      orderData: !!orderData,
      razorpayDefined: !!window.Razorpay,
    });

    // Prevent opening checkout multiple times
    if (checkoutOpenedRef.current) {
      console.log('[PaymentPage] Checkout already opened, skipping...');
      return;
    }

    if (scriptLoaded && orderData) {
      console.log('[PaymentPage] All conditions met, opening checkout...');
      checkoutOpenedRef.current = true;
      // Safe: ref guard prevents duplicate opens, state update is intentional and controlled
      // eslint-disable-next-line react-hooks/set-state-in-effect
      openRazorpayCheckout();
    }
  }, [scriptLoaded, orderData, openRazorpayCheckout]);

  const handleGoHome = () => {
    router.push('/browse');
  };

  return (
    <>
      {/* Razorpay Checkout Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => {
          console.log('[PaymentPage] Script onLoad fired');
          setScriptLoaded(true);
        }}
        onError={() => {
          console.error('[PaymentPage] Script onError fired');
          toastError('Failed to load payment gateway');
          setTimeout(() => {
            router.push('/membership/purchase');
          }, 1500);
        }}
      />

      {/* Full-screen Black Background */}
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">

        {/* Loading State */}
        {paymentStatus === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
            <p className="text-white font-maven text-lg">Loading payment gateway...</p>
          </div>
        )}

        {/* Processing State - Just black screen while Razorpay modal is visible */}
        {paymentStatus === 'processing' && (
          <div className="text-center">
            {/* Empty div - Razorpay modal will be displayed on top */}
          </div>
        )}

        {/* Success State - Show transaction details */}
        {paymentStatus === 'success' && (
          <Card className="max-w-md w-full border-2 border-success shadow-2xl">
            <CardContent className="pt-12 pb-8 text-center">
              {/* Success Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>

              {/* Success Message */}
              <h1 className="font-viga text-3xl text-secondary mb-3">
                Payment Successful!
              </h1>

              <p className="font-maven text-gray-600 mb-6">
                Your membership has been activated.
              </p>

              {/* Transaction Details */}
              {transactionData && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3 text-left">
                  <div className="flex justify-between text-sm">
                    <span className="font-telex text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-xs text-secondary break-all ml-2">
                      {transactionData.paymentId}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                    <span className="font-telex text-gray-600">Order ID:</span>
                    <span className="font-mono text-xs text-secondary break-all ml-2">
                      {transactionData.orderId}
                    </span>
                  </div>
                </div>
              )}

              {/* Go to Dashboard Button */}
              <Button
                onClick={handleGoHome}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-telex text-lg"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </>
  );
}
