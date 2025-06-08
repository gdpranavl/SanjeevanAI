// app/prescription/[CaseID]/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Keep this for other static buttons
import {
  // Table, TableBody, TableCell, TableHead, TableHeader, TableRow, // These are now managed inside PrescriptionMedicationTable
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Stethoscope,
  BrainCircuit,
  // Pill, PlusCircle, Pencil, Trash2, // These icons are now used within PrescriptionMedicationTable
  Mic,
  Camera,
  XCircle,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { MongoClient } from 'mongodb';

// Import existing client component for actions
import { PrescriptionActions } from "@/components/prescription-actions";
// Import NEW server action and NEW client component
import { getAllMedicationsForDropdown } from "@/app/actions"; 
import { PrescriptionMedicationTable } from "@/components/prescription-medication-table";


const uri = process.env.MONGODB_URI;

// Type definition for medications as they come out of the aggregation pipeline
type ProcessedMedicationFromDB = {
  Dosage: { M: boolean; A: boolean; E: boolean; N: boolean; };
  Timing: { DailyTimes: string; Duration: string; FoodRelation: string; };
  AdditionalNotes: string;
  MedicationDetails: {
    MedicationID: string;
    MedicationName: string;
  } | null;
};

// Type definition for medications as prepared for the client-side table component
type MedicationForTable = {
  id: string; // Client-side unique ID for new rows
  name: string; // Medication Name (from MedicationDetails)
  medicationId: string | null; // MedicationID from DB (for lookup/saving)
  dosage: string; // Formatted dosage string for display
  rawDosage: { M: boolean; A: boolean; E: boolean; N: boolean }; // Raw object for saving
  frequency: string; // Timing.DailyTimes
  duration:string;
  foodRelation: string; // Timing.FoodRelation
  additionalNotes: string; // AdditionalNotes
  isExisting: boolean; // True if it came from DB, false if newly added
  isEditing: boolean; // For managing inline edit state
};

type CaseData = {
    caseId: string;
    prescriptionId: string;
    date: string;
    aiSummary: string;
    aiDiagnosis: string;
    aiJustification: string;
    transcript: string | string[];
    patientName: string;
    patientAge: number;
    patientGender: "Male" | "Female" | "Other";
    patientHeight: string;
    patientWeight: string;
    patientAllergies: string[];
    medicalHistory: string;
    processedMedications: ProcessedMedicationFromDB[]; 
    ApprovalStatus: "Pending" | "Approved" | "Rejected";
};

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

// Helper function to format dosage for display purposes, used both on server and in client component
function formatDosage(dosage: { M: boolean; A: boolean; E: boolean; N: boolean }): string {
    if (!dosage) return "Not specified";
    const parts = [];
    if (dosage.M) parts.push("Morning");
    if (dosage.A) parts.push("Afternoon");
    if (dosage.E) parts.push("Evening");
    if (dosage.N) parts.push("Night");
    return parts.length > 0 ? parts.join(', ') : "Not specified";
}


async function getPrescriptionByCaseId(CaseID: string): Promise<CaseData | null> {
    let client;
    try {
        const { client: connectedClient, db } = await connectToDatabase();
        client = connectedClient;

        const results: CaseData[] = await db.collection('prescriptions').aggregate([
            { $match: { CaseID: CaseID } },
            // If there are no MedicationItems, $unwind will remove the document.
            // Ensure this is intended behavior or add { preserveNullAndEmptyArrays: true }
            // Given the input schema and behavior, it likely means we want to process only items.
            { $unwind: { path: '$MedicationItems', preserveNullAndEmptyArrays: true } }, 
            {
                $lookup: {
                    from: 'medications',
                    localField: 'MedicationItems.MedicationPlan.Main', // Look up using MedicationID from MedicationItems
                    foreignField: 'MedicationID',
                    as: 'mainMedicationDetails'
                }
            },
            { $unwind: { path: '$mainMedicationDetails', preserveNullAndEmptyArrays: true } }, // Ensure lookup details don't drop the item if no match
            {
                $group: {
                    _id: '$_id',
                    CaseID: { $first: '$CaseID' },
                    PatientID: { $first: '$PatientID' },
                    PrescriptionID: { $first: '$PrescriptionID' },
                    MajorNotes: { $first: '$MajorNotes' },
                    processedMedications: { // Collect all processed medication items into an array
                        $push: {
                            // Check if MedicationItems exists for current processing (if preserveNullAndEmptyArrays was true above)
                            // This ensures an item for 'null' MedicationItems isn't created.
                            $cond: [
                                '$MedicationItems', // If MedicationItems exists
                                {
                                    Dosage: '$MedicationItems.Dosage',
                                    Timing: '$MedicationItems.Timing',
                                    AdditionalNotes: '$MedicationItems.AdditionalNotes',
                                    MedicationDetails: '$mainMedicationDetails'
                                },
                                '$$REMOVE' // If MedicationItems doesn't exist, remove this pushed element
                            ]
                        }
                    }
                }
            },
            // The rest of your lookups remain the same
            {
                $lookup: {
                    from: 'cases',
                    localField: 'CaseID',
                    foreignField: 'CaseID',
                    as: 'caseDetails'
                }
            },
            {
                $lookup: {
                    from: 'patients',
                    localField: 'PatientID',
                    foreignField: 'PatientID',
                    as: 'patientDetails'
                }
            },
            { $unwind: { path: '$caseDetails', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$patientDetails', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: { $toString: '$_id' },
                    caseId: '$CaseID',
                    prescriptionId: '$PrescriptionID',
                    majorNotes: '$MajorNotes',
                    date: '$caseDetails.Timestamp',
                    aiSummary: '$caseDetails.Summary',
                    aiDiagnosis: '$caseDetails.RADS.Diagnosis',
                    aiJustification: '$caseDetails.RADS.Analysis',
                    transcript: '$caseDetails.Transcripts',
                    patientName: '$patientDetails.PatientName',
                    patientAge: '$patientDetails.PatientAge',
                    patientGender: '$patientDetails.Gender',
                    patientHeight: '$patientDetails.Height',
                    patientWeight: '$patientDetails.Weight',
                    patientAllergies: '$patientDetails.Allergies',
                    medicalHistory: '$patientDetails.MedicalHistory.Summary',
                    processedMedications: '$processedMedications',
                    ApprovalStatus: '$caseDetails.ApprovalStatus',
                }
            }
        ]).toArray() as any[];
      
        // Filter out any potential null/undefined processedMedications if the original array was empty
        // The $cond in group stage should prevent this for original unwind + group, but defensive
        if (results.length > 0 && results[0].processedMedications) {
            results[0].processedMedications = results[0].processedMedications.filter(med => med);
        }

        const data = results.length > 0 ? results[0] : null;
        return JSON.parse(JSON.stringify(data));
      
    } catch (error) {
        console.error(`Error fetching prescription for CaseID ${CaseID}:`, error);
        throw new Error("Failed to fetch prescription data from the database.");
    } finally {
        if (client) {
            await client.close();
        }
    }
}


type PrescriptionPageProps = {
  params: {
    CaseID: string;
  };
};


export default async function PrescriptionPage({ params }: PrescriptionPageProps) {
    let caseData: CaseData | null = null;
    let error: string | null = null;
    // Define type for allMedicationsFromDB as fetched by the action
    let allMedicationsFromDB: { MedicationID: string; MedicationName: string; }[] = [];
    
    try {
        if (!uri) throw new Error('Database connection string is not configured.');
        caseData = await getPrescriptionByCaseId(params.CaseID);
        // Fetch the full list of medications to pass to the client component for its dropdowns
        allMedicationsFromDB = await getAllMedicationsForDropdown(); 
    } catch (err) {
        console.error("Page error:", err);
        error = err instanceof Error ? err.message : "An unknown error occurred.";
    }

    if (error) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <XCircle className="w-16 h-16 text-destructive mb-4" />
                    <h1 className="text-2xl font-bold text-destructive mb-2">Error Loading Case</h1>
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </AppLayout>
        );
    }

    if (!caseData) {
       return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Prescription Not Found</h1>
                    <p className="text-muted-foreground">No prescription data could be found for Case ID "{params.CaseID}".</p>
                </div>
            </AppLayout>
        );
    }
    
    // Map initial medications from fetched CaseData (ProcessedMedicationFromDB)
    // to the format expected by the client-side PrescriptionMedicationTable component (MedicationForTable).
    const initialMedicationsForTable: MedicationForTable[] = 
        (caseData.processedMedications || []).map((med: ProcessedMedicationFromDB, index) => ({
            id: `existing-${med.MedicationDetails?.MedicationID || index}-${Date.now()}`, // Unique ID for keying
            name: med.MedicationDetails?.MedicationName || "Unknown Medication",
            medicationId: med.MedicationDetails?.MedicationID || null, // Ensure ID is part of the mapped data
            dosage: formatDosage(med.Dosage), 
            rawDosage: med.Dosage, // Keep raw dosage for editing
            frequency: med.Timing?.DailyTimes || "Not specified",
            duration: med.Timing?.Duration || "Not specified",
            foodRelation: med.Timing?.FoodRelation || "", // Include foodRelation from DB
            additionalNotes: med.AdditionalNotes || "", // Include additional notes from DB
            isExisting: true, // Mark as existing
            isEditing: false // Existing rows start not in editing mode
        }));


    const transcriptText = Array.isArray(caseData.transcript) 
        ? caseData.transcript.join('\n\n') 
        : caseData.transcript || "No transcript available.";

    return (
        <AppLayout>
          <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background text-foreground">
            <div className="flex items-center justify-between space-y-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Patient: {caseData.patientName}
                </h2>
                <p className="text-muted-foreground">
                  Case ID: {caseData.caseId} / Prescription ID: {caseData.prescriptionId}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Consultation Date</p>
                <p className="font-medium">{new Date(caseData.date).toLocaleString()}</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Patient Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Age / Gender</p>
                  <p className="text-lg font-semibold">{caseData.patientAge} / {caseData.patientGender}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Height / Weight</p>
                  <p className="text-lg font-semibold">{`${caseData.patientHeight}cm`} / {`${caseData.patientWeight}kg`}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Known Allergies</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(caseData.patientAllergies || []).map((allergy) => (
                      <Badge key={allergy} variant="secondary">{allergy}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Medical History (AI Summary)</CardTitle>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{caseData.medicalHistory}</p>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">AI Summarization</CardTitle>
                  <BrainCircuit className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{caseData.aiSummary}</p>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">AI Diagnosis & Justification</CardTitle>
                  <Stethoscope className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">{caseData.aiDiagnosis}</p>
                  <p className="text-sm">{caseData.aiJustification}</p>
                </CardContent>
              </Card>
              
              <div className="lg:col-span-1 grid gap-4">
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-base font-medium">Patient Uploads</CardTitle>
                          <Camera className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <p className="text-sm text-muted-foreground">No pictures uploaded for this case.</p>
                      </CardContent>
                  </Card>
                   <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-base font-medium">Conversation Transcript</CardTitle>
                          <Mic className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <Textarea
                              readOnly
                              value={transcriptText}
                              className="h-24 text-xs bg-muted border-none"
                          />
                      </CardContent>
                  </Card>
              </div>
            </div>

            {/* Render the new Medication Table Client Component */}
            <PrescriptionMedicationTable
                caseId={params.CaseID}
                initialMedications={initialMedicationsForTable}
                availableMedications={allMedicationsFromDB}
            />
            {/* End Medication Table Component */}

            {/* Action buttons (Approve/Reject) */}
            <PrescriptionActions
                caseId={params.CaseID}
                patientName={caseData.patientName}
                currentStatus={caseData.ApprovalStatus}
            />

          </div>
        </AppLayout>
      );
}