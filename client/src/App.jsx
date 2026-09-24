import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import HomePage from './pages/HomePage.jsx'
import SignupForm from './pages/SignupForm.jsx'
import LoginForm from './pages/LoginForm.jsx'
import SendAnonymousMessage from './pages/SendAnonymousMessage.jsx'
import ReceivedMessages from './pages/ReceivedMessages.jsx'
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
        <Route path="/mes-messages" element={<ReceivedMessages />} />
      </Routes>
    </>
  )
}

export default App
