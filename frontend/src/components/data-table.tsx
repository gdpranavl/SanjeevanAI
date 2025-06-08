"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, FileText, Phone, Mail } from "lucide-react"

interface CaseData {
  _id: string
  PatientID: string
  name: string
  age: number
  gender: string
  diagnosis: string
  speciality: string
  ApprovalStatus: string
  CriticalityNumber: number
  medicalHistory: string
  contactNo: string
  email: string
}

interface DataTableProps {
  data: CaseData[]
}

export function DataTable({ data }: DataTableProps) {
  const getSeverityColor = (criticality: number) => {
    if (criticality >= 8) return "destructive"
    if (criticality >= 5) return "secondary" 
    return "default"
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('approved') && !statusLower.includes('not')) {
      return "default" // Green
    }
    return "destructive" // Red
  }

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "N/A"
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">No cases found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[180px] font-semibold">Patient Info</TableHead>
                <TableHead className="w-[250px] font-semibold">Diagnosis</TableHead>
                <TableHead className="w-[120px] font-semibold text-center">Severity</TableHead>
                <TableHead className="w-[200px] font-semibold">Medical History</TableHead>
                <TableHead className="w-[140px] font-semibold">Speciality</TableHead>
                <TableHead className="w-[120px] font-semibold text-center">Status</TableHead>
                <TableHead className="w-[100px] font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((case_item, index) => (
                <TableRow key={case_item._id || index} className="hover:bg-gray-50">
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
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Phone className="h-3 w-3" />
                          </Button>
                        )}
                        {case_item.email && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
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
                      {case_item.diagnosis && case_item.diagnosis.length > 80 && (
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
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
                      {case_item.CriticalityNumber ? `Level ${case_item.CriticalityNumber}` : 'Low'}
                    </Badge>
                  </TableCell>

                  {/* Medical History */}
                  <TableCell className="p-4">
                    <div className="text-sm text-gray-600">
                      {truncateText(case_item.medicalHistory, 60)}
                    </div>
                  </TableCell>

                  {/* Speciality */}
                  <TableCell className="p-4">
                    <Badge variant="outline" className="text-xs">
                      {case_item.speciality || 'General'}
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
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
  )
}
