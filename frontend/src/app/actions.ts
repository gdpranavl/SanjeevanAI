// app/actions.ts
'use server'; // This directive marks the file as a Server Action module

import { MongoClient } from 'mongodb';
import { revalidatePath } from 'next/cache'; // Import for Next.js caching revalidation

const uri = process.env.MONGODB_URI;

/**
 * Connects to the MongoDB database.
 * @returns An object containing the connected MongoClient and the database instance.
 */
async function connectToDatabase() {
    try {
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is not set.');
        }
        const client = new MongoClient(uri);
        await client.connect();
        return { client, db: client.db('maindb') };
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}

/**
 * Updates the ApprovalStatus for a given case.
 * @param caseId The CaseID of the document to update.
 * @param status The new status ("Approved" or "Rejected").
 * @returns A result object indicating success or failure.
 */
export async function updateApprovalStatus(caseId: string, status: "Approved" | "Rejected") {
    let client: MongoClient | null = null;
    try {
        if (!caseId) {
            throw new Error('CaseID is required.');
        }

        const { client: connectedClient, db } = await connectToDatabase();
        client = connectedClient;

        // Update the 'ApprovalStatus' field in the 'cases' collection
        const result = await db.collection('cases').updateOne(
            { CaseID: caseId },
            { $set: { ApprovalStatus: status } }
        );

        if (result.matchedCount === 0) {
            return { success: false, message: `Case with CaseID ${caseId} not found.` };
        }
        
        // Revalidate the current page to reflect the updated data immediately.
        // Adjust the path to match your page's route. E.g., '/prescription/[CaseID]'
        revalidatePath(`/prescription/${caseId}`);

        return { success: true, message: `ApprovalStatus updated to ${status}.`, modifiedCount: result.modifiedCount };

    } catch (error) {
        console.error(`Error updating approval status to ${status} for CaseID ${caseId}:`, error);
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
        if (client) {
            await client.close();
        }
    }
}