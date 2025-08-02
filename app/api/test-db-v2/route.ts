import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET() {
  try {
    // Check all V2__ environment variables to find the right ones
    const envVars = {
      V2__KV_URL: process.env.V2__KV_URL?.substring(0, 20) + '...',
      V2__KV_REST_API_URL: process.env.V2__KV_REST_API_URL?.substring(0, 20) + '...',
      V2__KV_REST_API_TOKEN: process.env.V2__KV_REST_API_TOKEN ? 'exists' : 'missing',
      V2__REDIS_URL: process.env.V2__REDIS_URL?.substring(0, 20) + '...',
    };

    // Use the REST API URL (https://) instead of Redis URL (rediss://)
    const url = process.env.V2__KV_REST_API_URL;
    const token = process.env.V2__KV_REST_API_TOKEN;
    
    if (!url || !token) {
      return NextResponse.json({
        status: 'error',
        error: 'Missing required environment variables',
        available: envVars
      }, { status: 500 });
    }

    // Initialize Redis with REST API URL
    const redis = new Redis({
      url: url,
      token: token,
    });

    // Test basic connectivity
    await redis.set('test-connection-v2', new Date().toISOString());
    const testValue = await redis.get('test-connection-v2');
    
    return NextResponse.json({
      status: 'success',
      connection: 'working',
      database: 'v2-new-database',
      testValue,
      message: 'New database is working perfectly!',
      usedUrl: url?.substring(0, 30) + '...'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      connection: 'failed'
    }, { status: 500 });
  }
}