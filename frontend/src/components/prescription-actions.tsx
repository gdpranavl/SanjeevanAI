// components/prescription-actions.tsx
'use client';

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner"; // Using 'sonner'
import { updateApprovalStatus } from "@/app/actions";
import { useState } from "react";

type PrescriptionActionsProps = {
    caseId: string;
    patientName: string;
    currentStatus: "Pending" | "Approved" | "Rejected"; // This type correctly reflects all possibilities for status, but the button logic will ignore it for disabling.
};

export function PrescriptionActions({ caseId, patientName, currentStatus }: PrescriptionActionsProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Removed: const isDecisionMade = currentStatus === "Approved" || currentStatus === "Rejected";
    // The buttons will always be active unless a submission is in progress.

    const handleApproval = async () => {
        setIsSubmitting(true);
        const result = await updateApprovalStatus(caseId, "Approved");
        setIsSubmitting(false);

        if (result.success) {
            toast.success("Prescription Approved!", {
                description: `Case ID ${caseId} for ${patientName} has been approved.`,
            });
        } else {
            toast.error("Approval Failed", {
                description: result.message || "There was an error approving the prescription.",
            });
        }
    };

    const handleRevisionRequest = async () => {
        setIsSubmitting(true);
        const result = await updateApprovalStatus(caseId, "Rejected");
        setIsSubmitting(false);

        if (result.success) {
            toast.info("Revision Requested!", {
                description: `Case ID ${caseId} for ${patientName} has been rejected and resent for re-evaluation.`,
            });
        } else {
            toast.error("Revision Request Failed", {
                description: result.message || "There was an error requesting a revision.",
            });
        }
    };

    return (
        <div className="flex justify-end space-x-4 pt-4">
            <Button
                variant="outline"
                onClick={handleRevisionRequest}
                disabled={isSubmitting} // ONLY disabled while submitting
            >
                <AlertCircle className="mr-2 h-4 w-4" /> Request AI Revision
            </Button>
            <Button
                size="lg"
                onClick={handleApproval}
                disabled={isSubmitting} // ONLY disabled while submitting
            >
                Approve & Finalize Prescription
            </Button>
        </div>
    );
}