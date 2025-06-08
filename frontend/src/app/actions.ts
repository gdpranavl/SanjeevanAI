// app/actions.ts (add to existing file, or create if it doesn't exist)
'use server'; // This directive marks the file as a Server Action module

import { MongoClient } from 'mongodb';
import { revalidatePath } from 'next/cache'; // Import for Next.js caching revalidation

const uri = process.env.MONGODB_URI;

// Ensure this connectToDatabase function is consistently defined/imported in all server contexts.
// Duplicated here for direct compilation, but ideally shared via a lib/db.ts
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

        const result = await db.collection('cases').updateOne(
            { CaseID: caseId },
            { $set: { ApprovalStatus: status } }
        );

        if (result.matchedCount === 0) {
            return { success: false, message: `Case with CaseID ${caseId} not found.` };
        }
        
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

// --- NEW SERVER ACTION: To add medication item to prescriptions collection ---
type NewMedicationItemToSave = {
  MedicationPlan: {
    Main: string; // This will be MedicationID
  };
  Dosage: { M: boolean; A: boolean; E: boolean; N: boolean; };
  Timing: { DailyTimes: string; Duration: string; FoodRelation: string; };
  AdditionalNotes: string; // Optional: can be empty initially
};

export async function addMedicationItemToPrescription(caseId: string, medicationItem: NewMedicationItemToSave) {
    let client: MongoClient | null = null;
    try {
        const { client: connectedClient, db } = await connectToDatabase();
        client = connectedClient;

        // Use $push to add a new item to the MedicationItems array
        const result = await db.collection('prescriptions').updateOne(
            { CaseID: caseId },
            { $push: { MedicationItems: medicationItem } }
        );

        if (result.matchedCount === 0) {
            return { success: false, message: `Prescription for CaseID ${caseId} not found.` };
        }
        
        // Revalidate the prescription page to show the newly added medication
        revalidatePath(`/prescription/${caseId}`); 

        return { success: true, message: `Medication item added successfully to CaseID ${caseId}.` };

    } catch (error) {
        console.error(`Error adding medication item for CaseID ${caseId}:`, error);
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

// --- NEW SERVER ACTION: To fetch all available medications for dropdowns ---
export async function getAllMedicationsForDropdown(): Promise<{ MedicationID: string; MedicationName: string; }[]> {
    let client: MongoClient | null = null;
    try {
        const { client: connectedClient, db } = await connectToDatabase();
        client = connectedClient;

        // Project only necessary fields (MedicationID and MedicationName) and exclude _id
        const medications = await db.collection('medications').find({}, {
            projection: { MedicationID: 1, MedicationName: 1, _id: 0 } 
        }).toArray() as { MedicationID: string; MedicationName: string; }[];

        // Return parsed JSON to ensure it's serializable across the network boundary
        return JSON.parse(JSON.stringify(medications));

    } catch (error) {
        console.error("Error fetching all medications:", error);
        throw new Error("Failed to fetch medication list.");
    } finally {
        if (client) {
            await client.close();
        }
    }
}