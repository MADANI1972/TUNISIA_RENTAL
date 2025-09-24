'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { parseSearchQuery, SearchFilters } from '@/utils/aiParser'
import Link from 'next/link'

type Apartment = {
  id: string
  title: string
  price_per_night: number
  city: string
  bedrooms: number
  photos: { url: string; is_main: boolean }[]   // ✅ ajout de is_main
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    const parsedFilters = parseSearchQuery(query)
    setFilters(parsedFilters)

    let baseQuery = supabase
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

    if (parsedFilters.city) baseQuery = baseQuery.eq('city', parsedFilters.city)
    if (parsedFilters.maxPrice) baseQuery = baseQuery.lte('price_per_night', parsedFilters.maxPrice)
    if (parsedFilters.bedrooms) baseQuery = baseQuery.eq('bedrooms', parsedFilters.bedrooms)
    if (parsedFilters.keywords?.length) {
      baseQuery = baseQuery.or(
        parsedFilters.keywords.map(kw => `description.ilike.%${kw}%`).join(',')
      )
    }

    const { data, error } = await baseQuery

    if (!error && data) {
      setApartments(
        data.map(apartment => ({
          ...apartment,
          photos: Array.isArray(apartment.photos) ? apartment.photos : [],
        }))
      )
    } else {
      setApartments([])
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!query) {
      supabase
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
        .then(({ data }) => {
          if (data) {
            setApartments(
              data.map(apartment => ({
                ...apartment,
                photos: Array.isArray(apartment.photos) ? apartment.photos : [],
              }))
            )
          }
        })
    }
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Recherche intelligente d’appartements</h1>

      <div className="mb-8">
        <input
          type="text"
          placeholder="Ex: '3 pièces à Sousse avec piscine moins de 120 DT'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-4 text-lg border rounded"
        />
        <button
          onClick={handleSearch}
          className="mt-2 px-6 py-2 bg-blue-600 text-white rounded"
        >
          Rechercher
        </button>

        {Object.keys(filters).length > 0 && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-medium">Filtres détectés :</h3>
            <ul className="list-disc list-inside text-sm">
              {filters.city && <li>Ville : {filters.city}</li>}
              {filters.maxPrice && <li>Prix max : {filters.maxPrice} DT</li>}
              {filters.bedrooms && <li>Chambres : {filters.bedrooms}</li>}
              {filters.keywords?.length && <li>Mots-clés : {filters.keywords.join(', ')}</li>}
            </ul>
          </div>
        )}
      </div>

      {loading ? (
        <p>Recherche en cours...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apartments.map(apt => {
            const mainPhoto =
              apt.photos.find(p => p.is_main)?.url || apt.photos[0]?.url
            const photoUrl = mainPhoto
              ? supabase.storage.from('apartment_photos').getPublicUrl(mainPhoto).data.publicUrl
              : '/placeholder.jpg'

            return (
              <Link
                key={apt.id}
                href={`/apartment/${apt.id}`}
                className="border rounded-lg overflow-hidden hover:shadow-md transition"
              >
                <img
                  src={photoUrl}
                  alt={apt.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-bold">{apt.title}</h3>
                  <p className="text-blue-600 font-bold">{apt.price_per_night} DT/nuit</p>
                  <p>{apt.city} • {apt.bedrooms} chambres</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {apartments.length === 0 && !loading && (
        <p className="text-center text-gray-500 mt-10">
          Aucun appartement ne correspond à votre recherche.
        </p>
      )}
    </div>
  )
}
