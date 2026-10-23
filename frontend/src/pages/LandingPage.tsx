import { Link } from 'react-router-dom'

import { Brand } from '../components/Brand'
import '../landing.css'

export function LandingPage() {
  return (
    <main className="landing-placeholder">
      <Brand />
      <h1>Landing Page em reconstrução.</h1>
      <Link className="landing-placeholder-access" to="/app">
        Acessar FocusList
      </Link>
    </main>
  )
}
