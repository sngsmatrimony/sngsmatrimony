'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsAndConditionsPage() {
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
          Terms and Conditions
        </h1>
        <p className="font-telex text-sm text-gray-500 mb-8">
          Effective Date: January 2026
        </p>

        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <p className="font-maven text-gray-600 leading-relaxed">
              Welcome to SNGS Matrimonial. These Terms and Conditions govern your use of our matrimonial platform and services. By accessing or using SNGS Matrimonial, you agree to be bound by these terms. Please read them carefully before using our services.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">1. Acceptance of Terms</h2>
            <p className="font-maven text-gray-600 leading-relaxed">
              By creating an account, accessing, or using SNGS Matrimonial, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, along with our Privacy Policy. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">2. Eligibility</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              To use SNGS Matrimonial, you must meet the following eligibility requirements:
            </p>
            <ul className="list-disc list-inside font-maven text-gray-600 space-y-2 ml-4">
              <li>You must be at least 18 years of age</li>
              <li>You must be legally eligible to marry under the laws of India</li>
              <li>You must be unmarried, divorced, or widowed at the time of registration</li>
              <li>You must have the legal capacity to enter into a binding agreement</li>
              <li>You must not be prohibited by law from using matrimonial services</li>
            </ul>
            <p className="font-maven text-gray-600 leading-relaxed mt-3">
              By registering, you confirm that you meet all these eligibility requirements.
            </p>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">3. Account Registration & Verification</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              When creating an account on SNGS Matrimonial:
            </p>
            <ul className="list-disc list-inside font-maven text-gray-600 space-y-2 ml-4">
              <li>You must provide accurate, current, and complete information</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials</li>
              <li>You must not create multiple accounts or share your account with others</li>
              <li>You must notify us immediately of any unauthorized access to your account</li>
              <li>We reserve the right to verify your identity and information provided</li>
              <li>We may suspend or terminate accounts with false or misleading information</li>
            </ul>
          </section>

          {/* Membership Plans & Payments */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">4. Membership Plans & Payments</h2>
            <div className="space-y-4">
              <p className="font-maven text-gray-600 leading-relaxed">
                SNGS Matrimonial offers both free and premium membership plans. Premium plans provide additional features and enhanced services.
              </p>
              <div>
                <h3 className="font-maven font-semibold text-gray-800 mb-2">Payment Terms:</h3>
                <ul className="list-disc list-inside font-maven text-gray-600 space-y-2 ml-4">
                  <li>All payments are processed securely through Razorpay</li>
                  <li>Membership fees are charged upfront for the selected duration</li>
                  <li>Prices are displayed in Indian Rupees (INR) and include applicable taxes</li>
                  <li>We reserve the right to modify pricing with prior notice</li>
                  <li>Payment confirmation will be sent to your registered email</li>
                </ul>
              </div>
              <div>
                <h3 className="font-maven font-semibold text-gray-800 mb-2">Auto-Renewal:</h3>
                <p className="font-maven text-gray-600 leading-relaxed">
                  Membership plans do not auto-renew. You will need to manually purchase a new plan upon expiration to continue enjoying premium features.
                </p>
              </div>
            </div>
          </section>

          {/* User Conduct */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">5. User Conduct & Prohibited Activities</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              As a user of SNGS Matrimonial, you agree not to:
            </p>
            <ul className="list-disc list-inside font-maven text-gray-600 space-y-2 ml-4">
              <li>Provide false, misleading, or fraudulent information</li>
              <li>Impersonate any person or entity</li>
              <li>Harass, abuse, threaten, or intimidate other users</li>
              <li>Send spam, promotional content, or unsolicited messages</li>
              <li>Upload inappropriate, offensive, or illegal content</li>
              <li>Attempt to hack, scrape, or interfere with the platform&apos;s operation</li>
              <li>Use the platform for any illegal or unauthorized purpose</li>
              <li>Share contact information publicly before establishing trust</li>
              <li>Solicit money or financial assistance from other users</li>
              <li>Create profiles for commercial or non-matrimonial purposes</li>
            </ul>
          </section>

          {/* Content Guidelines */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">6. Content Guidelines</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              All content you upload or share on SNGS Matrimonial must comply with these guidelines:
            </p>
            <ul className="list-disc list-inside font-maven text-gray-600 space-y-2 ml-4">
              <li>Profile photos must be recent, clear, and show your face</li>
              <li>Photos must not contain nudity, violence, or inappropriate content</li>
              <li>Profile descriptions must be truthful and respectful</li>
              <li>You must have rights to any content you upload</li>
              <li>Content must not infringe on any third-party rights</li>
            </ul>
            <p className="font-maven text-gray-600 leading-relaxed mt-3">
              We reserve the right to remove any content that violates these guidelines without prior notice.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">7. Intellectual Property</h2>
            <p className="font-maven text-gray-600 leading-relaxed">
              All content, features, and functionality of SNGS Matrimonial, including but not limited to text, graphics, logos, icons, images, and software, are the exclusive property of SNGS Matrimonial and are protected by Indian and international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our prior written consent.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">8. Limitation of Liability</h2>
            <div className="space-y-3">
              <p className="font-maven text-gray-600 leading-relaxed">
                SNGS Matrimonial provides a platform to connect individuals for matrimonial purposes. We do not:
              </p>
              <ul className="list-disc list-inside font-maven text-gray-600 space-y-2 ml-4">
                <li>Guarantee the accuracy of user-provided information</li>
                <li>Verify the background or intentions of all users</li>
                <li>Guarantee successful matches or marriages</li>
                <li>Take responsibility for user interactions outside our platform</li>
              </ul>
              <p className="font-maven text-gray-600 leading-relaxed">
                To the maximum extent permitted by law, SNGS Matrimonial shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">9. Termination</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              We reserve the right to suspend or terminate your account at our discretion if:
            </p>
            <ul className="list-disc list-inside font-maven text-gray-600 space-y-2 ml-4">
              <li>You violate these Terms and Conditions</li>
              <li>You engage in fraudulent or illegal activities</li>
              <li>You provide false or misleading information</li>
              <li>Multiple complaints are received against your profile</li>
              <li>Required by law or legal process</li>
            </ul>
            <p className="font-maven text-gray-600 leading-relaxed mt-3">
              You may also terminate your account at any time by contacting our support team. Please refer to our Cancellation and Refund Policy for refund eligibility.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">10. Governing Law</h2>
            <p className="font-maven text-gray-600 leading-relaxed">
              These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising from or relating to these terms or your use of SNGS Matrimonial shall be subject to the exclusive jurisdiction of the courts in [Your City], India.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">11. Dispute Resolution</h2>
            <p className="font-maven text-gray-600 leading-relaxed">
              In the event of any dispute, claim, or controversy arising out of or relating to these terms, we encourage you to first contact us to seek a resolution. If the dispute cannot be resolved amicably within 30 days, either party may pursue legal remedies through the appropriate courts as specified in the Governing Law section.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">12. Changes to Terms</h2>
            <p className="font-maven text-gray-600 leading-relaxed">
              We reserve the right to modify these Terms and Conditions at any time. Changes will be effective upon posting on this page with an updated effective date. Your continued use of SNGS Matrimonial after any changes constitutes acceptance of the modified terms. We encourage you to review these terms periodically.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="font-viga text-xl text-secondary mb-4">13. Contact Us</h2>
            <p className="font-maven text-gray-600 leading-relaxed mb-3">
              If you have any questions or concerns about these Terms and Conditions, please contact us at:
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
            <Link href="/privacy-policy" className="font-telex text-sm text-secondary hover:text-accent transition-colors">
              Privacy Policy
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
