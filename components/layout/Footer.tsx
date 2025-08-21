import React from 'react';
import { FaBlog, FaBook, FaGithub, FaTelegramPlane, FaTwitter } from 'react-icons/fa';

const Footer: React.FC = () => {
  const socialLinks = [
    {
      name: 'X (Twitter)',
      icon: FaTwitter,
      url: 'https://x.com/AdamantFi',
      color: 'hover:text-blue-400',
    },
    {
      name: 'Telegram',
      icon: FaTelegramPlane,
      url: 'https://t.me/adamant_fi',
      color: 'hover:text-blue-500',
    },
    {
      name: 'GitHub',
      icon: FaGithub,
      url: 'https://github.com/AdamantFi',
      color: 'hover:text-gray-300',
    },
    {
      name: 'Blog',
      icon: FaBlog,
      url: 'https://x.com/AdamantFi/articles',
      color: 'hover:text-green-400',
    },
    {
      name: 'Documentation',
      icon: FaBook,
      url: 'https://adamantfi.gitbook.io/adamantfi/',
      color: 'hover:text-yellow-400',
    },
  ];

  return (
    <footer className="w-full border-t border-adamant-box-border/30 bg-adamant-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Social Links */}
          <div className="flex items-center space-x-6">
            {socialLinks.map((social) => {
              const IconComponent = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-adamant-text-box-secondary/60 ${social.color} transition-colors duration-200 hover:scale-110 transform`}
                  aria-label={social.name}
                >
                  <IconComponent className="w-5 h-5" />
                </a>
              );
            })}
          </div>

          {/* Copyright and Project Info */}
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="text-adamant-text-box-secondary/50 text-sm">
              <span className="font-medium text-adamant-accentText/70">AdamantFi</span>
              <span className="mx-2">•</span>
              <span>Decentralized Finance on Secret Network</span>
            </div>
            <div className="text-adamant-text-box-secondary/40 text-xs">
              © {new Date().getFullYear()} AdamantFi. Built with privacy in mind.
            </div>
          </div>

          {/* Additional Links */}
          <div className="flex items-center space-x-4 text-xs">
            <a
              href="/privacy"
              className="text-adamant-text-box-secondary/50 hover:text-adamant-accentText/70 transition-colors duration-200"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
