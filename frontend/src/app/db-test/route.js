// For example, using app router: app/api/db-test/route.js
import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const client = await db.connect(); // Tries to connect using env vars
    const result = await client.sql`SELECT NOW();`; // Simple query
    client.release();
    return NextResponse.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
