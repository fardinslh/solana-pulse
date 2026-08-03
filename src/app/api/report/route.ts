import { getSolanaReport } from "@/lib/report/build-report";
import { REPORT_REFRESH_SECONDS } from "@/lib/report/config";
import { reportToMarkdown } from "@/lib/report/markdown";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";
  const format = url.searchParams.get("format") ?? "json";
  const report = await getSolanaReport(forceRefresh);
  const timestamp = report.meta.generatedAt.replace(/[:.]/g, "-");
  const cacheControl = `public, s-maxage=${REPORT_REFRESH_SECONDS}, stale-while-revalidate=${REPORT_REFRESH_SECONDS * 2}`;

  if (format === "markdown" || format === "md") {
    return new Response(reportToMarkdown(report), {
      headers: {
        "cache-control": cacheControl,
        "content-disposition": `attachment; filename="solana-report-${timestamp}.md"`,
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return Response.json(report, {
    headers: {
      "cache-control": cacheControl,
      "content-disposition": `inline; filename="solana-report-${timestamp}.json"`,
    },
  });
}
