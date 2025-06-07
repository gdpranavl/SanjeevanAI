"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Save, Check, Edit, X } from "lucide-react"

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
  Summary: string
  Transcripts: string
  PrescriptionID: string
  Timestamp: string
  research: string
  analysis: string
  height: string
  weight: string
  allergies: string[]
}

interface PatientDetailModalProps {
  caseData: CaseData
  caseType: "approved" | "pending" | "unapproved"
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedCase: CaseData) => void
}

export function PatientDetailModal({ 
  caseData, 
  caseType, 
  isOpen, 
  onClose, 
  onUpdate 
}: PatientDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<CaseData>(caseData)
  const [newNotes, setNewNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const canEdit = caseType === "pending"
  const canApprove = caseType === "pending"

  const handleSave = async () => {
    if (!canEdit) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/cases/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: editedData._id,
          updates: {
            diagnosis: editedData.diagnosis,
            research: editedData.research,
            analysis: editedData.analysis,
            Summary: editedData.Summary,
            additionalNotes: newNotes
          }
        }),
      })

      if (response.ok) {
        const updatedCase = await response.json()
        onUpdate(updatedCase)
        setIsEditing(false)
        setNewNotes("")
      }
    } catch (error) {
      console.error('Error updating case:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!canApprove) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/cases/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: editedData._id,
          updates: {
            diagnosis: editedData.diagnosis,
            research: editedData.research,
            analysis: editedData.analysis,
            Summary: editedData.Summary,
            additionalNotes: newNotes
          }
        }),
      })

      if (response.ok) {
        const approvedCase = await response.json()
        onUpdate(approvedCase)
        onClose()
      }
    } catch (error) {
      console.error('Error approving case:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Patient Details - {editedData.name || `Patient ${editedData.PatientID}`}
            <div className="flex gap-2">
              <Badge variant={caseType === "approved" ? "default" : caseType === "pending" ? "secondary" : "destructive"}>
                {editedData.ApprovalStatus}
              </Badge>
              {canEdit && !isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsEditing(false)
                    setEditedData(caseData)
                    setNewNotes("")
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSave} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              )}
              {canApprove && (
                <Button onClick={handleApprove} disabled={isLoading}>
                  <Check className="h-4 w-4 mr-1" />
                  Approve Case
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="space-y-6 p-1">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Patient ID</Label>
                  <p className="text-sm text-gray-600">{editedData.PatientID}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-gray-600">{editedData.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Age</Label>
                  <p className="text-sm text-gray-600">{editedData.age} years</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Gender</Label>
                  <p className="text-sm text-gray-600">{editedData.gender}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Contact</Label>
                  <p className="text-sm text-gray-600">{editedData.contactNo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-gray-600">{editedData.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Height</Label>
                  <p className="text-sm text-gray-600">{editedData.height}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Weight</Label>
                  <p className="text-sm text-gray-600">{editedData.weight}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Criticality Level</Label>
                  <Badge variant={editedData.CriticalityNumber >= 8 ? "destructive" : editedData.CriticalityNumber >= 5 ? "secondary" : "default"}>
                    Level {editedData.CriticalityNumber}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Medical History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medical History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{editedData.medicalHistory || "No medical history available"}</p>
                {editedData.allergies && editedData.allergies.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Allergies</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {editedData.allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Diagnosis & Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Diagnosis & Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Diagnosis</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedData.diagnosis}
                      onChange={(e) => setEditedData({...editedData, diagnosis: e.target.value})}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">{editedData.diagnosis || "No diagnosis available"}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Research Findings</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedData.research}
                      onChange={(e) => setEditedData({...editedData, research: e.target.value})}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">{editedData.research || "No research findings available"}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Analysis</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedData.analysis}
                      onChange={(e) => setEditedData({...editedData, analysis: e.target.value})}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">{editedData.analysis || "No analysis available"}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Summary</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedData.Summary}
                      onChange={(e) => setEditedData({...editedData, Summary: e.target.value})}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">{editedData.Summary || "No summary available"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium">Speciality</Label>
                  <Badge variant="outline" className="ml-2">
                    {editedData.speciality || 'General'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Transcripts</Label>
                  <p className="text-sm text-gray-600 mt-1">{editedData.Transcripts || "No transcripts available"}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Prescription ID</Label>
                  <p className="text-sm text-gray-600 mt-1">{editedData.PrescriptionID || "No prescription ID"}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {editedData.Timestamp ? new Date(editedData.Timestamp).toLocaleString() : "No timestamp"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Additional Notes for Pending Cases */}
            {canEdit && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add additional notes or observations..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
