// /src/components/reports/PrescriptionReport.tsx

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// --- TYPE DEFINITIONS ---
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

// Updated to include doctorName - This must match the type in page.tsx
type CaseDetails = {
    prescriptionId: string;
    date: string;
    aiSummary: string;
    aiDiagnosis: string;
    medicalHistory: string;
    doctorName: string;
};

interface PrescriptionReportProps {
    patient: Patient;
    caseDetails: CaseDetails;
    medications: Medication[];
}

// --- FONT REGISTRATION ---
Font.register({
  family: 'Helvetica',
  fonts: [
      { src: 'https://fonts.gstatic.com/s/helvetica/v11/TK3iWkU9cso_iQheRCUE.woff', fontWeight: 'normal' },
      { src: 'https://fonts.gstatic.com/s/helvetica/v11/TK3hWkU9cso_iQheRc-e5A.woff', fontWeight: 'bold' },
  ]
});

// --- STYLES (No changes needed here) ---
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#fff',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#0d94e4',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    color: '#0d94e4',
    fontWeight: 'bold',
  },
  headerSubtext: {
    fontSize: 9,
    color: '#555',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0d94e4',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  gridCol: {
    width: '48%',
  },
  contentBlock: {
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    color: '#444',
  },
  diagnosisText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryText: {
    lineHeight: 1.5,
  },
  allergiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  allergyBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    marginRight: 5,
    marginBottom: 5,
    fontSize: 9
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0d94e4',
    color: '#fff',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 11,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  tableRowStriped: {
    backgroundColor: '#f9f9f9',
  },
  colName: { width: '30%', fontWeight: 'bold' },
  colDosage: { width: '20%' },
  colFreq: { width: '30%' },
  colDur: { width: '20%' },
  existingMedText: {
    fontSize: 8,
    color: '#777',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#999',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  }
});


// --- THE REPORT COMPONENT ---
export const PrescriptionReport = ({ patient, caseDetails, medications }: PrescriptionReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SanjeevanAI</Text>
          <Text style={styles.headerSubtext}>Medical Prescription Report</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={styles.label}>Prescription ID:</Text>
          <Text>{caseDetails.prescriptionId}</Text>
          <Text style={[styles.label, { marginTop: 4 }]}>Date Issued:</Text>
          <Text>{caseDetails.date}</Text>
        </View>
      </View>

      {/* Consultation Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Consultation Details</Text>
        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <Text><Text style={styles.label}>Patient:</Text> {patient.name}, {patient.age} ({patient.gender})</Text>
            <Text><Text style={styles.label}>Vitals:</Text> {patient.height} / {patient.weight}</Text>
            <View style={{marginTop: 8}}>
                <Text style={styles.label}>Known Allergies:</Text>
                <View style={styles.allergiesContainer}>
                  {patient.allergies.map(a => <Text key={a} style={styles.allergyBadge}>{a}</Text>)}
                </View>
            </View>
          </View>
          <View style={styles.gridCol}>
            <Text><Text style={styles.label}>Consulting Physician:</Text> {caseDetails.doctorName}</Text>
            <Text><Text style={styles.label}>Relevant History:</Text> {caseDetails.medicalHistory}</Text>
          </View>
        </View>
      </View>
      
      {/* Diagnosis Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI-Assisted Findings</Text>
        <Text style={styles.diagnosisText}>{caseDetails.aiDiagnosis}</Text>
        <View style={styles.contentBlock}>
          <Text style={styles.label}>Symptom Summary:</Text>
          <Text style={styles.summaryText}>{caseDetails.aiSummary}</Text>
        </View>
      </View>

      {/* Prescription Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prescribed Medication</Text>
        <View style={styles.table}>
            <View style={styles.tableHeader}>
                <Text style={styles.colName}>Medication</Text>
                <Text style={styles.colDosage}>Dosage</Text>
                <Text style={styles.colFreq}>Frequency</Text>
                <Text style={styles.colDur}>Duration</Text>
            </View>
            {medications.map((med, index) => (
                // --- THE FIX ---
                // Using a ternary operator to return an empty style object {} instead of `false`.
                <View key={med.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowStriped : {}]}>
                    <View style={styles.colName}>
                      <Text>{med.name}</Text>
                      {med.isExisting && <Text style={styles.existingMedText}>(Existing Medication)</Text>}
                    </View>
                    <Text style={styles.colDosage}>{med.dosage}</Text>
                    <Text style={styles.colFreq}>{med.frequency}</Text>
                    <Text style={styles.colDur}>{med.duration}</Text>
                </View>
            ))}
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer} fixed>
        This prescription was generated with the assistance of SanjeevanAI and has been clinically reviewed and approved.
        Always consult your doctor for any questions regarding your treatment.
      </Text>
    </Page>
  </Document>
);