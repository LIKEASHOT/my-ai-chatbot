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
          // Keep-alive byte
          controller.enqueue(encoder.encode("  "));

          // Call the proxy /chat/completions
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

          // Parse the ChatCompletion response
          const chatCompletion = JSON.parse(rawBody);
          const content = chatCompletion.choices?.[0]?.message?.content || "";

          console.log("Full content from model:", content);

          // The content is typically a markdown code block: ```json\n{...}\n```
          // We need to extract and parse the inner JSON
          let finalImageUrl = "";

          // Strategy 1: Try to parse embedded JSON from markdown code block
          const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonBlockMatch) {
            try {
              const innerJson = JSON.parse(jsonBlockMatch[1].trim());
              console.log("Parsed inner JSON keys:", Object.keys(innerJson));

              // Look for image URLs in the parsed JSON
              // Check common fields that might have the image URL
              if (innerJson.urls && Array.isArray(innerJson.urls)) {
                finalImageUrl = innerJson.urls[0];
              } else if (innerJson.url) {
                finalImageUrl = innerJson.url;
              } else if (innerJson.image_url) {
                finalImageUrl = innerJson.image_url;
              } else if (innerJson.result_url) {
                finalImageUrl = innerJson.result_url;
              } else if (innerJson.output_url) {
                finalImageUrl = innerJson.output_url;
              }
            } catch (e) {
              console.log("Failed to parse inner JSON block:", e);
            }
          }

          // Strategy 2: If no JSON block found or no URL in it,
          // search for image file URLs directly in the content text
          if (!finalImageUrl) {
            // Look for filesystem.site CDN URLs (the actual image host)
            const cdnMatch = content.match(/https?:\/\/pro\.filesystem\.site\/cdn\/[^\s"')]+/);
            if (cdnMatch) {
              finalImageUrl = cdnMatch[0];
            }
          }

          // Strategy 3: Look for any .png/.jpg/.webp URL in content
          if (!finalImageUrl) {
            const imgMatch = content.match(/https?:\/\/[^\s"')]+\.(?:png|jpg|jpeg|webp)/i);
            if (imgMatch) {
              finalImageUrl = imgMatch[0];
            }
          }

          // Strategy 4: Last resort - grab any URL that's NOT asyncdata.net/web
          if (!finalImageUrl) {
            const allUrls = content.match(/https?:\/\/[^\s"')]+/g) || [];
            console.log("All URLs found in content:", allUrls);
            for (const url of allUrls) {
              if (!url.includes("asyncdata.net/web")) {
                finalImageUrl = url;
                break;
              }
            }
          }

          console.log("Final resolved image URL:", finalImageUrl);

          const result = JSON.stringify({
            imageUrl: finalImageUrl || null,
            debug: {
              contentLength: content.length,
              foundUrl: finalImageUrl,
            }
          });

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
