/**
 * Footer component for the main layout
 */

import React from 'react';
import { Github, Heart } from 'lucide-react';
import { cn } from '../../utils';

export interface FooterProps {
  className?: string;
}

/**
 * Footer component with links and information
 */
export const Footer: React.FC<FooterProps> = ({ className }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
        className
      )}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              About
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track Old School RuneScape Grand Exchange prices in real-time.
              Get historical data, price trends, and trading volume for all items.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://oldschool.runescape.wiki/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  OSRS Wiki
                </a>
              </li>
              <li>
                <a
                  href="https://secure.runescape.com/m=itemdb_oldschool/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Official GE Database
                </a>
              </li>
              <li>
                <a
                  href="/api/health"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  API Status
                </a>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Project
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Data updated every minute from OSRS API
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              © {currentYear} OSRS GE Tracker. All rights reserved.
            </p>
            <p className="flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500" /> for the OSRS community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
