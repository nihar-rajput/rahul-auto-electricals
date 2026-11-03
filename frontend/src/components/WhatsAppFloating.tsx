import React from 'react';
import { MessageCircle } from 'lucide-react';
import { WebsiteSettings } from '../types';

interface WhatsAppFloatingProps {
  settings?: WebsiteSettings | null;
}

export const WhatsAppFloating: React.FC<WhatsAppFloatingProps> = ({ settings }) => {
  const rawNumber = settings?.whatsapp_number || '+919876543210';
  const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
  const defaultText = encodeURIComponent(
    'Hello Rahul Auto Electricals, I am looking for a battery for my vehicle. Please share details and pricing.'
  );

  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${defaultText}`;

  return (
    <aside aria-label="WhatsApp Assistance" className="fixed bottom-6 right-6 z-40">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#20bd5a] hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        aria-label="Chat on WhatsApp with Rahul Auto Electricals"
      >
        <MessageCircle className="w-6 h-6 fill-white stroke-none" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-medium text-sm">
          Chat on WhatsApp
        </span>
      </a>
    </aside>
  );
};

