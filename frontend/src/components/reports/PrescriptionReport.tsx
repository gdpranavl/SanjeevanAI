import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// --- TYPE DEFINITIONS (Import or re-define the types your report will use) ---
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

type CaseDetails = {
    prescriptionId: string;
    date: string;
    aiSummary: string;
    aiDiagnosis: string;
    confidence: number;
    medicalHistory: string;
};

// Props for our report component
interface PrescriptionReportProps {
    patient: Patient;
    caseDetails: CaseDetails;
    medications: Medication[];
}

// --- STYLING ---
// Define fonts for the document
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/helvetica/v11/TK3iWkU9cso_iQheRCUE.woff', fontWeight: 'normal' },
        { src: 'https://fonts.gstatic.com/s/helvetica/v11/TK3hWkU9cso_iQheRc-e5A.woff', fontWeight: 'bold' },
        { src: 'https://fonts.gstatic.com/s/helvetica/v11/TK3gWkU9cso_iQheRC_w6A.woff', fontWeight: 'normal', fontStyle: 'italic' },
    ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#1a91da',
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerText: { fontSize: 24, color: '#1a91da', fontWeight: 'bold' },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    padding: 5,
    marginBottom: 8,
    color: '#1a91da'
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontWeight: 'bold' },
  patientInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  patientInfoBlock: { width: '48%' },
  badge: {
    backgroundColor: '#e0e0e0',
    padding: '3 5',
    borderRadius: 5,
    marginRight: 5,
    fontSize: 10
  },
  diagnosis: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d9534f',
    marginBottom: 5,
  },
  table: {
    width: '100%',
    display: "flex",
    flexDirection: "column",
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a91da',
    color: 'white',
    padding: 6,
    fontWeight: 'bold'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 6,
    alignItems: 'center'
  },
  colMed: { width: '25%', fontWeight: 'bold' },
  colDosage: { width: '20%' },
  colFreq: { width: '35%' },
  colDur: { width: '20%' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: 'grey',
    fontSize: 9,
  }
});

// --- THE REPORT COMPONENT ---
export const PrescriptionReport = ({ patient, caseDetails, medications }: PrescriptionReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>SanjeevanAI Prescription</Text>
        <View style={{ textAlign: 'right' }}>
          <Text>{caseDetails.date}</Text>
          <Text style={{fontSize: 9, color: 'grey'}}>Prescription ID: {caseDetails.prescriptionId}</Text>
        </View>
      </View>

      {/* Patient Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        <View style={styles.patientInfo}>
            <View style={styles.patientInfoBlock}>
                <Text><Text style={styles.label}>Name:</Text> {patient.name}</Text>
                <Text><Text style={styles.label}>Age:</Text> {patient.age}</Text>
                <Text><Text style={styles.label}>Gender:</Text> {patient.gender}</Text>
            </View>
             <View style={styles.patientInfoBlock}>
                <Text><Text style={styles.label}>Height:</Text> {patient.height}</Text>
                <Text><Text style={styles.label}>Weight:</Text> {patient.weight}</Text>
            </View>
        </View>
         <View style={{marginTop: 8}}>
            <Text style={styles.label}>Allergies:</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', marginTop: 4}}>
              {patient.allergies.map(a => <Text key={a} style={styles.badge}>{a}</Text>)}
            </View>
         </View>
      </View>
      
      {/* Diagnosis Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diagnosis & Summary</Text>
        <Text style={styles.diagnosis}>{caseDetails.aiDiagnosis} (Confidence: {caseDetails.confidence}%)</Text>
        <Text><Text style={styles.label}>Symptom Summary:</Text> {caseDetails.aiSummary}</Text>
        <Text style={{marginTop: 5}}><Text style={styles.label}>Medical History Note:</Text> {caseDetails.medicalHistory}</Text>
      </View>

      {/* Prescription Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medication</Text>
        <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
                <Text style={styles.colMed}>Medication</Text>
                <Text style={styles.colDosage}>Dosage</Text>
                <Text style={styles.colFreq}>Frequency</Text>
                <Text style={styles.colDur}>Duration</Text>
            </View>
            {/* Table Body */}
            {medications.map(med => (
                <View key={med.id} style={styles.tableRow}>
                    <Text style={styles.colMed}>{med.name} {med.isExisting && <Text style={{fontStyle:'italic', color:'grey'}}>(Existing)</Text>}</Text>
                    <Text style={styles.colDosage}>{med.dosage}</Text>
                    <Text style={styles.colFreq}>{med.frequency}</Text>
                    <Text style={styles.colDur}>{med.duration}</Text>
                </View>
            ))}
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer} fixed>
        This is an AI-assisted prescription, reviewed and approved by a licensed medical professional.
      </Text>
    </Page>
  </Document>
);