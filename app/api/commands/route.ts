import { getCommands } from "@/lib/data";
import { jsonError, respond } from "@/lib/api";
import { OS_PLATFORMS, isOsPlatform } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const os = new URL(request.url).searchParams.get("os");
  if (os !== null && !isOsPlatform(os)) {
    return jsonError(400, `Parámetro "os" inválido: ${JSON.stringify(os)}.`, {
      allowed: OS_PLATFORMS,
    });
  }
  return respond(() => getCommands({ os: os ?? undefined }));
}
