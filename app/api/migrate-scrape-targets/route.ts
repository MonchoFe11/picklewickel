import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST() {
  try {
    // Get data from both possible keys
    const oldKey = 'picklewickel:scrape-targets';
    const newKey = 'picklewickel_scrape-targets_v1';
    
    const oldData = await kv.get(oldKey) || [];
    const newData = await kv.get(newKey) || [];
    
    console.log('Old key data:', oldData);
    console.log('New key data:', newData);
    
    // If old key has data and new key doesn't, migrate it
    if ((oldData as any[]).length > 0 && (newData as any[]).length === 0) {
      await kv.set(newKey, oldData);
      console.log(`Migrated ${(oldData as any[]).length} targets from ${oldKey} to ${newKey}`);
      
      return NextResponse.json({
        success: true,
        message: `Migrated ${(oldData as any[]).length} scrape targets`,
        migratedTargets: (oldData as any[]).map(t => ({ id: t.id, name: t.tournamentName }))
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'No migration needed',
      oldKeyCount: (oldData as any[]).length,
      newKeyCount: (newData as any[]).length
    });
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}