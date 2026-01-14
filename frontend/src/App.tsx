import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ItemsListPage } from './pages'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Toaster position="top-right" />
        
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-osrs-gold">
              OSRS Grand Exchange Tracker
            </h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<ItemsListPage />} />
            <Route path="/items" element={<ItemsListPage />} />
          </Routes>
        </main>

        <footer className="bg-gray-800 border-t border-gray-700 mt-12">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-gray-400 text-sm">
              OSRS Grand Exchange Tracker • Phase 4 - Frontend Foundation Complete
            </p>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App
