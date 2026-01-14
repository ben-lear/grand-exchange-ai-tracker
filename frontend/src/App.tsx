function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-osrs-orange">
            OSRS Grand Exchange Tracker
          </h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome!</h2>
          <p className="text-gray-300">
            The OSRS Grand Exchange Tracker is initializing...
          </p>
          <div className="mt-4 p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">
              Backend API: <span className="text-green-400">Checking...</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
