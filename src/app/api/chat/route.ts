import { NextResponse } from 'next/server';

// Set the runtime to edge for best performance
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ message: "Image is required" }, { status: 400 });
    }

    // Fixed prompt as requested
    const prompt = "A grainy, accidental iPhone front-camera selfie taken at the Lakers home arena right after a game ended. The photo is blurry, poorly framed with no clear subject, and slightly overexposed due to harsh, uneven lighting. It captures a chaotic, mundane moment of crowds leaving, looking exactly like a mistake shot taken while pulling the phone from a pocket. Raw, low-quality, unedited aesthetic.";

    const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const apiKey = process.env.OPENAI_API_KEY;

    // Create a stream to bypass Vercel 25s initial response timeout
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. Send a keep-alive byte immediately
          controller.enqueue(encoder.encode("  "));

          // 2. Call the proxy API directly with fetch (bypass OpenAI SDK)
          //    This gives us the RAW response JSON including `urls` array
          const apiResponse = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-image',
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    {
                      type: "image_url",
                      image_url: { url: image }
                    }
                  ]
                }
              ],
              stream: false,
            }),
          });

          // 3. Get the raw response body as text and forward it directly
          const rawBody = await apiResponse.text();
          console.log("Proxy raw response (first 500 chars):", rawBody.substring(0, 500));

          controller.enqueue(encoder.encode(rawBody));
          controller.close();

        } catch (error: any) {
          console.error("Stream Error:", error);
          const errorJson = JSON.stringify({
            error: true,
            message: error.message || "Generate error",
          });
          controller.enqueue(encoder.encode(errorJson));
          controller.close();
        }
      }
    });

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
