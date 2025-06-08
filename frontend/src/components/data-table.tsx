"use client";
import { useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Phone, Mail } from "lucide-react";

interface CaseData {
  _id: string;
  PatientID: string;
  name: string;
  age: number;
  caseID: string; // This should match your database field
  CaseID?: string; // Adding this as backup since your DB uses CaseID
  gender: string;
  diagnosis: string;
  speciality: string;
  ApprovalStatus: string;
  CriticalityNumber: number;
  medicalHistory: string;
  contactNo: string;
  email: string;
}

interface DataTableProps {
  data: CaseData[];
  onPatientSelect?: (patient: CaseData) => void;
}

export function DataTable({ data, onPatientSelect }: DataTableProps) {
  const router = useRouter();

  const getSeverityColor = (criticality: number) => {
    if (criticality >= 8) return "destructive";
    if (criticality >= 5) return "secondary";
    return "default";
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("approved") && !statusLower.includes("not")) {
      return "default"; // Green
    }
    return "destructive"; // Red
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "N/A";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  // Fixed: Handle row click navigation
  const handleRowClick = (case_item: CaseData, event: React.MouseEvent) => {
    // Prevent navigation if clicking on buttons
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }

    // Get the correct case ID - try both field names from your DB
    const caseId = case_item.CaseID || case_item.caseID;

    if (caseId) {
      // Fixed: Correct URL path (was /prescrption/, now /prescription/)
      router.push(`/prescription/${caseId}`);
    } else {
      console.error("No case ID found for patient:", case_item);
    }

    // Call optional callback for parent component
    onPatientSelect?.(case_item);
  };

  // Handle view button click
  const handleViewClick = (case_item: CaseData, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    const caseId = case_item.CaseID || case_item.caseID;
    if (caseId) {
      router.push(`/prescription/${caseId}`);
    }
  };

  // Handle contact button clicks
  const handleContactClick = (
    event: React.MouseEvent,
    action: string,
    value: string
  ) => {
    event.stopPropagation(); // Prevent row click

    if (action === "phone") {
      window.open(`tel:${value}`);
    } else if (action === "email") {
      window.open(`mailto:${value}`);
    }
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">No cases found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[180px] font-semibold">
                  Patient Info
                </TableHead>
                <TableHead className="w-[250px] font-semibold">
                  Diagnosis
                </TableHead>
                <TableHead className="w-[120px] font-semibold text-center">
                  Severity
                </TableHead>
                <TableHead className="w-[200px] font-semibold">
                  Case ID
                </TableHead>
                <TableHead className="w-[140px] font-semibold">
                  Speciality
                </TableHead>
                <TableHead className="w-[120px] font-semibold text-center">
                  Status
                </TableHead>
                <TableHead className="w-[100px] font-semibold text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((case_item, index) => (
                <TableRow
                  key={case_item._id || index}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={(event) => handleRowClick(case_item, event)}
                >
                  {/* Patient Info */}
                  <TableCell className="p-4">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {case_item.name || `Patient ${case_item.PatientID}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {case_item.PatientID}
                      </div>
                      <div className="text-xs text-gray-500">
                        {case_item.age}y • {case_item.gender}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {case_item.contactNo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) =>
                              handleContactClick(
                                e,
                                "phone",
                                case_item.contactNo
                              )
                            }
                            title={`Call ${case_item.contactNo}`}
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                        )}
                        {case_item.email && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) =>
                              handleContactClick(e, "email", case_item.email)
                            }
                            title={`Email ${case_item.email}`}
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Diagnosis */}
                  <TableCell className="p-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        {truncateText(case_item.diagnosis, 80)}
                      </div>
                      {case_item.diagnosis &&
                        case_item.diagnosis.length > 80 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle full diagnosis view
                            }}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            View Full
                          </Button>
                        )}
                    </div>
                  </TableCell>

                  {/* Severity */}
                  <TableCell className="p-4 text-center">
                    <Badge
                      variant={getSeverityColor(case_item.CriticalityNumber)}
                      className="text-xs"
                    >
                      {case_item.CriticalityNumber
                        ? `Level ${case_item.CriticalityNumber}`
                        : "Low"}
                    </Badge>
                  </TableCell>

                  {/* Case ID */}
                  <TableCell className="p-4">
                    <div className="text-sm text-gray-600 font-mono">
                      {case_item.CaseID || case_item.caseID || "N/A"}
                    </div>
                  </TableCell>

                  {/* Speciality */}
                  <TableCell className="p-4">
                    <Badge variant="outline" className="text-xs">
                      {case_item.speciality || "General"}
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="p-4 text-center">
                    <Badge
                      variant={getStatusColor(case_item.ApprovalStatus)}
                      className="text-xs"
                    >
                      {case_item.ApprovalStatus}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="p-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => handleViewClick(case_item, e)}
                      title="View Prescription"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
