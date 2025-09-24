'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useAuth } from '@/components/AuthProvider'

type Apartment = {
  id: string
  title: string
  price_per_night: number
  description: string
  city: string
  photos: { url: string; is_main: boolean }[]
}

export default function ApartmentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [apartment, setApartment] = useState<Apartment | null>(null)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [existingReservations, setExistingReservations] = useState<{ check_in: string; check_out: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => {
    fetchApartment()
    fetchReservations()
  }, [id])

  const fetchApartment = async () => {
    const { data, error } = await supabase
      .from('apartments')
      .select(`
        *,
        photos!inner(url, is_main)
      `)
      .eq('id', id)
      .single()

    if (!error && data) {
      setApartment({
        ...data,
        photos: Array.isArray(data.photos) ? data.photos : [],
      })
    }
    setLoading(false)
  }

  const fetchReservations = async () => {
    const { data } = await supabase
      .from('reservations')
      .select('check_in, check_out')
      .eq('apartment_id', id)
      .in('status', ['pending', 'confirmed'])

    if (data) setExistingReservations(data)
  }

  const isDateReserved = (date: Date) => {
    return existingReservations.some(res => {
      const checkIn = new Date(res.check_in)
      const checkOut = new Date(res.check_out)
      return date >= checkIn && date < checkOut
    })
  }

  const tileDisabled = ({ date }: { date: Date }) => {
    return isDateReserved(date)
  }

  const handleBook = async () => {
    if (!user) {
      alert('Veuillez vous connecter pour réserver.')
      router.push('/login')
      return
    }

    if (!dateRange[0] || !dateRange[1]) {
      alert('Veuillez sélectionner une plage de dates.')
      return
    }

    const nights = Math.ceil(
      (dateRange[1].getTime() - dateRange[0].getTime()) / (1000 * 60 * 60 * 24)
    )

    const total = nights * apartment!.price_per_night

    if (confirm(`Total : ${total} DT pour ${nights} nuits. Confirmer la réservation ?`)) {
      setBookingLoading(true)

      const { error } = await supabase.from('reservations').insert([
        {
          apartment_id: id,
          user_id: user.id,
          check_in: dateRange[0].toISOString().split('T')[0],
          check_out: dateRange[1].toISOString().split('T')[0],
          total_price: total,
          status: 'pending',
        },
      ])

      if (error) {
        alert('Erreur lors de la réservation : ' + error.message)
      } else {
        alert('Réservation effectuée ! Elle sera confirmée sous peu.')
        router.push('/my-reservations')
      }

      setBookingLoading(false)
    }
  }

  if (loading) return <div>Chargement...</div>
  if (!apartment) return <div>Appartement non trouvé</div>

  const mainPhoto = apartment.photos.find(p => p.is_main)?.url || apartment.photos[0]?.url
  const photoUrl = mainPhoto ? supabase.storage.from('apartment_photos').getPublicUrl(mainPhoto).data.publicUrl : '/placeholder.jpg'

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <img src={photoUrl} alt={apartment.title} className="w-full h-96 object-cover rounded-lg" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {apartment.photos.slice(0, 3).map((photo, idx) => (
              <img
                key={idx}
                src={supabase.storage.from('apartment_photos').getPublicUrl(photo.url).data.publicUrl}
                alt={`view ${idx + 1}`}
                className="w-full h-24 object-cover rounded"
              />
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold">{apartment.title}</h1>
          <p className="text-blue-600 text-2xl font-bold my-2">{apartment.price_per_night} DT / nuit</p>
          <p className="text-gray-700 mb-4">{apartment.city}</p>
          <p className="mb-6">{apartment.description}</p>

          <div className="border-t pt-6">
            <h3 className="font-bold mb-4">Choisissez vos dates :</h3>
            <Calendar
              selectRange={true}
              onChange={(value: any) => setDateRange(value)}
              value={dateRange}
              tileDisabled={tileDisabled}
              className="border rounded p-2"
            />
            <p className="text-sm text-gray-500 mt-2">Les dates réservées sont désactivées.</p>

            <button
              onClick={handleBook}
              disabled={bookingLoading}
              className="w-full mt-6 bg-green-600 text-white p-3 rounded font-medium disabled:opacity-50"
            >
              {bookingLoading ? 'Réservation en cours...' : 'Réserver maintenant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
