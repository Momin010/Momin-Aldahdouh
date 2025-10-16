import { throwIfEnvInvalid } from '../../lib/env.js';

interface ImageGenerationRequest {
  prompt: string;
}

interface ImageGenerationResponse {
  success: boolean;
  imageUrl: string;
  prompt: string;
  timestamp: number;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Validate environment variables
  throwIfEnvInvalid();

  const { prompt }: ImageGenerationRequest = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ message: 'Prompt is required and must be a non-empty string' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.error("CRITICAL ERROR: OPENAI_API_KEY environment variable is not set");
    return res.status(500).json({ message: 'Server configuration error: OpenAI API key is missing.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        n: 1,
        size: '1024x1024',
        model: 'dall-e-3',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({
        message: `OpenAI API error: ${errorData.error?.message || 'Failed to generate image'}`
      });
    }

    const data = await response.json();

    if (!data.data || !data.data[0] || !data.data[0].url) {
      console.error('Invalid response from OpenAI:', data);
      return res.status(500).json({ message: 'Invalid response from image generation service' });
    }

    const imageUrl = data.data[0].url;

    const result: ImageGenerationResponse = {
      success: true,
      imageUrl,
      prompt: prompt.trim(),
      timestamp: Date.now(),
    };

    res.status(200).json(result);

  } catch (error: any) {
    console.error('Error generating image with OpenAI:', error);
    res.status(500).json({
      message: 'An error occurred while generating the image.',
      error: error.message
    });
  }
}