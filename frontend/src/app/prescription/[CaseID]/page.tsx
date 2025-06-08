import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Stethoscope,
  BrainCircuit,
  Pill,
  Mic,
  Camera,
  PlusCircle,
  Pencil,
  Trash2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { MongoClient } from 'mongodb'; // <--- FIX: Re-added this import
import { updateApprovalStatus } from "@/app/actions";

const uri = process.env.MONGODB_URI;

type ProcessedMedication = {
  Dosage: { M: boolean; A: boolean; E: boolean; N: boolean; };
  Timing: { DailyTimes: string; Duration: string; FoodRelation: string; };
  AdditionalNotes: string;
  MedicationDetails: {
    MedicationID: string;
    MedicationName: string;
  } | null;
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
    processedMedications: ProcessedMedication[];
    ApprovalStatus: "Pending" | "Approved" | "Rejected";
};

async function connectToDatabase() {
    try {
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is not set.');
        }
        const client = new MongoClient(uri); // This line needs MongoClient to be defined
        await client.connect();
        return { client, db: client.db('maindb') };
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}

async function getPrescriptionByCaseId(CaseID: string): Promise<CaseData | null> {
    let client;
    try {
        const { client: connectedClient, db } = await connectToDatabase();
        client = connectedClient;

        const results: CaseData[] = await db.collection('prescriptions').aggregate([
            { $match: { CaseID: CaseID } },
            { $unwind: '$MedicationItems' },
            {
                $lookup: {
                    from: 'medications',
                    localField: 'MedicationItems.MedicationPlan.Main',
                    foreignField: 'MedicationID',
                    as: 'mainMedicationDetails'
                }
            },
            { $unwind: { path: '$mainMedicationDetails', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$_id',
                    CaseID: { $first: '$CaseID' },
                    PatientID: { $first: '$PatientID' },
                    PrescriptionID: { $first: '$PrescriptionID' },
                    MajorNotes: { $first: '$MajorNotes' },
                    processedMedications: {
                        $push: {
                            Dosage: '$MedicationItems.Dosage',
                            Timing: '$MedicationItems.Timing',
                            AdditionalNotes: '$MedicationItems.AdditionalNotes',
                            MedicationDetails: '$mainMedicationDetails'
                        }
                    }
                }
            },
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


type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration:string;
  isExisting: boolean;
};

type PrescriptionPageProps = {
  params: {
    CaseID: string;
  };
};

function formatDosage(dosage: { M: boolean; A: boolean; E: boolean; N: boolean }): string {
    if (!dosage) return "Not specified";
    const parts = [];
    if (dosage.M) parts.push("Morning");
    if (dosage.A) parts.push("Afternoon");
    if (dosage.E) parts.push("Evening");
    if (dosage.N) parts.push("Night");
    return parts.length > 0 ? parts.join(', ') : "Not specified";
}

export default async function PrescriptionPage({ params }: PrescriptionPageProps) {
    let caseData: CaseData | null = null;
    let error: string | null = null;
    
    try {
      
        if (!uri) throw new Error('Database connection string is not configured.');
        caseData = await getPrescriptionByCaseId(params.CaseID);
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
    
    const allMedications: Medication[] = 
        (caseData.processedMedications || []).map((med: ProcessedMedication, index) => ({
            id: `rec-${med.MedicationDetails?.MedicationID || index}`,
            name: med.MedicationDetails?.MedicationName || "Unknown Medication",
            dosage: formatDosage(med.Dosage),
            frequency: med.Timing?.DailyTimes || "Not specified",
            duration: med.Timing?.Duration || "Not specified",
            isExisting: false
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

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                      <CardTitle className="flex items-center gap-2">
                          <Pill className="h-6 w-6"/>
                          Recommended Prescription
                      </CardTitle>
                      <CardDescription>Status: {caseData.ApprovalStatus || "N/A"}</CardDescription> 
                  </div>
                  <Button>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Medication
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Medication</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allMedications.map((med) => (
                      <TableRow key={med.id}>
                        <TableCell className="font-medium">
                          {med.name}
                          {med.isExisting && <Badge variant="secondary" className="ml-2">Existing</Badge>}
                        </TableCell>
                        <TableCell>{med.dosage}</TableCell>
                        <TableCell>{med.frequency}</TableCell>
                        <TableCell>{med.duration}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4"/>
                          </Button>
                           <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4"/>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4 pt-4">
              <form action={async () => {
                'use server';
                const result = await updateApprovalStatus(params.CaseID, "Rejected");
                if (!result.success) {
                    console.error("Failed to reject prescription:", result.message);
                }
              }}>
                <Button type="submit" variant="outline">
                    <AlertCircle className="mr-2 h-4 w-4" /> Request AI Revision
                </Button>
              </form>

              <form action={async () => {
                'use server';
                const result = await updateApprovalStatus(params.CaseID, "Approved");
                if (!result.success) {
                    console.error("Failed to approve prescription:", result.message);
                }
              }}>
                <Button type="submit" size="lg">Approve & Finalize Prescription</Button>
              </form>
            </div>
          </div>
        </AppLayout>
      );
}