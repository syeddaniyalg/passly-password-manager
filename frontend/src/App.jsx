import { useState } from 'react'
import './App.css'
import { NavBar } from './components/NavBar'
import { HomePage } from './pages/HomePage'
import { Footer } from './components/Footer'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { AnimatePresence } from 'framer-motion';
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import PageWrapper from './components/PageWrapper'
import { Callback } from './pages/Callback'
import { Dashboard } from './pages/Dashboard'
import { LoadingSpinner } from './components/LoadingSpinner'
import { useStore } from './components/store'

function App() {
  const location = useLocation();
  const status = useStore((state) => state.status);

  return (
    <>
      {<div className='min-h-screen flex flex-col'>
        <NavBar />
        <main className='grow relative overflow-x-hidden p-6'>
          <AnimatePresence mode='wait'>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><SignIn/></PageWrapper>} />
            <Route path="/signup" element={<PageWrapper><SignUp/></PageWrapper>} />
            <Route path="/login/callback" element={<Callback/>}/>
            <Route path="/dashboard" element={<Dashboard/>}/>
          </Routes>
          </AnimatePresence>
        </main>
        <Footer />
      </div>}
    </>
  )
}

export default App
