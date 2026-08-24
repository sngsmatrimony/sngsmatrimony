'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Monitor, Zap, Clock, Globe, Shield, Headphones } from 'lucide-react';

export default function ShippingAndDeliveryPage() {
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
          Shipping and Delivery Policy
        </h1>
        <p className="font-telex text-sm text-gray-500 mb-8">
          Effective Date: January 2026
        </p>

        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
              <p className="font-maven text-blue-800 leading-relaxed">
                <strong>Important:</strong> SNGS Matrimonial is a digital platform providing online matrimonial services. We do not sell or ship any physical products. This policy explains how our digital services are delivered to you.
              </p>
            </div>
            <p className="font-maven text-gray-600 leading-relaxed">
              SNGS Matrimonial is an online matrimonial platform that connects individuals seeking life partners. All our services are delivered digitally through our website and mobile-responsive platform. This Shipping and Delivery Policy outlines how you receive and access our services.
            </p>
          </section>

          {/* Nature of Service */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">1. Nature of Our Services</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              SNGS Matrimonial offers the following digital services:
            </p>
            <ul className="list-disc list-inside font-maven text-gray-600 space-y-2 ml-4">
              <li>Profile creation and management</li>
              <li>Profile browsing and search functionality</li>
              <li>Partner matching based on preferences</li>
              <li>Secure messaging between matched profiles</li>
              <li>Contact information sharing (premium feature)</li>
              <li>Profile highlighting and boosting (premium feature)</li>
              <li>Advanced search filters (premium feature)</li>
            </ul>
            <p className="font-maven text-gray-600 leading-relaxed mt-3">
              All these services are accessible online and do not require any physical delivery.
            </p>
          </section>

          {/* Service Delivery */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">2. Service Delivery</h2>

            {/* Service Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-maven font-semibold text-gray-800">Instant Activation</h3>
                </div>
                <p className="font-maven text-sm text-gray-600">
                  Upon successful registration, your account is activated immediately, allowing you to create your profile and browse other profiles.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-maven font-semibold text-gray-800">Digital Access</h3>
                </div>
                <p className="font-maven text-sm text-gray-600">
                  All services are delivered through our secure online platform. No physical shipping is involved in any of our services.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-success" />
                  </div>
                  <h3 className="font-maven font-semibold text-gray-800">24/7 Availability</h3>
                </div>
                <p className="font-maven text-sm text-gray-600">
                  Our platform is available 24 hours a day, 7 days a week. Access your account and use our services anytime, anywhere.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Globe className="w-5 h-5 text-secondary" />
                  </div>
                  <h3 className="font-maven font-semibold text-gray-800">Global Access</h3>
                </div>
                <p className="font-maven text-sm text-gray-600">
                  Access our services from anywhere in the world with an internet connection. No geographical restrictions apply.
                </p>
              </div>
            </div>
          </section>

          {/* Premium Membership Activation */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">3. Premium Membership Activation</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              When you purchase a premium membership:
            </p>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <ul className="font-maven text-green-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">&#10003;</span>
                  <span><strong>Immediate Activation:</strong> Premium features are activated instantly upon successful payment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">&#10003;</span>
                  <span><strong>Email Confirmation:</strong> You will receive a confirmation email with your membership details within minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">&#10003;</span>
                  <span><strong>Dashboard Update:</strong> Your account dashboard will reflect your premium status immediately</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">&#10003;</span>
                  <span><strong>Payment Receipt:</strong> A digital receipt/invoice will be sent to your registered email</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Technical Requirements */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">4. Technical Requirements</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              To access SNGS Matrimonial services, you need:
            </p>
            <ul className="list-disc list-inside font-maven text-gray-600 space-y-2 ml-4">
              <li>A device with internet access (computer, smartphone, or tablet)</li>
              <li>A modern web browser (Chrome, Firefox, Safari, Edge - latest versions recommended)</li>
              <li>Stable internet connection for optimal experience</li>
              <li>JavaScript enabled in your browser</li>
              <li>Cookies enabled for session management</li>
            </ul>
            <p className="font-maven text-gray-600 leading-relaxed mt-3">
              Our platform is optimized for both desktop and mobile devices to ensure a seamless experience across all screen sizes.
            </p>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">5. Service Availability</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              We strive to maintain 99.9% uptime for our platform. However, services may be temporarily unavailable due to:
            </p>
            <ul className="list-disc list-inside font-maven text-gray-600 space-y-2 ml-4">
              <li>Scheduled maintenance (usually during low-traffic hours with prior notice)</li>
              <li>Emergency technical updates</li>
              <li>Circumstances beyond our control (server issues, natural disasters)</li>
            </ul>
            <p className="font-maven text-gray-600 leading-relaxed mt-3">
              In case of any extended downtime, we will notify users via email and extend premium memberships accordingly.
            </p>
          </section>

          {/* No Physical Products */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">6. No Physical Products or Shipping</h2>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="font-maven text-yellow-800 leading-relaxed">
                <strong>Please Note:</strong> SNGS Matrimonial is a purely digital service platform. We do not sell, distribute, or ship any physical products. All services are delivered electronically through our website. Therefore:
              </p>
              <ul className="list-disc list-inside font-maven text-yellow-700 mt-3 space-y-1 ml-4">
                <li>No shipping charges apply</li>
                <li>No delivery address is required for service activation</li>
                <li>No courier or postal services are involved</li>
                <li>No tracking numbers are provided (as there is nothing to track)</li>
              </ul>
            </div>
          </section>

          {/* Support */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">7. Customer Support</h2>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Headphones className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-maven text-gray-600 leading-relaxed">
                  If you experience any issues accessing our services or activating your membership, our support team is here to help. We aim to resolve all technical issues within 24 hours.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg font-maven text-gray-600">
              <p><strong>SNGS Matrimonial Support Team</strong></p>
              <p>Email: support@sngsmatrimonial.com</p>
              <p>Phone: +91-XXXXXXXXXX</p>
              <p>Support Hours: Monday to Saturday, 9:00 AM to 6:00 PM IST</p>
            </div>
          </section>

          {/* Security */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">8. Secure Service Delivery</h2>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="font-maven text-gray-600 leading-relaxed">
                  All our services are delivered through a secure, encrypted connection (HTTPS). Your personal information and communications on our platform are protected using industry-standard security measures. Payment processing is handled securely through Razorpay, our PCI-DSS compliant payment partner.
                </p>
              </div>
            </div>
          </section>

          {/* Policy Changes */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">9. Changes to This Policy</h2>
            <p className="font-maven text-gray-600 leading-relaxed">
              We reserve the right to modify this Shipping and Delivery Policy at any time. Any changes will be posted on this page with an updated effective date. We encourage you to review this policy periodically to stay informed about how we deliver our services.
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
            <Link href="/cancellation-and-refund" className="font-telex text-sm text-secondary hover:text-accent transition-colors">
              Cancellation & Refund
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
