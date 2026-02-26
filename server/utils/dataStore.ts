import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface Institution {
  id: number
  organisation_name: string
  city: string | null
  country: string | null
  street_1: string | null
  street_2: string | null
  website: string | null
}

interface DataIndex {
  institutions: Institution[]
  countries: string[]
  citiesByCountry: Map<string, string[]>
  countryNormMap: Map<string, string> // lowercase → original casing
  totalCount: number
}

let _index: DataIndex | null = null

function buildIndex(data: Institution[]): DataIndex {
  const countrySet = new Set<string>()
  const citiesMap = new Map<string, Set<string>>()

  for (const inst of data) {
    const country = inst.country?.trim()
    const city = inst.city?.trim()

    if (country) {
      countrySet.add(country)
      if (!citiesMap.has(country)) {
        citiesMap.set(country, new Set())
      }
      if (city) {
        citiesMap.get(country)!.add(city)
      }
    }
  }

  const countries = Array.from(countrySet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  )

  const citiesByCountry = new Map<string, string[]>()
  for (const [country, citySet] of citiesMap) {
    citiesByCountry.set(
      country,
      Array.from(citySet).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      )
    )
  }

  const countryNormMap = new Map<string, string>()
  for (const c of countries) {
    countryNormMap.set(c.toLowerCase(), c)
  }

  return {
    institutions: data,
    countries,
    citiesByCountry,
    countryNormMap,
    totalCount: data.length,
  }
}

export function getDataStore(): DataIndex {
  if (!_index) {
    const dataPath = process.env.DATA_FILE_PATH || 'data/institutions.json'
    const filePath = resolve(process.cwd(), dataPath)
    console.log(`[DataStore] Loading data from ${filePath}...`)
    const startTime = performance.now()

    const raw = readFileSync(filePath, 'utf-8')
    const data: Institution[] = JSON.parse(raw)

    _index = buildIndex(data)

    const elapsed = (performance.now() - startTime).toFixed(0)
    console.log(
      `[DataStore] Loaded ${_index.totalCount.toLocaleString()} institutions, ` +
        `${_index.countries.length} countries in ${elapsed}ms`
    )
  }

  return _index
}
