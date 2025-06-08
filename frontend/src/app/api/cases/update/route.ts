import { MongoClient } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'

const uri = process.env.DATABASE_URL!

async function connectToDatabase() {
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db('maindb')
    return { client, db }
}

export async function POST(request: NextRequest) {
    let client

    try {
        const { caseId, updates } = await request.json()

        if (!caseId || !updates) {
            return NextResponse.json(
                { error: 'Case ID and updates are required' },
                { status: 400 }
            )
        }

        const connection = await connectToDatabase()
        client = connection.client
        const db = connection.db

        // Prepare update object
        const updateObject: any = {
            $set: {}
        }

        // Update RADS fields
        if (updates.diagnosis) {
            updateObject.$set['RADS.Diagnosis'] = updates.diagnosis
        }
        if (updates.research) {
            updateObject.$set['RADS.Research'] = updates.research
        }
        if (updates.analysis) {
            updateObject.$set['RADS.Analysis'] = updates.analysis
        }
        if (updates.Summary) {
            updateObject.$set['Summary'] = updates.Summary
        }

        // Add additional notes to prescriptions if provided
        if (updates.additionalNotes) {
            updateObject.$push = {
                'Prescriptions': {
                    timestamp: new Date().toISOString(),
                    type: 'doctor_notes',
                    content: updates.additionalNotes,
                    addedBy: 'doctor' // You can get this from authentication
                }
            }
        }

        // Update the case
        const result = await db.collection('cases').updateOne(
            { _id: caseId },
            updateObject
        )

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Case not found' },
                { status: 404 }
            )
        }

        // Fetch the updated case with patient details
        const updatedCase = await db.collection('cases').aggregate([
            { $match: { _id: caseId } },
            {
                $lookup: {
                    from: 'patients',
                    localField: 'PatientID',
                    foreignField: 'patientID',
                    as: 'patientDetails'
                }
            },
            {
                $unwind: {
                    path: '$patientDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    PatientID: 1,
                    ApprovalStatus: 1,
                    CriticalityNumber: 1,
                    Summary: 1,
                    Transcripts: 1,
                    PrescriptionID: 1,
                    Timestamp: 1,
                    diagnosis: '$RADS.Diagnosis',
                    speciality: '$RADS.Speciality',
                    research: '$RADS.Research',
                    analysis: '$RADS.Analysis',
                    name: '$patientDetails.patientName',
                    age: '$patientDetails.patientAge',
                    gender: '$patientDetails.gender',
                    contactNo: '$patientDetails.contactNo',
                    email: '$patientDetails.email',
                    height: '$patientDetails.height',
                    weight: '$patientDetails.weight',
                    medicalHistory: '$patientDetails.medicalHistory.summary',
                    allergies: '$patientDetails.allergies'
                }
            }
        ]).toArray()

        return NextResponse.json(updatedCase[0])

    } catch (error) {
        console.error('Error updating case:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    } finally {
        if (client) {
            await client.close()
        }
    }
}
