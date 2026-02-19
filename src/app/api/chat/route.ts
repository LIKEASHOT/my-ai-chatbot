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

    // Call OpenAI API with the specific model and image input
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
                url: image // Expecting data:image/... base64 string
              }
            }
          ]
        }
      ],
      // We don't use stream: true for image generation usually, as we need the full URL/data
      // But if the proxy supports streaming text that contains the url, we could. 
      // For safety/simplicity with 'generation', let's use non-streaming to get the full response.
      stream: false,
    });

    console.log("Model Response:", response);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Full Error Object:", error);
    if (error instanceof OpenAI.APIError) {
      const { name, status, headers, message } = error;
      return NextResponse.json({ name, status, headers, message }, { status });
    } else {
      return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
  }
}
