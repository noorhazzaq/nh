export async function GET() {
  return new Response(JSON.stringify({ message: "Hazzaq Style API di Node.js 24.x" }), {
    headers: { "Content-Type": "application/json" },
  })
}