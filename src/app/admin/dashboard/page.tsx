'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

type Stat = {
  month?: string
  city?: string
  count?: number
  total?: number
}

export default function AdminDashboard() {
  const [monthlyStats, setMonthlyStats] = useState<Stat[]>([])
  const [cityStats, setCityStats] = useState<Stat[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalApartments, setTotalApartments] = useState(0)
  const [totalReservations, setTotalReservations] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: monthly } = await supabase.rpc('get_monthly_revenue')
    setMonthlyStats(monthly || [])

    const { data: byCity } = await supabase.rpc('get_reservations_by_city')
    setCityStats(byCity || [])

    const { count: revenueCount } = await supabase
      .from('reservations')
      .select('total_price', { count: 'exact', head: true })
    setTotalRevenue(revenueCount || 0)

    const { count: apartmentsCount } = await supabase
      .from('apartments')
      .select('*', { count: 'exact', head: true })
    setTotalApartments(apartmentsCount || 0)

    const { count: reservationsCount } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
    setTotalReservations(reservationsCount || 0)
  }

  // ✅ Bien à l’intérieur de la fonction, avant le return
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-gray-500">Revenus totaux</h3>
          <p className="text-3xl font-bold">{totalRevenue.toLocaleString()} DT</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-gray-500">Appartements</h3>
          <p className="text-3xl font-bold">{totalApartments}</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-gray-500">Réservations</h3>
          <p className="text-3xl font-bold">{totalReservations}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Revenus mensuels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} DT`, 'Revenus']} />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Réservations par ville</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cityStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label={({ city, percent }) => `${city} ${(percent * 100).toFixed(0)}%`}
              >
                {cityStats.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} réservations`, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
