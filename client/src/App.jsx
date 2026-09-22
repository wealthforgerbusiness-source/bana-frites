import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import HomePage from './pages/HomePage.jsx'
import SignupForm from './components/SignupForm.jsx'
import LoginForm from './components/LoginForm.jsx'
import SendAnonymousMessage from './pages/SendAnonymousMessage.jsx'
import './App.css'

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/inscription" element={<SignupForm />} />
        <Route path="/connexion" element={<LoginForm />} />
        <Route path="/m/:uid" element={<SendAnonymousMessage />} />
      </Routes>
    </>
  )
}

export default App
