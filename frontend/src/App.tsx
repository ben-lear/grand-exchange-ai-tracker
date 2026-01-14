import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Layout } from './components/Layout'
import { ItemsListPage } from './pages'

function App() {
  return (
    <Router>
      <Layout>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<ItemsListPage />} />
          <Route path="/items" element={<ItemsListPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
