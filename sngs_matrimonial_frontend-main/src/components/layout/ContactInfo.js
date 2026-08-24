'use client';

import { Mail, Phone } from 'lucide-react';
import { useContactInfo } from '@/hooks/useContactInfo';

export default function ContactInfo({ className = '' }) {
  const { data: contactInfo, isLoading } = useContactInfo();

  if (isLoading) {
    return (
      <div className={`hidden lg:flex items-center gap-4 ${className}`}>
        <div className="h-5 w-32 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-5 w-32 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className={`hidden lg:flex items-center gap-6 ${className}`}>
      {/* Email */}
      <a
        href={`mailto:${contactInfo?.contactEmail}`}
        className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-telex text-sm"
      >
        <Mail size={18} className="text-primary" />
        <span>{contactInfo?.contactEmail}</span>
      </a>

      {/* Mobile */}
      <a
        href={`tel:+91${contactInfo?.contactMobile}`}
        className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-telex text-sm"
      >
        <Phone size={18} className="text-primary" />
        <span>+91 {contactInfo?.contactMobile}</span>
      </a>
    </div>
  );
}
