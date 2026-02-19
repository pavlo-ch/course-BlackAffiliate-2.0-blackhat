'use client';

import { Linkedin, Instagram, Send, Mail, Phone, ExternalLink } from 'lucide-react';

export default function Footer() {
  const socialLinks = [
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/advantage-agencyuk/posts/?feedView=all',
      icon: <Linkedin className="w-5 h-5" />
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/_advantage_agency_/',
      icon: <Instagram className="w-5 h-5" />
    },
    {
      name: 'Telegram',
      url: 'https://t.me/stepan_potichnyi',
      icon: <Send className="w-5 h-5" />
    }
  ];

  const quickLinks = [
    {
      name: 'Blog',
      url: 'https://www.advantage-agency.co/blog'
    },
  ];

  return (
    <footer className="bg-[#0f1012] text-white mt-auto relative">
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 -ml-2">
              <img src="/img/logo.webp" width={120} alt="BlackAffiliate 2.0" />
            </div>
            <p className="text-gray-400 text-sm">
              Master the art of affiliate marketing with our comprehensive Master the art of affiliate marketing with our comprehensive training program
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Follow Us</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary transition-colors"
                  title={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <div className="grid grid-cols-1 gap-2">
              {quickLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-gray-400 hover:text-primary transition-colors text-sm"
                >
                  <span>{link.name}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} BlackAffiliate 2.0. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm">
              Powered by <a href='https://www.advantage-agency.co/media-buying-2' rel='noopener noreferrer' target='_blank' className='underline text-[#d12923]'>Advantage</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}