import { NextResponse } from 'next/server';

// Set the runtime to edge for best performance
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { imageA, imageB } = await req.json();

    if (!imageA || !imageB) {
      return NextResponse.json({ message: "Both images are required" }, { status: 400 });
    }

    const prompt = `You are a high-end photo synthesis engine. Refer to the Person in Image A and the Athlete in Image B. Create a new, combined photo of them standing together.
Style Requirement: The output must be a mundane, low-quality iPhone selfie. It should look like a random, blurry, and slightly overexposed snapshot taken at a basketball arena post-game. No professional lighting or composition.
Details: Ensure the Person from Image A is wearing a team jersey and the Athlete from Image B is smiling. The final result should look like an accidental, unedited "mistake" shot taken while pulling the phone from a pocket.`;

    const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const apiKey = process.env.OPENAI_API_KEY;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Keep-alive byte
          controller.enqueue(encoder.encode("  "));

          // Call the proxy with TWO images
          const apiResponse = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'qwen-image-2',
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    {
                      type: "image_url",
                      image_url: { url: imageA }  // User's selfie (Image A)
                    },
                    {
                      type: "image_url",
                      image_url: { url: imageB }  // Athlete reference (Image B)
                    }
                  ]
                }
              ],
              stream: false,
            }),
          });

          const rawBody = await apiResponse.text();
          const chatCompletion = JSON.parse(rawBody);
          const content = chatCompletion.choices?.[0]?.message?.content || "";

          console.log("Full content from model:", content);

          let finalImageUrl = "";

          // Strategy 1: Parse embedded JSON from markdown code block
          const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonBlockMatch) {
            try {
              const innerJson = JSON.parse(jsonBlockMatch[1].trim());
              console.log("Parsed inner JSON keys:", Object.keys(innerJson));
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

          // Strategy 2: filesystem.site CDN URL
          if (!finalImageUrl) {
            const cdnMatch = content.match(/https?:\/\/pro\.filesystem\.site\/cdn\/[^\s"')]+/);
            if (cdnMatch) finalImageUrl = cdnMatch[0];
          }

          // Strategy 3: Any image file URL
          if (!finalImageUrl) {
            const imgMatch = content.match(/https?:\/\/[^\s"')]+\.(?:png|jpg|jpeg|webp)/i);
            if (imgMatch) finalImageUrl = imgMatch[0];
          }

          // Strategy 4: Any URL that's NOT asyncdata.net/web
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
