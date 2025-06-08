// app/prescription/[caseId]/page.tsx

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
  Lightbulb,
  Mic,
  Camera,
  PlusCircle,
  Pencil,
  Trash2,
  AlertCircle,
  Paperclip,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";

// --- TYPE DEFINITIONS (Based on your schema) ---
type Patient = {
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  height: string;
  weight: string;
  allergies: string[];
};

type Medication = {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  isExisting: boolean;
};

type PrescriptionPageProps = {
  params: {
    caseId: string;
  };
};

// --- MOCK DATA (Simulating data fetched from your backend) ---
const patientData: Patient = {
  name: "Priya Sharma",
  age: 42,
  gender: "Female",
  height: "165 cm",
  weight: "68 kg",
  allergies: ["Pollen", "No Known Drug Allergies"],
};

const caseDetails = {
  prescriptionId: "P-98124",
  date: "June 07, 2025, 10:30 AM",
  aiSummary:
    "Patient reports a persistent dry cough, wheezing, and shortness of breath, worsening over the last 3 days. Symptoms are more pronounced at night and during physical activity.",
  aiDiagnosis: "Moderate Persistent Asthma",
  aiJustification: "The combination of wheezing, dyspnea, and cough, along with exacerbating factors, strongly indicates asthma. The reported severity and frequency align with a moderate persistent classification.",
  confidence: 85,
  medicalHistory: "Patient has a 5-year history of Hypertension (HTN) and Chronic Kidney Disease (CKD). Currently managed with Metformin. No prior history of respiratory issues.",
  historyTags: ["Hypertension", "CKD"],
  transcript: `AI: Hello, this is SanjeevanAI. How can I help you today?
Patient: Hello, I've been having trouble breathing for a few days.
AI: I see. Can you describe the feeling? Is it a cough, or something else?
Patient: It's a dry cough, and I feel a wheezing sound when I breathe. It's worse when I lie down.
... (full transcript continues) ...`,
};

const prescriptionData: Medication[] = [
  { id: 1, name: "Albuterol", dosage: "90 mcg", frequency: "2 puffs every 4-6 hours as needed", duration: "30 Days", isExisting: false },
  { id: 2, name: "Fluticasone", dosage: "110 mcg", frequency: "1 puff twice daily", duration: "90 Days", isExisting: false },
  { id: 3, name: "Metformin", dosage: "500 mg", frequency: "1 tablet twice daily", duration: "Ongoing", isExisting: true },
];

// --- MAIN PAGE COMPONENT ---
export default function PrescriptionPage({ params }: PrescriptionPageProps) {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background text-foreground">
        {/* 1. Page Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Patient: {patientData.name}
            </h2>
            <p className="text-muted-foreground">
              Case ID: {params.caseId} / Prescription ID: {caseDetails.prescriptionId}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Consultation Date</p>
            <p className="font-medium">{caseDetails.date}</p>
          </div>
        </div>

        {/* 2. Patient Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Age / Gender</p>
              <p className="text-lg font-semibold">{patientData.age} / {patientData.gender}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Height / Weight</p>
              <p className="text-lg font-semibold">{patientData.height} / {patientData.weight}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Known Allergies</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {patientData.allergies.map((allergy) => (
                  <Badge key={allergy} variant="secondary">{allergy}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. AI Report & Case Details (Grid Layout) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Medical History */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Medical History (AI Summary)</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm">{caseDetails.medicalHistory}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                  {caseDetails.historyTags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
              </div>
            </CardContent>
          </Card>
          
          {/* AI Summarization */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">AI Summarization</CardTitle>
              <BrainCircuit className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm">{caseDetails.aiSummary}</p>
            </CardContent>
          </Card>

          {/* AI Diagnosis */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">AI Diagnosis & Justification</CardTitle>
              <Stethoscope className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{caseDetails.aiDiagnosis}</p>
              <p className="text-sm text-muted-foreground mb-2">Confidence: {caseDetails.confidence}%</p>
              <p className="text-sm">{caseDetails.aiJustification}</p>
            </CardContent>
          </Card>
          
          {/* Attachments (Pictures & Transcript) */}
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
                          value={caseDetails.transcript}
                          className="h-24 text-xs bg-muted border-none"
                      />
                  </CardContent>
              </Card>
          </div>
        </div>

        {/* 4. Interactive Prescription Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                  <CardTitle className="flex items-center gap-2">
                      <Pill className="h-6 w-6"/>
                      Recommended Prescription
                  </CardTitle>
                  <CardDescription>Status: Pending Doctor Approval</CardDescription>
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
                {prescriptionData.map((med) => (
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

        {/* 5. Doctor's Action Bar */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button variant="outline">
              <AlertCircle className="mr-2 h-4 w-4" /> Request AI Revision
          </Button>
          <Button size="lg">Approve & Finalize Prescription</Button>
        </div>
      </div>
    </AppLayout>
  );
}