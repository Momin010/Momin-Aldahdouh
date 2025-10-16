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

  try {
    // Try Hugging Face first (better quality), fallback to Pollinations (free)
    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

    if (HUGGINGFACE_API_KEY) {
      // Use Hugging Face Stable Diffusion XL Turbo
      console.log('Using Hugging Face for image generation...');

      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/sdxl-turbo",
        {
          headers: {
            Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            inputs: prompt.trim(),
            parameters: {
              num_inference_steps: 4, // Fast generation
              guidance_scale: 0.0, // More creative
            }
          }),
        }
      );

      if (response.ok) {
        const blob = await response.arrayBuffer();
        const base64Image = Buffer.from(blob).toString("base64");
        const imageUrl = `data:image/png;base64,${base64Image}`;

        const result: ImageGenerationResponse = {
          success: true,
          imageUrl,
          prompt: prompt.trim(),
          timestamp: Date.now(),
        };

        res.status(200).json(result);
        return;
      } else {
        console.warn('Hugging Face failed, falling back to Pollinations...');
      }
    }

    // Fallback to Pollinations (100% free, no API key)
    console.log('Using Pollinations for image generation...');
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&seed=${Math.floor(Math.random() * 1000000)}`;

    const result: ImageGenerationResponse = {
      success: true,
      imageUrl,
      prompt: prompt.trim(),
      timestamp: Date.now(),
    };

    res.status(200).json(result);

  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({
      message: 'An error occurred while generating the image.',
      error: error.message
    });
  }
}