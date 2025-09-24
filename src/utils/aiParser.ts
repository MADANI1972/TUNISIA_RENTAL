import nlp from 'compromise'

export type SearchFilters = {
  city?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  keywords?: string[]
}

export function parseSearchQuery(query: string): SearchFilters {
  const doc = nlp(query.toLowerCase())
  const filters: SearchFilters = {}

  const numbers = doc.numbers().out('array') as unknown as number[]
  if (numbers.length > 0) {
    const num = numbers[0]
    if (num < 500) filters.maxPrice = num
    if (num <= 5 && num >= 1) filters.bedrooms = num
  }

  const tunisianCities = [
    'tunis', 'sousse', 'sfax', 'hammamet', 'nabeul', 'bizerte', 
    'monastir', 'mahdia', 'gabes', 'medenine', 'djerba', 'ariana'
  ]
  const foundCity = tunisianCities.find(city => 
    query.toLowerCase().includes(city)
  )
  if (foundCity) filters.city = foundCity.charAt(0).toUpperCase() + foundCity.slice(1)

  const keywordTerms = ['piscine', 'vue mer', 'calme', 'centre', 'proche plage', 'grand', 'luxe']
  filters.keywords = keywordTerms.filter(kw => 
    query.toLowerCase().includes(kw)
  )

  return filters
}
