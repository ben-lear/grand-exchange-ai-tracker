import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="text-2xl font-bold text-osrs-gold">
              OSRS GE Tracker
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className="text-gray-300 hover:text-osrs-gold transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/items" 
              className="text-gray-300 hover:text-osrs-gold transition-colors"
            >
              Items
            </Link>
            <Link 
              to="/trending" 
              className="text-gray-300 hover:text-osrs-gold transition-colors"
            >
              Trending
            </Link>
            <Link 
              to="/watchlist" 
              className="text-gray-300 hover:text-osrs-gold transition-colors"
            >
              Watchlist
            </Link>
            <Link 
              to="/about" 
              className="text-gray-300 hover:text-osrs-gold transition-colors"
            >
              About
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button className="md:hidden text-gray-300 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
