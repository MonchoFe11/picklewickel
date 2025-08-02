import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const HEALTH_LOG_KEY = 'picklewickel:scraper:health';
const MAX_HEALTH_LOGS = 1000; // Keep last 1000 health records

interface HealthRecord {
  id: string;
  status: 'started' | 'completed' | 'failed' | 'heartbeat';
  workflow: string;
  executionId?: string;
  timestamp: string;
  metrics?: {
    matchesProcessed?: number;
    errors?: number;
    duration?: number;
    targetsScraped?: number;
    confidence?: string;
  };
  error?: string;
  message?: string;
}

function generateId(): string {
  return `health_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

export async function POST(request: NextRequest) {
  try {
    const healthData = await request.json();

    // Validate required fields
    if (!healthData.status || !healthData.workflow) {
      return NextResponse.json(
        { error: 'Missing required fields: status, workflow' },
        { status: 400 }
      );
    }

    // Create health record
    const healthRecord: HealthRecord = {
      id: generateId(),
      status: healthData.status,
      workflow: healthData.workflow,
      executionId: healthData.executionId,
      timestamp: healthData.timestamp || new Date().toISOString(),
      metrics: healthData.metrics,
      error: healthData.error,
      message: healthData.message
    };

    // Get existing health logs
    const existingLogs: HealthRecord[] = await kv.get(HEALTH_LOG_KEY) || [];

    // Add new record and trim to max size
    const updatedLogs = [healthRecord, ...existingLogs].slice(0, MAX_HEALTH_LOGS);

    // Save updated logs
    await kv.set(HEALTH_LOG_KEY, updatedLogs);

    // Calculate health metrics for response
    const recentLogs = updatedLogs.slice(0, 50); // Last 50 records
    const recentSuccesses = recentLogs.filter(log => log.status === 'completed').length;
    const recentFailures = recentLogs.filter(log => log.status === 'failed').length;
    const successRate = recentLogs.length > 0 ? (recentSuccesses / recentLogs.length) * 100 : 0;

    return NextResponse.json({
      success: true,
      recorded: true,
      healthMetrics: {
        successRate: Math.round(successRate),
        recentSuccesses,
        recentFailures,
        lastExecution: healthRecord.timestamp,
        status: healthRecord.status
      }
    });

  } catch (error) {
    console.error('Error recording health data:', error);
    return NextResponse.json(
      { error: 'Failed to record health data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const workflow = searchParams.get('workflow');

    // Get health logs
    let healthLogs: HealthRecord[] = await kv.get(HEALTH_LOG_KEY) || [];

    // Filter by workflow if specified
    if (workflow) {
      healthLogs = healthLogs.filter(log => log.workflow === workflow);
    }

    // Limit results
    const limitedLogs = healthLogs.slice(0, limit);

    // Calculate overall metrics
    const totalLogs = healthLogs.length;
    const successCount = healthLogs.filter(log => log.status === 'completed').length;
    const failureCount = healthLogs.filter(log => log.status === 'failed').length;
    const overallSuccessRate = totalLogs > 0 ? (successCount / totalLogs) * 100 : 0;

    // Get recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentActivity = healthLogs.filter(log => log.timestamp >= oneDayAgo);

    return NextResponse.json({
      logs: limitedLogs,
      metrics: {
        totalRecords: totalLogs,
        successCount,
        failureCount,
        overallSuccessRate: Math.round(overallSuccessRate),
        recentActivity: recentActivity.length,
        lastActivity: healthLogs[0]?.timestamp || null
      }
    });

  } catch (error) {
    console.error('Error fetching health data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health data' },
      { status: 500 }
    );
  }
}