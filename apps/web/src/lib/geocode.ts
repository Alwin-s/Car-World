export async function geocode(
    query: string,
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) return null;
      const data = (await response.json()) as { lat: string; lon: string }[];
      if (data.length === 0) return null;
      return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
    } catch {
      return null;
    }
  }