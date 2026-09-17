import { type NextRequest } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { logStudySession, requireUser } from "@/lib/auth";
import { AIGenerationError, tutorReply } from "@/lib/ai";
import { fail, handleApiError, ok } from "@/lib/api";
import { limits } from "@/lib/ratelimit";
import { truncateText } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!limits.aiPerUser(user.id, "chat")) {
      return fail(429, "You're sending messages a little fast — give it a minute.");
    }

    const body = (await req.json().catch(() => null)) as {
      conversationId?: string;
      message?: string;
    } | null;

    const message = (body?.message ?? "").trim();
    if (!message) return fail(400, "Message cannot be empty.");
    if (message.length > 4000)
      return fail(400, "Message is too long (max 4000 characters).");

    let conversation = null;
    if (body?.conversationId) {
      const rows = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, body.conversationId),
            eq(conversations.userId, user.id),
          ),
        )
        .limit(1);
      conversation = rows[0] ?? null;
      if (!conversation) return fail(404, "Conversation not found.");
    }

    if (!conversation) {
      const created = await db
        .insert(conversations)
        .values({ userId: user.id, title: truncateText(message, 48) })
        .returning();
      conversation = created[0];
    }

    await db.insert(messages).values({
      conversationId: conversation.id,
      role: "user",
      content: message,
    });

    const historyRows = await db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(asc(messages.createdAt))
      .limit(40);
    const history = historyRows.slice(-16).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let reply;
    try {
      reply = await tutorReply(history as { role: "user" | "assistant"; content: string }[]);
    } catch (err) {
      if (err instanceof AIGenerationError) return fail(502, err.message);
      throw err;
    }

    const saved = await db
      .insert(messages)
      .values({
        conversationId: conversation.id,
        role: "assistant",
        content: reply.content,
      })
      .returning();

    const touched = await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversation.id))
      .returning();

    void logStudySession({
      userId: user.id,
      activity: "tutor",
      topic: conversation.title,
      detail: truncateText(message, 120),
    });

    return ok({
      conversationId: conversation.id,
      conversation: {
        id: touched[0].id,
        title: touched[0].title,
        updatedAt: touched[0].updatedAt.toISOString(),
      },
      message: {
        id: saved[0].id,
        role: "assistant",
        content: saved[0].content,
        createdAt: saved[0].createdAt.toISOString(),
        provider: reply.provider,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
