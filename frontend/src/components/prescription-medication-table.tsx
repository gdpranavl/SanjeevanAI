// components/prescription-medication-table.tsx
'use client'; // This directive marks it as a Client Component

import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner"; // For toasts (assuming sonner is installed as previously decided)

// Shadcn/ui dropdown components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // For M, A, E, N dosage
import { Input } from "@/components/ui/input"; // For Timing details and Additional Notes
import { Badge } from "@/components/ui/badge"; // Ensure Badge is imported if used here

// Import the server action
import { addMedicationItemToPrescription } from "@/app/actions";

// Type for a medication that will be displayed in the table (includes local state props like isNew)
type MedicationForTable = {
  id: string; // Client-side unique ID for new rows or unique identifier for existing
  name: string; // Medication Name (from MedicationDetails)
  medicationId: string | null; // MedicationID from DB (for lookup/saving)
  dosage: string; // Formatted dosage string for display
  rawDosage: { M: boolean; A: boolean; E: boolean; N: boolean }; // Raw object for saving
  frequency: string; // Timing.DailyTimes
  duration: string; // Timing.Duration
  foodRelation: string; // Timing.FoodRelation
  additionalNotes: string; // AdditionalNotes
  isExisting: boolean; // True if it came from DB, false if newly added
  isEditing: boolean; // For managing inline edit state
};

// Type for medication data from DB for dropdown
type AvailableMedication = {
  MedicationID: string;
  MedicationName: string;
};

type PrescriptionMedicationTableProps = {
  caseId: string;
  initialMedications: MedicationForTable[]; // Medications loaded from the server
  availableMedications: AvailableMedication[]; // All available medications from DB
};

export function PrescriptionMedicationTable({ 
  caseId, 
  initialMedications, 
  availableMedications 
}: PrescriptionMedicationTableProps) {
  // Manage all medications, both existing and newly added ones locally
  const [medications, setMedications] = useState<MedicationForTable[]>(initialMedications);
  const [savingId, setSavingId] = useState<string | null>(null); // To track which row is currently saving

  // Optional: If initialMedications can change (e.g., from revalidatePath), sync them.
  // Note: revalidatePath often causes a full component remount for server components,
  // which re-initializes client components too. So, this might be less critical.
  // useEffect(() => {
  //   setMedications(initialMedications);
  // }, [initialMedications]);

  const handleAddMedication = () => {
    setMedications(prevMedications => [
      ...prevMedications,
      {
        id: `new-${Date.now()}`, // Unique ID for client-side tracking (e.g., new-1700000000)
        name: "Select Medication", // Default display
        medicationId: null, // No ID initially, will be set from dropdown
        dosage: "Not specified",
        rawDosage: { M: false, A: false, E: false, N: false },
        frequency: "",
        duration: "",
        foodRelation: "", // Default empty
        additionalNotes: "", // Default empty
        isExisting: false,
        isEditing: true, // New rows start in editing mode
      },
    ]);
  };

  const handleMedicationChange = (id: string, field: string, value: any) => {
    setMedications(prevMedications =>
      prevMedications.map(med => {
        if (med.id === id) {
          if (field === "medicationId") {
            // Find the selected medication's name from available list
            const selectedMed = availableMedications.find(availMed => availMed.MedicationID === value);
            return {
              ...med,
              medicationId: value,
              name: selectedMed ? selectedMed.MedicationName : "Unknown Medication",
            };
          } else if (field.startsWith("rawDosage.")) {
            // Handle checkbox changes for M, A, E, N for dosage
            const dosagePart = field.split('.')[1] as keyof MedicationForTable['rawDosage'];
            const newRawDosage = { ...med.rawDosage, [dosagePart]: value };
            return {
                ...med,
                rawDosage: newRawDosage,
                dosage: formatDosageDisplay(newRawDosage) // Update the display string
            };
          } else {
            // For other text inputs
            return { ...med, [field]: value };
          }
        }
        return med;
      })
    );
  };

  // Helper to format the dosage display string from rawDosage object
  const formatDosageDisplay = (dosage: { M: boolean; A: boolean; E: boolean; N: boolean }): string => {
    if (!dosage) return "Not specified";
    const parts = [];
    if (dosage.M) parts.push("Morning");
    if (dosage.A) parts.push("Afternoon");
    if (dosage.E) parts.push("Evening");
    if (dosage.N) parts.push("Night");
    return parts.length > 0 ? parts.join(', ') : "Not specified";
  };

  const handleEditToggle = (id: string) => {
    setMedications(prevMedications =>
      prevMedications.map(med =>
        med.id === id ? { ...med, isEditing: !med.isEditing } : med
      )
    );
  };

  const handleDelete = (id: string) => {
    // In a real application, you'd likely have a server action to remove this from the database
    // as well, especially if it's an 'existing' medication.
    // For this example, it only removes from the client-side state.
    setMedications(prevMedications => prevMedications.filter(med => med.id !== id));
    toast.info("Medication row removed.", {
      description: "Note: This change is not yet saved to the database unless a full prescription save is triggered elsewhere."
    });
  };

  const handleSaveMedication = async (med: MedicationForTable) => {
    if (!med.medicationId) {
        toast.error("Validation Error", { description: "Please select a medication before saving." });
        return;
    }
    // Set saving state for this specific row to show loading feedback
    setSavingId(med.id); 

    // Construct the data exactly as the MongoDB schema expects for a MedicationItem
    const medicationItemToSave = {
        MedicationPlan: {
            Main: med.medicationId, // The MedicationID string
        },
        Dosage: med.rawDosage,
        Timing: {
            DailyTimes: med.frequency,
            Duration: med.duration,
            FoodRelation: med.foodRelation,
        },
        AdditionalNotes: med.additionalNotes,
    };

    const result = await addMedicationItemToPrescription(caseId, medicationItemToSave);
    setSavingId(null); // Reset saving state

    if (result.success) {
        toast.success("Medication Added!", {
            description: result.message + " The page will now refresh to show the updated list from the database."
        });
        // revalidatePath in the server action will cause the PrescriptionPage (Server Component) to re-render,
        // which will fetch the new data, effectively updating this component.
        // So, no explicit local state update is needed for the just-added item.
    } else {
        toast.error("Failed to add Medication", {
            description: result.message,
        });
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
              <CardTitle className="flex items-center gap-2">
                  <Pill className="h-6 w-6"/>
                  Recommended Prescription
              </CardTitle>
              <CardDescription>Status: Pending Doctor Approval</CardDescription> {/* You can optionally pass ApprovalStatus as prop here */}
          </div>
          <Button onClick={handleAddMedication}>
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
              <TableHead className="w-[150px]">Notes</TableHead> {/* New column for notes */}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medications.map((med) => (
              <TableRow key={med.id}>
                <TableCell className="font-medium">
                  {med.isEditing ? (
                    <Select
                      onValueChange={(value) => handleMedicationChange(med.id, "medicationId", value)}
                      value={med.medicationId || undefined}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a medication">
                          {/* Display the selected name if available, else the placeholder */}
                          {med.name && med.name !== "Select Medication" ? med.name : "Select a medication"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableMedications.map(availMed => (
                          <SelectItem key={availMed.MedicationID} value={availMed.MedicationID}>
                            {availMed.MedicationName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      {med.name}
                      {med.isExisting && <Badge variant="secondary" className="ml-2">Existing</Badge>}
                    </>
                  )}
                </TableCell>
                <TableCell>
                  {med.isEditing ? (
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${med.id}-M`}
                          checked={med.rawDosage.M}
                          onCheckedChange={(checked) => handleMedicationChange(med.id, "rawDosage.M", checked)}
                        />
                        <label htmlFor={`${med.id}-M`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Morning
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${med.id}-A`}
                          checked={med.rawDosage.A}
                          onCheckedChange={(checked) => handleMedicationChange(med.id, "rawDosage.A", checked)}
                        />
                        <label htmlFor={`${med.id}-A`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Afternoon
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${med.id}-E`}
                          checked={med.rawDosage.E}
                          onCheckedChange={(checked) => handleMedicationChange(med.id, "rawDosage.E", checked)}
                        />
                        <label htmlFor={`${med.id}-E`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Evening
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${med.id}-N`}
                          checked={med.rawDosage.N}
                          onCheckedChange={(checked) => handleMedicationChange(med.id, "rawDosage.N", checked)}
                        />
                        <label htmlFor={`${med.id}-N`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Night
                        </label>
                      </div>
                    </div>
                  ) : (
                    med.dosage
                  )}
                </TableCell>
                <TableCell>
                  {med.isEditing ? (
                    <Input
                      value={med.frequency}
                      onChange={(e) => handleMedicationChange(med.id, "frequency", e.target.value)}
                      placeholder="e.g., Once daily, 8 AM"
                    />
                  ) : (
                    med.frequency || "N/A"
                  )}
                </TableCell>
                <TableCell>
                  {med.isEditing ? (
                    <Input
                      value={med.duration}
                      onChange={(e) => handleMedicationChange(med.id, "duration", e.target.value)}
                      placeholder="e.g., 7 days, until symptoms resolve"
                    />
                  ) : (
                    med.duration || "N/A"
                  )}
                </TableCell>
                <TableCell>
                  {med.isEditing ? (
                    <Input
                      value={med.additionalNotes}
                      onChange={(e) => handleMedicationChange(med.id, "additionalNotes", e.target.value)}
                      placeholder="Add notes (optional)"
                    />
                  ) : (
                    med.additionalNotes || "N/A"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {med.isEditing ? (
                    // Display Save button (PlusCircle icon) if editing
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleSaveMedication(med)}
                        disabled={!med.medicationId || savingId === med.id} // Disable if no medication selected or currently saving this row
                    >
                        {savingId === med.id ? '...' : <PlusCircle className="h-4 w-4" />}
                    </Button>
                  ) : (
                    // Display Edit button (Pencil icon) if not editing (for existing items)
                    <Button variant="ghost" size="icon" onClick={() => handleEditToggle(med.id)}>
                        <Pencil className="h-4 w-4"/>
                    </Button>
                  )}
                   <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(med.id)}>
                      <Trash2 className="h-4 w-4"/>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {medications.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                  No medications added yet. Click "Add Medication" to start.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}