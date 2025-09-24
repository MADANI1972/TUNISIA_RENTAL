'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') {
      router.push('/')
    }
  }, [profile, loading])

  if (loading) return <div>Chargement...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord Admin</h1>
      
      <div className="space-y-4">
        <Link href="/admin/add-apartment" className="block bg-green-600 text-white px-4 py-2 rounded w-fit">
          ➕ Ajouter un appartement
        </Link>
        <Link href="/admin/dashboard" className="block bg-blue-600 text-white px-4 py-2 rounded w-fit">
          📊 Voir le tableau de bord
        </Link>
      </div>
    </div>
  )
}
