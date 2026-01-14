export const Footer = () => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div>
            <h3 className="text-osrs-gold font-semibold mb-3">About</h3>
            <p className="text-gray-400 text-sm">
              Track Old School RuneScape Grand Exchange prices and trends in real-time.
            </p>
          </div>
          <div>
            <h3 className="text-osrs-gold font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-gray-400 hover:text-osrs-gold transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/items" className="text-gray-400 hover:text-osrs-gold transition-colors">
                  Browse Items
                </a>
              </li>
              <li>
                <a href="/trending" className="text-gray-400 hover:text-osrs-gold transition-colors">
                  Trending Items
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-osrs-gold font-semibold mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://oldschool.runescape.wiki/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-osrs-gold transition-colors"
                >
                  OSRS Wiki
                </a>
              </li>
              <li>
                <a 
                  href="https://secure.runescape.com/m=itemdb_oldschool/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-osrs-gold transition-colors"
                >
                  Official GE
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6">
          <p className="text-center text-gray-400 text-sm">
            © 2026 OSRS GE Tracker • Data from Official OSRS API • Not affiliated with Jagex
          </p>
        </div>
      </div>
    </footer>
  );
};
