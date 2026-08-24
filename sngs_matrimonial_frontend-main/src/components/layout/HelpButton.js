'use client';

import { CircleHelp, Mail, Phone } from 'lucide-react';
import { useContactInfo } from '@/hooks/useContactInfo';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function HelpButton() {
  const { data: contactInfo } = useContactInfo();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors mx-2 lg:mx-6">
          <CircleHelp size={24} className="text-secondary" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] max-w-sm" align="end">
          <div className="space-y-3">
            <h3 className="font-viga text-sm text-secondary mb-3">Contact Us</h3>

            {/* Email */}
            <a
              href={`mailto:${contactInfo?.contactEmail}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail size={18} className="text-primary shrink-0" />
              <span className="font-telex text-sm text-secondary whitespace-nowrap">
                {contactInfo?.contactEmail}
              </span>
            </a>

            {/* Mobile */}
            <a
              href={`tel:+91${contactInfo?.contactMobile}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Phone size={18} className="text-primary shrink-0" />
              <span className="font-telex text-sm text-secondary">
                +91 {contactInfo?.contactMobile}
              </span>
            </a>
          </div>
        </PopoverContent>
      </Popover>
  );
}
