import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/prisma/prisma";

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chats = await prisma.assistantChat.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        messages: true,
      },
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Fetch Chats Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    // Authenticate user session via Supabase
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract messages from user input
    const { messages, chatId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    const lastUserMessage = messages[messages.length - 1].content;

    const messageHistory = messages.map((msg) => {
      const role = msg.role === "assistant" ? "model" : "user";

      return {
        role: role,
        parts: [{ text: msg.content }],
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `You are an elite, approachable trading assistant designed for beginners. 
          Your core purpose is to teach disciplined trading. 
          NEVER provide direct stock buy or sell recommendations. Instead, break down financial concepts 
          (like risk-to-reward ratios or reading earnings reports) into highly scannable, step-by-step educational points. 
          Keep your formatting professional, concise, and easy to read`,
        temperature: 0.4, // Lower temperature keeps explanations objective and focused
      },
      contents: messageHistory,
    });

    const assistantText = response.text;

    // 3. Assemble the updated conversation array to include the new AI response
    const updatedMessages = [
      ...messages,
      { role: "assistant", content: assistantText },
    ];

    let activeChatId = chatId;

    if (activeChatId) {
      // Ongoing conversation -> Update existing record
      await prisma.assistantChat.update({
        where: { id: activeChatId, userId: user.id },
        data: { messages: updatedMessages },
      });
    } else {
      // First message of a new thread -> Generate a clean title automatically
      const title =
        lastUserMessage.length > 30
          ? `${lastUserMessage.substring(0, 27)}...`
          : lastUserMessage;

      const newChat = await prisma.assistantChat.create({
        data: {
          userId: user.id,
          title: title,
          messages: updatedMessages,
        },
      });
      activeChatId = newChat.id;
    }

    return NextResponse.json({
      text: assistantText,
      chatId: activeChatId,
    });
  } catch (error) {
    console.error("Gemini Assistant Error:", error);
    return NextResponse.json(
      { error: "Failed to generate response from assistant" },
      { status: 500 },
    );
  }
}
