/**
 * 404 Not Found page
 */

import { Home } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

/**
 * NotFoundPage component - Displays 404 error
 */
export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-9xl font-bold text-gray-300 dark:text-gray-700 mb-4">
        404
      </div>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Page Not Found
      </h1>

      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Home className="w-5 h-5" />
          Go Home
        </Link>

        <Button
          variant="secondary"
          size="lg"
          onClick={() => window.history.back()}
          className="text-gray-900 dark:text-white"
        >
          Go Back
        </Button>
      </div>
    </div>
  );
};
