import { requireUser } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/api";
import { getDashboardData, getProgressData } from "@/lib/stats";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope");
    const data =
      scope === "progress" ? await getProgressData(user.id) : await getDashboardData(user.id);
    return ok(data);
  } catch (err) {
    return handleApiError(err);
  }
}
