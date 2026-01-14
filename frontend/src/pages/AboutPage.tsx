import { Link } from 'react-router-dom';
import { Button } from '../components/UI';

export const AboutPage = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
        <h1 className="text-4xl font-bold text-osrs-gold mb-4">
          About OSRS GE Tracker
        </h1>
        <p className="text-xl text-gray-300">
          Your comprehensive price tracking and market analysis tool for Old School RuneScape
        </p>
      </div>

      {/* What is this? */}
      <section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-osrs-gold mb-4">What is this?</h2>
        <p className="text-gray-300 mb-4">
          OSRS GE Tracker is a full-stack web application that tracks and visualizes Old School RuneScape 
          Grand Exchange item prices and trends. Built with modern technologies, it provides real-time 
          price updates, historical data analysis, and interactive charts to help players make informed 
          trading decisions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-900/50 rounded p-4">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold text-white mb-1">Real-time Data</h3>
            <p className="text-sm text-gray-400">Track prices with regular updates from the OSRS API</p>
          </div>
          <div className="bg-gray-900/50 rounded p-4">
            <div className="text-3xl mb-2">📈</div>
            <h3 className="font-bold text-white mb-1">Historical Charts</h3>
            <p className="text-sm text-gray-400">View up to 180 days of price history</p>
          </div>
          <div className="bg-gray-900/50 rounded p-4">
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="font-bold text-white mb-1">Watchlists</h3>
            <p className="text-sm text-gray-400">Track your favorite items and monitor trends</p>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-osrs-gold mb-4">Technology Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Backend</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-osrs-gold">•</span>
                <strong>Go 1.22+</strong> - High-performance backend
              </li>
              <li className="flex items-center gap-2">
                <span className="text-osrs-gold">•</span>
                <strong>Fiber</strong> - Fast HTTP framework
              </li>
              <li className="flex items-center gap-2">
                <span className="text-osrs-gold">•</span>
                <strong>PostgreSQL</strong> - Reliable data storage
              </li>
              <li className="flex items-center gap-2">
                <span className="text-osrs-gold">•</span>
                <strong>Redis</strong> - Fast caching layer
              </li>
              <li className="flex items-center gap-2">
                <span className="text-osrs-gold">•</span>
                <strong>GORM</strong> - ORM for database operations
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Frontend</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-osrs-gold">•</span>
                <strong>React 18</strong> - Modern UI library
              </li>
              <li className="flex items-center gap-2">
                <span className="text-osrs-gold">•</span>
                <strong>TypeScript</strong> - Type-safe development
              </li>
              <li className="flex items-center gap-2">
                <span className="text-osrs-gold">•</span>
                <strong>TailwindCSS</strong> - Utility-first styling
              </li>
              <li className="flex items-center gap-2">
                <span className="text-osrs-gold">•</span>
                <strong>TanStack Query</strong> - Server state management
              </li>
              <li className="flex items-center gap-2">
                <span className="text-osrs-gold">•</span>
                <strong>Recharts</strong> - Beautiful data visualization
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-osrs-gold mb-4">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <h4 className="font-bold text-white">Comprehensive Item Database</h4>
              <p className="text-sm text-gray-400">Browse 2,000+ OSRS Grand Exchange items</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <h4 className="font-bold text-white">Price History Charts</h4>
              <p className="text-sm text-gray-400">Interactive charts with multiple time ranges</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <h4 className="font-bold text-white">Trending Analysis</h4>
              <p className="text-sm text-gray-400">See what items are currently popular</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <h4 className="font-bold text-white">Custom Watchlists</h4>
              <p className="text-sm text-gray-400">Track your favorite items locally</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <h4 className="font-bold text-white">Price Gainers/Losers</h4>
              <p className="text-sm text-gray-400">Identify market movers quickly</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <h4 className="font-bold text-white">Search & Filters</h4>
              <p className="text-sm text-gray-400">Find items by name, type, or status</p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Source */}
      <section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-osrs-gold mb-4">Data Source</h2>
        <p className="text-gray-300 mb-4">
          All price data is sourced directly from the official{' '}
          <a
            href="https://secure.runescape.com/m=itemdb_oldschool/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-osrs-gold hover:underline"
          >
            Old School RuneScape Grand Exchange API
          </a>
          . Data is automatically synced at regular intervals to ensure accuracy.
        </p>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4">
          <h3 className="font-bold text-blue-400 mb-2">Update Schedule</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Popular items: Every 5 minutes</li>
            <li>• All items: Hourly</li>
            <li>• Item catalog: Daily</li>
            <li>• Price trends: Every 15 minutes</li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-osrs-gold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-white mb-2">Is this official?</h3>
            <p className="text-gray-300 text-sm">
              No, this is a fan-made project. It uses publicly available data from the official OSRS API.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-white mb-2">How accurate are the prices?</h3>
            <p className="text-gray-300 text-sm">
              Prices are as accurate as the official OSRS Grand Exchange API. Data is cached for performance 
              but updated regularly.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-white mb-2">Can I use this for trading?</h3>
            <p className="text-gray-300 text-sm">
              Absolutely! The tracker is designed to help players make informed trading decisions by providing 
              historical data and trend analysis.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-white mb-2">Is my watchlist saved?</h3>
            <p className="text-gray-300 text-sm">
              Yes, your watchlist is stored locally in your browser using localStorage. It persists across 
              sessions but is device-specific.
            </p>
          </div>
        </div>
      </section>

      {/* Links */}
      <section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-osrs-gold mb-4">Useful Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://oldschool.runescape.wiki"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-gray-900/50 rounded hover:bg-gray-900 transition-colors"
          >
            <span className="text-2xl">📚</span>
            <div>
              <h4 className="font-bold text-white">OSRS Wiki</h4>
              <p className="text-sm text-gray-400">Comprehensive game information</p>
            </div>
          </a>
          <a
            href="https://secure.runescape.com/m=itemdb_oldschool/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-gray-900/50 rounded hover:bg-gray-900 transition-colors"
          >
            <span className="text-2xl">📊</span>
            <div>
              <h4 className="font-bold text-white">Official GE</h4>
              <p className="text-sm text-gray-400">Official Grand Exchange database</p>
            </div>
          </a>
          <a
            href="https://oldschool.runescape.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-gray-900/50 rounded hover:bg-gray-900 transition-colors"
          >
            <span className="text-2xl">🎮</span>
            <div>
              <h4 className="font-bold text-white">Play OSRS</h4>
              <p className="text-sm text-gray-400">Old School RuneScape homepage</p>
            </div>
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-gray-900/50 rounded hover:bg-gray-900 transition-colors"
          >
            <span className="text-2xl">💻</span>
            <div>
              <h4 className="font-bold text-white">Source Code</h4>
              <p className="text-sm text-gray-400">View project on GitHub</p>
            </div>
          </a>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to start tracking?</h2>
        <div className="flex gap-4 justify-center">
          <Link to="/items">
            <Button variant="primary" size="lg">
              Browse Items
            </Button>
          </Link>
          <Link to="/trending">
            <Button variant="outline" size="lg">
              View Trending
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
