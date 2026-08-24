'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CancellationAndRefundPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.jpeg"
              alt="SNGS Matrimonial Logo"
              width={48}
              height={48}
              className="h-12 w-auto"
              style={{ width: 'auto', height: 'auto' }}
            />
            <h1 className="font-viga text-xl sm:text-2xl text-accent">SNGS Matrimonial</h1>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="font-telex text-secondary hover:text-secondary/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-viga text-3xl sm:text-4xl text-secondary mb-2">
          Cancellation and Refund Policy
        </h1>
        <p className="font-telex text-sm text-gray-500 mb-8">
          Effective Date: January 2026
        </p>

        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <p className="font-maven text-gray-600 leading-relaxed">
              At SNGS Matrimonial, we strive to ensure your complete satisfaction with our services. This Cancellation and Refund Policy outlines the terms and conditions for cancellations and refunds for our premium membership plans.
            </p>
          </section>

          {/* Cancellation Policy */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">1. Cancellation Policy</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-maven font-semibold text-gray-800 mb-2">How to Cancel Your Membership</h3>
                <p className="font-maven text-gray-600 leading-relaxed">
                  You can cancel your premium membership at any time through the following methods:
                </p>
                <ul className="list-disc list-inside font-maven text-gray-600 mt-2 space-y-1 ml-4">
                  <li>Log in to your account and navigate to Settings → Membership → Cancel Membership</li>
                  <li>Send an email to support@sngsmatrimonial.com with subject &quot;Membership Cancellation Request&quot;</li>
                  <li>Contact our customer support at +91-XXXXXXXXXX</li>
                </ul>
              </div>
              <div>
                <h3 className="font-maven font-semibold text-gray-800 mb-2">Cancellation Processing</h3>
                <p className="font-maven text-gray-600 leading-relaxed">
                  Once you submit a cancellation request, our team will process it within 24-48 business hours. You will receive a confirmation email once the cancellation is complete. Your premium features will remain active until the end of your current billing period.
                </p>
              </div>
            </div>
          </section>

          {/* Refund Eligibility */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">2. Refund Eligibility</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              Refunds are available under the following conditions:
            </p>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
              <h3 className="font-maven font-semibold text-green-800 mb-2">Eligible for Full Refund</h3>
              <ul className="list-disc list-inside font-maven text-green-700 space-y-1 ml-4">
                <li>Cancellation request made within 7 days of purchase</li>
                <li>No premium features have been utilized (profile views, contact access, etc.)</li>
                <li>Technical issues on our platform that prevented service delivery</li>
              </ul>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
              <h3 className="font-maven font-semibold text-yellow-800 mb-2">Eligible for Partial Refund (Pro-rated)</h3>
              <ul className="list-disc list-inside font-maven text-yellow-700 space-y-1 ml-4">
                <li>Cancellation request made after 7 days but within 30 days of purchase</li>
                <li>Refund calculated based on unused portion of the membership</li>
                <li>Minimum 50% of the subscription period must remain unused</li>
              </ul>
            </div>
          </section>

          {/* Non-Refundable Items */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">3. Non-Refundable Items</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              The following are not eligible for refund:
            </p>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <ul className="list-disc list-inside font-maven text-red-700 space-y-2 ml-4">
                <li>Membership purchased more than 30 days ago</li>
                <li>Premium features that have been used (contact views, profile boosts, etc.)</li>
                <li>Accounts terminated due to violation of Terms and Conditions</li>
                <li>Accounts found with fraudulent or misleading information</li>
                <li>Processing fees and payment gateway charges</li>
                <li>Promotional or discounted memberships (unless otherwise stated)</li>
              </ul>
            </div>
          </section>

          {/* Refund Process */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">4. Refund Process</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-maven font-semibold text-gray-800 mb-2">How to Request a Refund</h3>
                <ol className="list-decimal list-inside font-maven text-gray-600 space-y-2 ml-4">
                  <li>Send an email to support@sngsmatrimonial.com with subject &quot;Refund Request&quot;</li>
                  <li>Include your registered email address and phone number</li>
                  <li>Provide your transaction ID or payment reference number</li>
                  <li>State the reason for requesting a refund</li>
                  <li>Our team will review your request within 3-5 business days</li>
                </ol>
              </div>
              <div>
                <h3 className="font-maven font-semibold text-gray-800 mb-2">Refund Timeline</h3>
                <p className="font-maven text-gray-600 leading-relaxed">
                  Once your refund request is approved:
                </p>
                <ul className="list-disc list-inside font-maven text-gray-600 mt-2 space-y-1 ml-4">
                  <li><strong>Credit/Debit Card:</strong> 5-7 business days</li>
                  <li><strong>Net Banking:</strong> 5-7 business days</li>
                  <li><strong>UPI:</strong> 3-5 business days</li>
                  <li><strong>Wallet:</strong> 1-3 business days</li>
                </ul>
                <p className="font-maven text-gray-600 leading-relaxed mt-2">
                  Please note that the actual time for the refund to reflect in your account may vary depending on your bank or payment provider.
                </p>
              </div>
            </div>
          </section>

          {/* Refund Method */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">5. Refund Method</h2>
            <p className="font-maven text-gray-600 leading-relaxed">
              All refunds will be processed to the original payment method used for the transaction. We process refunds through Razorpay, our payment gateway partner. If the original payment method is no longer valid or available, please contact our support team to discuss alternative refund arrangements.
            </p>
          </section>

          {/* Partial Refund Calculation */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">6. Partial Refund Calculation</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              For eligible partial refunds, the refund amount is calculated as follows:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg font-maven text-gray-600">
              <p className="font-semibold mb-2">Refund Amount = Total Paid - (Daily Rate × Days Used) - Processing Fee</p>
              <p className="text-sm mt-2">
                <strong>Example:</strong> If you purchased a 90-day plan for ₹3,000 and request cancellation after 30 days:
              </p>
              <ul className="text-sm mt-2 space-y-1 ml-4">
                <li>Daily Rate = ₹3,000 ÷ 90 = ₹33.33/day</li>
                <li>Amount Used = ₹33.33 × 30 = ₹1,000</li>
                <li>Processing Fee = ₹100 (estimated)</li>
                <li>Refund Amount = ₹3,000 - ₹1,000 - ₹100 = ₹1,900</li>
              </ul>
            </div>
          </section>

          {/* Special Circumstances */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">7. Special Circumstances</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              We understand that exceptional circumstances may arise. In the following cases, please contact our support team for consideration:
            </p>
            <ul className="list-disc list-inside font-maven text-gray-600 space-y-2 ml-4">
              <li>Medical emergencies preventing use of the service</li>
              <li>Duplicate or accidental transactions</li>
              <li>Platform downtime or technical issues exceeding 48 hours</li>
              <li>Bereavement or family emergencies</li>
            </ul>
            <p className="font-maven text-gray-600 leading-relaxed mt-3">
              Each case will be reviewed individually, and decisions will be made at our discretion.
            </p>
          </section>

          {/* Contact for Refunds */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">8. Contact Us for Refunds</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              For all cancellation and refund inquiries, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg font-maven text-gray-600">
              <p><strong>SNGS Matrimonial Support Team</strong></p>
              <p>Email: support@sngsmatrimonial.com</p>
              <p>Phone: +91-XXXXXXXXXX</p>
              <p>Support Hours: Monday to Saturday, 9:00 AM to 6:00 PM IST</p>
              <p className="mt-2 text-sm">Please allow 24-48 hours for initial response to all queries.</p>
            </div>
          </section>

          {/* Policy Changes */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">9. Changes to This Policy</h2>
            <p className="font-maven text-gray-600 leading-relaxed">
              We reserve the right to modify this Cancellation and Refund Policy at any time. Changes will be effective upon posting on this page with an updated effective date. We encourage you to review this policy periodically. Continued use of our services after any modifications constitutes acceptance of the revised policy.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-telex text-sm text-gray-500 text-center">
            Last updated: January 2026
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Link href="/privacy-policy" className="font-telex text-sm text-secondary hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="font-telex text-sm text-secondary hover:text-accent transition-colors">
              Terms and Conditions
            </Link>
            <Link href="/shipping-and-delivery" className="font-telex text-sm text-secondary hover:text-accent transition-colors">
              Shipping & Delivery
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
