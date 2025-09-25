'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [featuredApartments, setFeaturedApartments] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data } = await supabase
        .from('apartments')
        .select(`
          id,
          title,
          price_per_night,
          city,
          bedrooms,
          photos!inner(url, is_main)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(6)

      if (data) {
        setFeaturedApartments(data.map(apartment => ({
          ...apartment,
          photos: Array.isArray(apartment.photos) ? apartment.photos : [],
        })))
      }
    }

    fetchFeatured()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  if (authLoading) return <div className="flex items-center justify-center h-screen">Chargement...</div>

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-teal-500 text-white py-20 px-6 text-center">
        <h1 className="text-5xl font-extrabold mb-4">Louez votre appartement idéal en Tunisie 🇹🇳</h1>
        <p className="text-xl mb-8 max-w-3xl mx-auto">
          Recherchez intelligemment, réservez en quelques clics, profitez sereinement.
        </p>

        {/* Barre de recherche IA */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            placeholder="Ex: 'Appartement avec piscine à Hammamet moins de 100 DT'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-4 text-gray-800 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-6 rounded-lg transition"
          >
            Rechercher
          </button>
        </form>
      </section>

      {/* Appartements en vedette */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Nos appartements en vedette</h2>

          {featuredApartments.length === 0 ? (
            <p className="text-center text-gray-500">Aucun appartement disponible pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredApartments.map(apt => {
                const mainPhoto = apt.photos.find(p => p.is_main)?.url || apt.photos[0]?.url
                const photoUrl = mainPhoto
                  ? supabase.storage.from('apartment_photos').getPublicUrl(mainPhoto).data.publicUrl
                  : '/placeholder.jpg'

                return (
                  <Link
                    key={apt.id}
                    href={`/apartment/${apt.id}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
                  >
                    <img
                      src={photoUrl}
                      alt={apt.title}
                      className="w-full h-56 object-cover"
                    />
                    <div className="p-5">
                      <h3 className="font-bold text-lg mb-2">{apt.title}</h3>
                      <p className="text-blue-600 font-bold text-xl">{apt.price_per_night} DT / nuit</p>
                      <p className="text-gray-600">{apt.city} • {apt.bedrooms} chambres</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/search"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Voir tous les appartements
            </Link>
          </div>
        </div>
      </section>

      {/* Pourquoi nous choisir ? */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">Pourquoi choisir TunisiaRent ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Recherche intelligente</h3>
              <p className="text-gray-600">Notre IA comprend vos besoins en langage naturel.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Réservation sécurisée</h3>
              <p className="text-gray-600">Calendrier anti-doublons et confirmation instantanée.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Dashboard Admin</h3>
              <p className="text-gray-600">Gérez vos biens, revenus et statistiques en temps réel.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer + Auth */}
      <footer className="bg-gray-800 text-white py-10 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Prêt à commencer ?</h3>
          <p className="mb-6">Rejoignez des centaines d’utilisateurs satisfaits.</p>

          {user ? (
            <div className="space-y-4">
              <p className="text-lg">Bonjour, {profile?.full_name || user.email} 👋</p>
              {profile?.role === 'admin' ? (
                <Link
                  href="/admin"
                  className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition"
                >
                  🚀 Accéder au tableau de bord
                </Link>
              ) : (
                <Link
                  href="/search"
                  className="inline-block bg-teal-600 hover:bg-teal-700 px-6 py-3 rounded-lg font-medium transition"
                >
                  🔍 Explorer les appartements
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition"
              >
                Se connecter
              </Link>
              <Link
                href="/signup"
                className="border border-white hover:bg-white hover:text-gray-800 px-8 py-3 rounded-lg font-medium transition"
              >
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
