import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Layout } from './components/Layout'
import { 
  DashboardPage, 
  ItemsListPage, 
  ItemDetailPage, 
  TrendingPage, 
  WatchlistPage,
  AboutPage
} from './pages'

function App() {
  return (
    <Router>
      <Layout>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/items" element={<ItemsListPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
