'use client'

import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

export default function Home() {
  const { user, profile } = useAuth()

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">Bienvenue sur TunisiaRent</h1>
      {user ? (
        <div>
          <p>Bonjour, {profile?.full_name || user.email}</p>
          {profile?.role === 'admin' && (
            <Link href="/admin" className="text-blue-600 underline mt-2 block">
              Accéder au tableau de bord admin
            </Link>
          )}
        </div>
      ) : (
        <div>
          <Link href="/login" className="mr-4 text-blue-600">Se connecter</Link>
          <Link href="/signup" className="text-blue-600">S'inscrire</Link>
        </div>
      )}
    </main>
  )
}
