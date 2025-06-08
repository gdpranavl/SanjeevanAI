import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { MongoClient } from "mongodb";

const uri = process.env.DATABASE_URL!;

async function connectToDatabase() {
  try {
    if (!uri) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("maindb");
    console.log("Connected to database: maindb");
    return { client, db };
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
}

async function getUnapprovedCases() {
  let client;
  try {
    const connection = await connectToDatabase();
    client = connection.client;
    const db = connection.db;

    // Use aggregation pipeline to join cases with patients
    const cases = await db
      .collection("cases")
      .aggregate([
        // First, match unapproved cases
        {
          $match: {
            $or: [
              { ApprovalStatus: "Pending" },
              { ApprovalStatus: "pending" },
              { ApprovalStatus: "PENDING" },
              { ApprovalStatus: { $regex: /pending/i } },
              { ApprovalStatus: false },
            ],
          },
        },
        // Then join with patients collection
        {
          $lookup: {
            from: "patients",
            localField: "PatientID",
            foreignField: "patientID",
            as: "patientDetails",
          },
        },
        // Unwind the patient details array
        {
          $unwind: {
            path: "$patientDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Project the fields you want
        {
          $project: {
            _id: 1,
            PatientID: 1,
            ApprovalStatus: 1,
            CriticalityNumber: "",
            Summary: 1,
            CaseID: 1,
            Transcripts: 1,
            PrescriptionID: 1,
            Timestamp: 1,
            // RADS information
            diagnosis: "$RADS.Diagnosis",
            speciality: "$RADS.Speciality",
            research: "$RADS.Research",
            analysis: "$RADS.Analysis",
            // Patient details
            name: "$patientDetails.patientName",
            age: "$patientDetails.patientAge",
            gender: "$patientDetails.gender",
            contactNo: "$patientDetails.contactNo",
            email: "$patientDetails.email",
            height: "$patientDetails.height",
            weight: "$patientDetails.weight",
            medicalHistory: "$patientDetails.medicalHistory.summary",
            allergies: "$patientDetails.allergies",
          },
        },
      ])
      .toArray();

    console.log(`Found ${cases.length} unapproved cases with patient details`);
    if (cases.length > 0) {
      console.log("Sample joined case:", JSON.stringify(cases[0], null, 2));
    }

    return JSON.parse(JSON.stringify(cases));
  } catch (error) {
    console.error("Error fetching unapproved cases:", error);
    return [];
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }
  }
}

export default async function Page() {
  let unapprovedCases = [];
  let error = null;

  try {
    unapprovedCases = await getUnapprovedCases();
  } catch (err) {
    console.error("Page error:", err);
    error = err instanceof Error ? err.message : "Unknown error occurred";
  }

  // If there's an error, show error page
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Dashboard
          </h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  Unapproved Cases ({unapprovedCases.length})
                </h2>
                {unapprovedCases.length === 0 && (
                  <p className="text-gray-500 mt-2">
                    No unapproved cases found
                  </p>
                )}
              </div>
              <DataTable data={unapprovedCases} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
