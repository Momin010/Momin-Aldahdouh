import { throwIfEnvInvalid } from '../../lib/env.js';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

interface PexelsResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Validate environment variables
  throwIfEnvInvalid();

  const { query, per_page = '5', orientation = 'landscape' } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required' });
  }

  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

  if (!PEXELS_API_KEY) {
    console.error("CRITICAL ERROR: PEXELS_API_KEY environment variable is not set");
    return res.status(500).json({ message: 'Server configuration error: Pexels API key is missing.' });
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${per_page}&orientation=${orientation}`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Pexels API error:', errorData);
      return res.status(response.status).json({
        message: `Pexels API error: ${errorData.error || 'Failed to fetch images'}`
      });
    }

    const data: PexelsResponse = await response.json();

    // Transform the response to include only the necessary data
    const images = data.photos.map(photo => ({
      id: photo.id,
      url: photo.src.large, // Use large size for good quality
      alt: photo.alt,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      width: photo.width,
      height: photo.height,
      avg_color: photo.avg_color,
    }));

    res.status(200).json({
      success: true,
      query,
      total_results: data.total_results,
      images,
    });

  } catch (error: any) {
    console.error('Error fetching images from Pexels:', error);
    res.status(500).json({
      message: 'An error occurred while fetching images.',
      error: error.message
    });
  }
}