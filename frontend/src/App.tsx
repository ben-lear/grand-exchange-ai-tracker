/**
 * Main App component with routing configuration
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { DashboardPage, ItemDetailPage, NotFoundPage } from './pages';

/**
 * App component - Root component with routing
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
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
