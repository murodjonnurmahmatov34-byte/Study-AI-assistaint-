import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        messageCount: sql<number>`count(${messages.id})`,
      })
      .from(conversations)
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .where(eq(conversations.userId, user.id))
      .groupBy(conversations.id)
      .orderBy(desc(conversations.updatedAt))
      .limit(50);

    return ok({
      conversations: rows.map((r) => ({
        id: r.id,
        title: r.title,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        messageCount: Number(r.messageCount),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
