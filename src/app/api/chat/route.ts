import { NextResponse } from 'next/server';

// Set the runtime to edge for best performance
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ message: "Image is required" }, { status: 400 });
    }

    const prompt = "A grainy, accidental iPhone front-camera selfie taken at the Lakers home arena right after a game ended. The photo is blurry, poorly framed with no clear subject, and slightly overexposed due to harsh, uneven lighting. It captures a chaotic, mundane moment of crowds leaving, looking exactly like a mistake shot taken while pulling the phone from a pocket. Raw, low-quality, unedited aesthetic.";

    const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const apiKey = process.env.OPENAI_API_KEY;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. Keep-alive byte
          controller.enqueue(encoder.encode("  "));

          // 2. Step 1: Call the proxy /chat/completions
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
                    { type: "image_url", image_url: { url: image } }
                  ]
                }
              ],
              stream: false,
            }),
          });

          const rawBody = await apiResponse.text();
          console.log("Step 1 - Proxy raw response (first 500):", rawBody.substring(0, 500));

          // 3. Parse step 1 response and look for ANY URL
          let intermediateUrl = "";
          let finalImageUrl = "";

          try {
            const step1Data = JSON.parse(rawBody);

            // Maybe the proxy already returns urls directly?
            if (step1Data.urls && Array.isArray(step1Data.urls) && step1Data.urls.length > 0) {
              finalImageUrl = step1Data.urls[0];
            }
            // Check standard chat completion content for a URL
            else {
              const content = step1Data.choices?.[0]?.message?.content || "";
              const urlMatch = content.match(/https?:\/\/[^\s)"]+/);
              if (urlMatch) {
                intermediateUrl = urlMatch[0];
              }
            }
          } catch {
            // If rawBody isn't JSON, try to find URL in raw text
            const urlMatch = rawBody.match(/https?:\/\/[^\s)"]+/);
            if (urlMatch) {
              intermediateUrl = urlMatch[0];
            }
          }

          // 4. Step 2: If we got an intermediate URL (asyncdata.net style), fetch it
          if (!finalImageUrl && intermediateUrl) {
            console.log("Step 2 - Fetching intermediate URL:", intermediateUrl);

            const step2Response = await fetch(intermediateUrl, {
              headers: { 'Accept': 'application/json' },
            });
            const step2Body = await step2Response.text();
            console.log("Step 2 - Intermediate response (first 500):", step2Body.substring(0, 500));

            try {
              const step2Data = JSON.parse(step2Body);

              // Extract the actual image URL from the final JSON
              if (step2Data.urls && Array.isArray(step2Data.urls) && step2Data.urls.length > 0) {
                finalImageUrl = step2Data.urls[0];
              }
              // Fallback: look in generations
              else if (step2Data.generations?.[0]?.encodings?.source?.path) {
                finalImageUrl = step2Data.generations[0].encodings.source.path;
              }
            } catch {
              console.error("Step 2 - Failed to parse intermediate response");
            }
          }

          // 5. Return the final result
          const result = JSON.stringify({
            imageUrl: finalImageUrl || null,
            debug: {
              intermediateUrl,
              finalImageUrl,
            }
          });

          console.log("Final result:", result);
          controller.enqueue(encoder.encode(result));
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
