import { NextResponse } from 'next/server';

export async function GET() {
  // EMERGENCY: Hard stop API spam
  console.log('🛑 EMERGENCY: API blocked to stop spam');
  return NextResponse.json([]);
}

export async function POST(request: Request) {
  // EMERGENCY: Hard stop API spam  
  console.log('🛑 EMERGENCY: API blocked to stop spam');
  return NextResponse.json({ success: true });
}