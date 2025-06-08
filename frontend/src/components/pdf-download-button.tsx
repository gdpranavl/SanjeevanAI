// components/pdf-download-button.tsx
"use client";

import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// Import the PrescriptionReport and its types directly
import { PrescriptionReport } from "@/components/reports/PrescriptionReport";
import type { Patient, CaseDetails, Medication } from "@/components/reports/PrescriptionReport";

interface PdfDownloadButtonProps {
    patient: Patient;
    caseDetails: CaseDetails;
    medications: Medication[];
    fileName: string;
}

export function PdfDownloadButton({ patient, caseDetails, medications, fileName }: PdfDownloadButtonProps) {
    return (
        <PDFDownloadLink
            document={
                <PrescriptionReport
                    patient={patient}
                    caseDetails={caseDetails}
                    medications={medications}
                />
            }
            fileName={fileName}
        >
            {({ loading }) => (
                <Button disabled={loading} className="w-full sm:w-auto">
                    {loading ? "Generating PDF..." : <><Download className="mr-2 h-4 w-4" /> Download PDF</>}
                </Button>
            )}
        </PDFDownloadLink>
    );
}