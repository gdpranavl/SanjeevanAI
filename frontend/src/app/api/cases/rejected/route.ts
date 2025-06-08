import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('main');
    
    const unapprovedCases = await db.collection('cases').find({
      $or: [
        { ApprovalStatus: "Rejected" },
        { ApprovalStatus: "rejected" },
        { ApprovalStatus: "Rejected" },
        { ApprovalStatus: false }
      ]
    }).toArray();
    
    return NextResponse.json(unapprovedCases);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unapproved cases' },
      { status: 500 }
    );
  }
}
