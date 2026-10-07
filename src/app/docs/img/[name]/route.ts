import { listImages, readImage } from "@/lib/docs/content"

/** Screenshots from docs/img, served at /docs/img/<name> — static, built with the docs pages. */
export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return listImages().map((name) => ({ name }))
}

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
}

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const type = TYPES[name.split(".").pop() ?? ""] ?? "application/octet-stream"
  return new Response(new Uint8Array(readImage(name)), { headers: { "Content-Type": type } })
}
