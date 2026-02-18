import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// Create an OpenAI API client (that's edge friendly!)
// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL, // Optional: for third-party proxies
});

// Set the runtime to edge for best performance
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages,
    });

    // Convert the response into a friendly text-stream
    const stream = new ReadableStream({
      async start(controller) {
        // @ts-ignore
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      },
    });

    // Return the stream
    return new NextResponse(stream);
  } catch (error: any) {
    if (error instanceof OpenAI.APIError) {
      const { name, status, headers, message } = error;
      return NextResponse.json({ name, status, headers, message }, { status });
    } else {
      throw error;
    }
  }
}
