export async function GET() {
  // NUCLEAR: Always return empty to stop spam
  console.log('🚨 NUCLEAR: Tournaments API returning empty array');
  return Response.json([]);
}

export async function POST() {
  // NUCLEAR: Block all POST requests  
  return Response.json({ error: 'Tournaments API disabled' }, { status: 503 });
}

export async function PUT() {
  return Response.json({ error: 'Tournaments API disabled' }, { status: 503 });
}

export async function DELETE() {
  return Response.json({ error: 'Tournaments API disabled' }, { status: 503 });
}