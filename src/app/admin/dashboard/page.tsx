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
    // Revenu mensuel via fonction SQL
    const { data: monthly } = await supabase.rpc('get_monthly_revenue')
    setMonthlyStats(monthly || [])

    // Réservations par ville via fonction SQL
    const { data: byCity } = await supabase.rpc('get_reservations_by_city')
    setCityStats(byCity || [])

    // Revenu total (compte des réservations)
    const { count: revenueCount, error: revenueError } = await supabase
      .from('reservations')
      .select('total_price', { count: 'exact', head: true })
    if (!revenueError) setTotalRevenue(revenueCount || 0)

    // Nombre total d'appartements
    const { count: apartmentsCount, error: apartmentsError } = await supabase
      .from('apartments')
      .select('*', { count: 'exact', head: true })
    if (!apartmentsError) setTotalApartments(apartmentsCount || 0)

    // Nombre total de réservations
    const { count: reservationsCount, error: reservationsError } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
    if (!reservationsError) setTotalReservations(reservationsCount || 0)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-gray-500">Revenus totaux</h3>
          <p className="text-3xl font-bold">{totalRevenue.toLocaleString()} €</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-gray-500">Appartements</h3>
          <p className="text-3xl font-bold">{totalApartments}</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-gray-500">Réservations</h3>
          <p className="text-3xl font-bold">{totalReservations}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Graphique barres revenus mensuels */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Revenus mensuels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gr*
        }
