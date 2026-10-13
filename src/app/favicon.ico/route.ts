// Empty image: the product intentionally has no logo or logomark.
export function GET() {
  return new Response(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
    {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    },
  );
}
