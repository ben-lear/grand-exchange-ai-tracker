/**
 * Main App component with routing configuration
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { DashboardPage, ItemDetailPage, NotFoundPage, SharedWatchlistPage, WatchlistsPage } from './pages';

/**
 * App component - Root component with routing
 */
function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="watchlists" element={<WatchlistsPage />} />
          <Route path="watchlist/share/:token" element={<SharedWatchlistPage />} />
          {/* Support both old ID-only and new ID/slug routes */}
          <Route path="items/:id" element={<ItemDetailPage />} />
          <Route path="items/:id/:slug" element={<ItemDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
