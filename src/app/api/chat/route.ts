import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// Create an OpenAI API client
const clientConfig = {
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY,
};

const openai = new OpenAI(clientConfig);

// Set the runtime to edge for best performance
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ message: "Image is required" }, { status: 400 });
    }

    // Fixed prompt as requested
    const prompt = "A grainy, accidental iPhone front-camera selfie taken at the Lakers home arena right after a game ended. The photo is blurry, poorly framed with no clear subject, and slightly overexposed due to harsh, uneven lighting. It captures a chaotic, mundane moment of crowds leaving, looking exactly like a mistake shot taken while pulling the phone from a pocket. Raw, low-quality, unedited aesthetic..";

    // Create a stream to bypass Vercel 25s initial response timeout
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. Send a keep-alive byte (whitespace) immediately
          // This tells Vercel "response started", resetting the 25s timeout
          controller.enqueue(encoder.encode("  "));

          // 2. Call OpenAI API (this might take 30s+)
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-image', // Specific model requested
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  {
                    type: "image_url",
                    image_url: {
                      url: image
                    }
                  }
                ]
              }
            ],
            stream: false, // We still wait for full response, but inside the stream wrapper
          });

          // 3. Send the actual JSON response
          const jsonString = JSON.stringify(response);
          controller.enqueue(encoder.encode(jsonString));
          controller.close();

        } catch (error: any) {
          console.error("Stream Error:", error);
          const errorJson = JSON.stringify({
            error: true,
            message: error.message || "Generate error",
            details: error
          });
          controller.enqueue(encoder.encode(errorJson));
          controller.close(); // Close stream on error
        }
      }
    });

    // Return the stream with JSON content type
    // Browsers' .json() parser handles leading whitespace fine
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error: any) {
    console.error("Request Error:", error);
    return NextResponse.json({ message: "Request failed" }, { status: 500 });
  }
}
