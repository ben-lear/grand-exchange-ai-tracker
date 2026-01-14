import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'

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
            <Route path="/" element={
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Welcome</h2>
                <p className="text-gray-400">
                  Frontend skeleton is ready. Start building!
                </p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
