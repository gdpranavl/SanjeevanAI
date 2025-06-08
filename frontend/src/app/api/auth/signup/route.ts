import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set.");
}
const client = new MongoClient(uri);

export async function POST(request: Request) {
  let body;

  try {
    // Ensure the request has the correct Content-Type
    if (request.headers.get("Content-Type") !== "application/json") {
      console.error("Invalid Content-Type:", request.headers.get("Content-Type"));
      return NextResponse.json({ error: "Invalid Content-Type. Expected application/json." }, { status: 400 });
    }

    try {
      body = await request.json();
      console.log("Received body:", body); // Log the incoming request body
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return NextResponse.json({ error: "Invalid JSON format." }, { status: 400 });
    }

    // Map incoming data to expected schema
    const {
      DoctorName,
      Email,
      specialization,
      speacility,
      ContactNo,
      password,
    } = body;

    if (!DoctorName || !Email || !ContactNo || !password) {
      console.error("Validation failed. Missing required fields:", { DoctorName, Email, ContactNo, password });
      return NextResponse.json({ error: "DoctorName, Email, ContactNo, and password are required." }, { status: 400 });
    }

    await client.connect();
    const database = client.db("maindb");
    const doctors = database.collection("doctors");
    const totalRecords = await doctors.countDocuments();
    console.log("Total records in doctors collection:", totalRecords); // Log the total records count

    const doctorData = {
      DoctorID: `D${totalRecords.toString().padStart(3, "0")}`, // Generate a unique DoctorID with leading zeros
      DoctorName,
      DoctorSign: password, // Use password as DoctorSign for now
      DoctorQualification: {
        Educational: [
          {
            Degree: null,
            Institution: null, // Placeholder value
            CompletionYear: null, // Default to null
          },
        ],
        Experience: [
          {
            Hospital: null, // Placeholder value
            Role: null, // Placeholder value
            StartDate: null, // Default to null
            EndDate: null, // Default to null
          },
        ],
        CurrentWork: {
          Hospital: null, // Placeholder value
          Role: null, // Placeholder value
          StartDate: null, // Default to null
        },
        Speciality: specialization ? [specialization] : null,
      },
      Banking: {
        AccountNumber: null,
        BankName: null,
        IFSCCode: null,
      }, // Banking details not provided
      Rating: null, // Default to null
      RandomQScore: null, // Default to null
      Age: null, // Default to null
      Gender: null, // Default to null
      ContactNo,
      Email,
      Cases: [], // Default to null
      createdAt: new Date(),
    };

    console.log("Prepared doctorData:", doctorData); // Log the prepared doctor data

    // Check if the doctor already exist

    // Insert the doctor data into the database using the template
    const result = await doctors.insertOne(doctorData);
    console.log("Insert result:", result); // Log the result of the insert operation

    // Return success response
    return NextResponse.json({
      message: "Doctor registered successfully.",
      DoctorId: totalRecords + 1, // Use totalRecords + 1 for the DoctorId
      DoctorName: doctorData.DoctorName,
      Email : doctorData.Email,
      totalRecords, // Include the total number of records in the response
    });
  } catch (error) {
    console.error("Unexpected error during doctor registration:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  } finally {
    try {
      await client.close();
    } catch (closeError) {
      console.error("Error closing MongoDB connection:", closeError);
    }
  }
}