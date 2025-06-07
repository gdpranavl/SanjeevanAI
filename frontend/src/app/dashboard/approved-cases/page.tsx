import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { MongoClient } from 'mongodb';

const uri = process.env.DATABASE_URL!;

async function connectToDatabase() {
    try {
        if (!uri) {
            throw new Error('DATABASE_URL environment variable is not set');
        }
        
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('maindb');
        console.log('Connected to database: maindb');
        return { client, db };
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}

async function getApprovedCases() {
    let client;
    try {
        const connection = await connectToDatabase();
        client = connection.client;
        const db = connection.db;

        const cases = await db.collection('cases').aggregate([
            {
                $match: {
                    $or: [
                        { ApprovalStatus: "Approved" },
                        { ApprovalStatus: "approved" },
                        { ApprovalStatus: "APPROVED" },
                        { ApprovalStatus: { $regex: /^approved$/i } },
                        { ApprovalStatus: true }
                    ]
                }
            },
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
        ]).toArray();
        
        console.log(`Found ${cases.length} approved cases with patient details`);
        if (cases.length > 0) {
            console.log('Sample approved case:', JSON.stringify(cases[0], null, 2));
        }
        
        return JSON.parse(JSON.stringify(cases));
    } catch (error) {
        console.error('Error fetching approved cases:', error);
        return [];
    } finally {
        if (client) {
            try {
                await client.close();
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
}

export default async function Page() {
    let approvedCases = [];
    let error = null;

    try {
        approvedCases = await getApprovedCases();
    } catch (err) {
        console.error('Page error:', err);
        error = err instanceof Error ? err.message : 'Unknown error occurred';
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }
    
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            <SectionCards />
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold">
                                    Approved Cases ({approvedCases.length})
                                </h2>
                                {approvedCases.length === 0 && (
                                    <p className="text-gray-500 mt-2">No approved cases found</p>
                                )}
                            </div>
                            <DataTable data={approvedCases} />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
