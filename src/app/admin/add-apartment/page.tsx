'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'

export default function AddApartmentPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [bedrooms, setBedrooms] = useState('1')
  const [bathrooms, setBathrooms] = useState('1')
  const [surface, setSurface] = useState('')
  const [availableFrom, setAvailableFrom] = useState('')
  const [availableTo, setAvailableTo] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: apartment, error: aptError } = await supabase
        .from('apartments')
        .insert([
          {
            title,
            description,
            price_per_night: parseFloat(price),
            city,
            address,
            bedrooms: parseInt(bedrooms),
            bathrooms: parseInt(bathrooms),
            surface_m2: parseInt(surface) || null,
            available_from: availableFrom || null,
            available_to: availableTo || null,
          },
        ])
        .select()
        .single()

      if (aptError) throw aptError

      if (files.length > 0) {
        setUploading(true)
        const bucket = supabase.storage.from('apartment_photos')
        const photoUrls: string[] = []

        for (const file of files) {
          const filePath = `${apartment.id}/${Date.now()}_${file.name}`
          const { error: uploadError } = await bucket.upload(filePath, file, {
            upsert: true,
          })
          if (uploadError) throw uploadError
          photoUrls.push(filePath)
        }

        if (photoUrls.length > 0) {
          const photoData = photoUrls.map((url, index) => ({
            apartment_id: apartment.id,
            url,
            is_main: index === 0,
          }))

          const { error: photoError } = await supabase
            .from('photos')
            .insert(photoData)

          if (photoError) throw photoError
        }
      }

      alert('Appartement ajouté avec succès !')
      router.push('/admin')

    } catch (error) {
      console.error(error)
      alert('Erreur lors de la création')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ajouter un nouvel appartement</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Titre (ex: Appartement vue mer à Hammamet)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-3 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Prix par nuit (DT)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="p-3 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Ville"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="p-3 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Adresse complète"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="p-3 border rounded"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="p-3 border rounded"
          >
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n} chambre(s)</option>
            ))}
          </select>
          <select
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
            className="p-3 border rounded"
          >
            {[1, 2, 3].map(n => (
              <option key={n} value={n}>{n} salle(s) de bain</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Surface (m²)"
            value={surface}
            onChange={(e) => setSurface(e.target.value)}
            className="p-3 border rounded"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="date"
            value={availableFrom}
            onChange={(e) => setAvailableFrom(e.target.value)}
            className="p-3 border rounded"
          />
          <input
            type="date"
            value={availableTo}
            onChange={(e) => setAvailableTo(e.target.value)}
            className="p-3 border rounded"
          />
        </div>

        <textarea
          placeholder="Description détaillée..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-3 border rounded h-32"
          required
        />

        <div {...getRootProps()} className="border-2 border-dashed p-8 text-center cursor-pointer hover:bg-gray-50">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Déposez les images ici...</p>
          ) : (
            <p>Cliquez ou glissez des photos ici (PNG, JPG)</p>
          )}
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div key={index} className="relative border p-2 rounded">
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="w-20 h-20 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full bg-blue-600 text-white p-3 rounded font-medium disabled:opacity-50"
        >
          {uploading
            ? 'Upload des photos...'
            : submitting
            ? 'Création en cours...'
            : 'Ajouter l’appartement'}
        </button>
      </form>
    </div>
  )
}
