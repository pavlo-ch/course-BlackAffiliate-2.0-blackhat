'use client';

import { useState } from 'react';
import { Tool, ToolType } from '../types/tools';
import { ChevronDown, ChevronUp, ExternalLink, Lightbulb, Users, Building2, Wifi, CreditCard, Eye, BarChart3, Server, Search, Phone, Smartphone, Send, Palette } from 'lucide-react';

interface ToolsSectionsProps {
  tools: Tool[];
}

interface Section {
  id: string;
  title: string;
  description: string;
  proTip: string;
  type: ToolType;
  tools: Tool[];
}

export default function ToolsSections({ tools }: ToolsSectionsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'fb_accounts': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'agency_accounts': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'proxy_providers': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'antidetect_browsers': 'bg-red-500/20 text-red-400 border-red-500/30',
      'payment_methods': 'bg-green-500/10 text-green-400 border-green-500/20',
      'tracking': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'spy_tools': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'virtual_numbers': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'pwa_services': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      'hosting': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      'creative_agencies': 'bg-violet-500/20 text-violet-400 border-violet-500/30'
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'fb_accounts': <Users className="w-6 h-6" />,
      'agency_accounts': <Building2 className="w-6 h-6" />,
      'proxy_providers': <Wifi className="w-6 h-6" />,
      'antidetect_browsers': <Eye className="w-6 h-6" />,
      'payment_methods': <CreditCard className="w-6 h-6" />,
      'tracking': <BarChart3 className="w-6 h-6" />,
      'spy_tools': <Search className="w-6 h-6" />,
      'virtual_numbers': <Phone className="w-6 h-6" />,
      'pwa_services': <Smartphone className="w-6 h-6" />,
      'hosting': <Server className="w-6 h-6" />,
      'creative_agencies': <Palette className="w-6 h-6" />
    };
    return icons[type] || <Users className="w-6 h-6" />;
  };

  const renderProTip = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const getTelegramLink = (contact: string) => {
    if (contact.startsWith('@')) {
      return `https://t.me/${contact.substring(1)}`;
    }
    if (contact.startsWith('https://t.me/')) {
      return contact;
    }
    if (contact.startsWith('http://t.me/')) {
      return contact;
    }
    return null;
  };

  const isTelegramContact = (contact: string) => {
    return contact.startsWith('@') || contact.includes('t.me/');
  };

  const sections: Section[] = [
    {
      id: 'fb_accounts',
      title: 'Facebook Accounts',
      description: 'Running successful Facebook ad campaigns often requires access to fresh, high-quality accounts, PZRD/Farm/King accounts, Business Managers, or Fan Pages. Here are trusted marketplaces to acquire them:',
      proTip: 'After purchasing, verify account quality using  https://check.fb.tools/',
      type: 'fb_accounts',
      tools: tools.filter(s => s.type === 'fb_accounts')
    },
    {
      id: 'agency_accounts',
      title: 'Agency Accounts',
      description: 'Agency accounts have become a game-changer for arbitrage professionals, offering greater trust and stability compared to standard auto-registered(autoreg) accounts. These accounts allow you to spend higher budgets right away and perform better during Facebook\'s moderation "storms."',
      proTip: 'Contact these providers directly via Telegram to discuss pricing, availability, and replacement policies.',
      type: 'agency_accounts',
      tools: tools.filter(s => s.type === 'agency_accounts')
    },
    {
      id: 'proxy_providers',
      title: 'Mobile Proxies',
      description: 'Mobile proxies are essential for managing multiple accounts and bypassing platform restrictions. They provide dynamic IP rotation to keep your campaigns safe from bans.',
      proTip: 'Mobile proxies are crucial for account safety. Always use residential or mobile IPs for better success rates.',
      type: 'proxy_providers',
      tools: tools.filter(s => s.type === 'proxy_providers')
    },
    {
      id: 'payment_methods',
      title: 'Virtual Cards',
      description: 'Funding your ad campaigns requires secure, flexible payment methods. These virtual card providers offer solutions tailored for affiliate marketers:',
      proTip: 'Always have backup payment methods ready. Some providers offer better rates with promo codes - check for available discounts.',
      type: 'payment_methods',
      tools: tools.filter(s => s.type === 'payment_methods')
    },
    {
      id: 'antidetect_browsers',
      title: 'Anti-Detection Browsers',
      description: 'Anti-detection browsers help you manage multiple accounts without triggering platform bans by masking your digital footprint.',
      proTip: 'Start with free options like Dolphin Anty to test the waters. Advanced users can upgrade to professional solutions.',
      type: 'antidetect_browsers',
      tools: tools.filter(s => s.type === 'antidetect_browsers')
    },
    {
      id: 'tracking',
      title: 'Tracking Solutions',
      description: 'Tracking is the backbone of traffic arbitrage. A reliable tracker ensures you monitor clicks, conversions, and ROI accurately.',
      proTip: 'Self-hosted trackers give you full control and better data privacy. Consider hosting costs when budgeting.',
      type: 'tracking',
      tools: tools.filter(s => s.type === 'tracking' as ToolType)
    },
    {
      id: 'hosting',
      title: 'Hosting Services',
      description: 'Reliable hosting is essential for self-hosted trackers to ensure fast performance and uptime.',
      proTip: 'Choose hosting providers that specialize in tracker hosting for optimal performance and support.',
      type: 'hosting',
      tools: tools.filter(s => s.type === 'hosting' as ToolType)
    },
    {
      id: 'spy_tools',
      title: 'Spy Tools',
      description: 'Spy tools let you analyze competitors\' ads and creatives, giving you an edge in crafting high-performing campaigns.',
      proTip: 'Start with free tools like Facebook Ads Library. Paid tools offer more detailed insights and competitor data.',
      type: 'spy_tools',
      tools: tools.filter(s => s.type === 'spy_tools' as ToolType)
    },
    {
      id: 'virtual_numbers',
      title: 'Virtual Numbers',
      description: 'Virtual numbers are crucial for creating and verifying accounts on ad platforms and affiliate networks.',
      proTip: 'Use virtual numbers from the same country as your target audience for better verification success rates.',
      type: 'virtual_numbers',
      tools: tools.filter(s => s.type === 'virtual_numbers' as ToolType)
    },
    {
      id: 'pwa_services',
      title: 'PWA Services',
      description: 'Progressive Web Apps (PWAs) are a powerful tool for driving iGaming traffic, offering a mobile-friendly, app-like experience without the need for traditional app store submissions.',
      proTip: 'PWAs provide advanced customization options and built-in cloaking features. They pass moderation more easily than standard apps.',
      type: 'pwa_services',
      tools: tools.filter(s => s.type === 'pwa_services' as ToolType)
    },
    {
      id: 'creative_agencies',
      title: 'Creative Services',
      description: 'Don\'t want to do it solo? Hit up agencies for creative production.',
      proTip: 'Sources: https://t.me/creotivs — grab ready-to-go creative assets',
      type: 'creative_agencies',
      tools: tools.filter(s => s.type === 'creative_agencies' as ToolType)
    },
    {
      id: 'prelanding_templates',
      title: 'Pre-landing Templates',
      description: 'Ready-to-use pre-landing page templates for both Nutra and Gambling verticals. Includes various designs and interactive elements.',
      proTip: 'These templates are ready to be uploaded to your hosting. For Nutra, make sure to adjust the local language and currencies.',
      type: 'creative_agencies',
      tools: tools.filter(s => s.category === 'Pre-landing Templates')
    }
  ];

  return (
    <div className="w-full space-y-4">
      {sections.map((section) => (
        <div key={section.id} className="bg-[#0f1012] rounded-lg border border-gray-800 overflow-hidden">
          {/* Section Header */}
          <div 
            className="p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
            onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(section.type).split(' ')[0]} border`}>
                  {getTypeIcon(section.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {expandedSection === section.id ? (
                  <ChevronUp className="w-5 h-5 text-green-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Section Content */}
          {expandedSection === section.id && (
            <div className="border-t border-gray-800">
              <div className="p-6 space-y-6">
                {/* Section Description and Pro Tip */}
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm leading-relaxed">{section.description}</p>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-green-400 font-semibold text-sm mb-1">Pro Tip</h4>
                        <p className="text-green-300 text-sm">{renderProTip(section.proTip)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.tools.map((tool) => (
                    <div key={tool.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-semibold">{tool.name}</h4>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="flex items-center gap-3">
                        {tool.website && (
                          <div className="flex items-center gap-1">
                            {isTelegramContact(tool.website) ? (
                              <Send className="w-3 h-3 text-green-500" />
                            ) : (
                              <ExternalLink className="w-3 h-3 text-green-500" />
                            )}
                            {isTelegramContact(tool.website) ? (
                              <a 
                                href={getTelegramLink(tool.website) || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-500 hover:text-green-400 text-xs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {tool.website}
                              </a>
                            ) : (
                            <a 
                                href={tool.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-500 hover:text-green-400 text-xs"
                                onClick={(e) => e.stopPropagation()}
                                download={tool.website.startsWith('/')}
                              >
                                {tool.website.startsWith('/') ? 'Download File' : 
                                 tool.website.includes('drive.google.com') ? 'Google Drive Folder' : 
                                 tool.website}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
