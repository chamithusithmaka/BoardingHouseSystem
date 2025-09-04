import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="text-center p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-4 text-blue-600">Vite + React</h1>
        <div className="mb-4">
          <button 
            onClick={() => setCount(count + 1)} 
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 focus:outline-none"
          >
            Count is {count}
          </button>
        </div>
        <p className="text-gray-600">
          Edit <code className="font-mono">src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="text-center text-gray-500 mt-4">
        Learn more about Vite and React
      </p>
    </div>
  )
}

export default App
