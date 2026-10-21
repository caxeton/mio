import { getSnippets } from "@/lib/data";
import { jsonError, respond } from "@/lib/api";
import { SNIPPET_LANGUAGES, isSnippetLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const language = new URL(request.url).searchParams.get("language");
  if (language !== null && !isSnippetLanguage(language)) {
    return jsonError(400, `Parámetro "language" inválido: ${JSON.stringify(language)}.`, {
      allowed: SNIPPET_LANGUAGES,
    });
  }
  return respond(() => getSnippets({ language: language ?? undefined }));
}
