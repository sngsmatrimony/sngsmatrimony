'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="font-telex text-sm text-gray-500 mb-8">
          Effective Date: January 2026
        </p>

        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <p className="font-maven text-gray-600 leading-relaxed">
              At SNGS Matrimonial, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our matrimonial platform and services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">1. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-maven font-semibold text-gray-800 mb-2">Personal Information</h3>
                <p className="font-maven text-gray-600 leading-relaxed">
                  When you register on SNGS Matrimonial, we collect personal information including but not limited to:
                </p>
                <ul className="list-disc list-inside font-maven text-gray-600 mt-2 space-y-1 ml-4">
                  <li>Full name, date of birth, and gender</li>
                  <li>Contact information (email address, phone number)</li>
                  <li>Physical address and location details</li>
                  <li>Educational qualifications and occupation</li>
                  <li>Religious and community background</li>
                  <li>Family details and preferences</li>
                  <li>Photographs and profile images</li>
                </ul>
              </div>
              <div>
                <h3 className="font-maven font-semibold text-gray-800 mb-2">Payment Information</h3>
                <p className="font-maven text-gray-600 leading-relaxed">
                  When you purchase a membership plan, we collect payment-related information. Please note that all payment transactions are processed through Razorpay, our trusted payment gateway partner. We do not store your complete credit/debit card details on our servers. Razorpay handles all payment data in compliance with PCI-DSS standards.
                </p>
              </div>
              <div>
                <h3 className="font-maven font-semibold text-gray-800 mb-2">Usage Information</h3>
                <p className="font-maven text-gray-600 leading-relaxed">
                  We automatically collect certain information when you access our platform, including IP address, browser type, device information, pages viewed, and interaction data to improve our services.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">2. How We Use Your Information</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside font-maven text-gray-600 space-y-2 ml-4">
              <li>To create and manage your matrimonial profile</li>
              <li>To match you with compatible profiles based on your preferences</li>
              <li>To facilitate communication between members</li>
              <li>To process membership payments and subscriptions</li>
              <li>To send important notifications about your account and matches</li>
              <li>To improve our platform and services</li>
              <li>To prevent fraud and ensure platform security</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          {/* Data Protection & Security */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">3. Data Protection & Security</h2>
            <p className="font-maven text-gray-600 leading-relaxed">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="list-disc list-inside font-maven text-gray-600 mt-3 space-y-2 ml-4">
              <li>SSL/TLS encryption for all data transmission</li>
              <li>Secure encrypted storage of personal data</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Employee training on data protection practices</li>
            </ul>
          </section>

          {/* Payment Information Security */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">4. Payment Information Security</h2>
            <p className="font-maven text-gray-600 leading-relaxed">
              All payment transactions on SNGS Matrimonial are processed through Razorpay, a PCI-DSS compliant payment gateway. Your payment card details are encrypted and processed directly by Razorpay. We only receive transaction confirmation and basic payment details (last 4 digits of card, transaction ID) for our records. We never have access to your complete card information.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">5. Third-Party Services</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              We may share your information with trusted third-party service providers who assist us in operating our platform:
            </p>
            <ul className="list-disc list-inside font-maven text-gray-600 space-y-2 ml-4">
              <li><strong>Razorpay:</strong> For secure payment processing</li>
              <li><strong>Cloud Service Providers:</strong> For secure data hosting and storage</li>
              <li><strong>Analytics Services:</strong> To understand platform usage and improve services</li>
              <li><strong>Communication Services:</strong> For sending emails and notifications</li>
            </ul>
            <p className="font-maven text-gray-600 leading-relaxed mt-3">
              All third-party service providers are contractually bound to protect your data and use it only for specified purposes.
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">6. Your Rights</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              As a user of SNGS Matrimonial, you have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside font-maven text-gray-600 space-y-2 ml-4">
              <li><strong>Access:</strong> Request access to your personal data we hold</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Restriction:</strong> Request limitation of data processing in certain circumstances</li>
            </ul>
            <p className="font-maven text-gray-600 leading-relaxed mt-3">
              To exercise any of these rights, please contact us using the details provided below.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="font-maven text-gray-600 leading-relaxed">
              SNGS Matrimonial uses cookies and similar tracking technologies to enhance your experience on our platform. Cookies help us remember your preferences, maintain your login session, and analyze platform usage. You can manage cookie preferences through your browser settings. Please note that disabling certain cookies may affect the functionality of our services.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">8. Data Retention</h2>
            <p className="font-maven text-gray-600 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you services. If you request account deletion, we will delete your personal data within 30 days, except where we are required to retain certain information for legal, regulatory, or legitimate business purposes.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">9. Changes to This Privacy Policy</h2>
            <p className="font-maven text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, regulatory, or operational reasons. We will notify you of any material changes by posting the updated policy on this page with a new effective date. We encourage you to review this policy periodically.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">10. Contact Us</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg font-maven text-gray-600">
              <p><strong>SNGS Matrimonial</strong></p>
              <p>Email: support@sngsmatrimonial.com</p>
              <p>Phone: +91-XXXXXXXXXX</p>
              <p>Address: [Your Business Address]</p>
            </div>
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
            <Link href="/terms-and-conditions" className="font-telex text-sm text-secondary hover:text-accent transition-colors">
              Terms and Conditions
            </Link>
            <Link href="/cancellation-and-refund" className="font-telex text-sm text-secondary hover:text-accent transition-colors">
              Cancellation & Refund
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
