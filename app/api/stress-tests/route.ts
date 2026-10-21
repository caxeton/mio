import { getStressTests } from "@/lib/data";
import { respond } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return respond(getStressTests);
}
