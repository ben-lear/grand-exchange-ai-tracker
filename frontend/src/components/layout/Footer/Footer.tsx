/**
 * Footer component for the main layout
 */

import { Icon, Link, List, ListItem, Stack, Text } from '@/components/ui';
import { cn } from '@/utils';
import { Github, Heart } from 'lucide-react';
import React from 'react';

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
            <Text as="h3" variant="heading" size="base" className="mb-3">
              About
            </Text>
            <Text variant="muted" size="sm">
              Track Old School RuneScape Grand Exchange prices in real-time.
              Get historical data, price trends, and trading volume for all items.
            </Text>
          </div>

          {/* Links */}
          <div>
            <Text as="h3" variant="heading" size="base" className="mb-3">
              Resources
            </Text>
            <List variant="unstyled" spacing="tight" className="text-sm">
              <ListItem className="text-sm">
                <Link
                  to="https://oldschool.runescape.wiki/"
                  external
                  variant="muted"
                  size="sm"
                >
                  OSRS Wiki
                </Link>
              </ListItem>
              <ListItem className="text-sm">
                <Link
                  to="https://secure.runescape.com/m=itemdb_oldschool/"
                  external
                  variant="muted"
                  size="sm"
                >
                  Official GE Database
                </Link>
              </ListItem>
              <ListItem className="text-sm">
                <Link
                  to={`${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '')}/health`}
                  external
                  variant="muted"
                  size="sm"
                >
                  API Status
                </Link>
              </ListItem>
            </List>
          </div>

          {/* Info */}
          <div>
            <Text as="h3" variant="heading" size="base" className="mb-3">
              Project
            </Text>
            <Stack direction="col" gap={3}>
              <Link
                to="https://github.com/ben-lear/grand-exchange-ai-tracker"
                external
                variant="muted"
                underline="none"
                size="sm"
                className="inline-flex items-center gap-2"
              >
                <Icon as={Github} size="sm" />
                View on GitHub
              </Link>
              <Text variant="muted" size="xs">
                Data updated every minute from OSRS API
              </Text>
            </Stack>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <Text variant="muted" size="sm">
              © {currentYear} OSRS GE Tracker. All rights reserved.
            </Text>
            <Stack direction="row" align="center" gap={1}>
              <Text variant="muted" size="sm">Made with</Text>
              <Icon as={Heart} size="sm" className="text-red-500" />
              <Text variant="muted" size="sm">for the OSRS community</Text>
            </Stack>
          </div>
        </div>
      </div>
    </footer>
  );
};
