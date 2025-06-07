import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set.");
}
const client = new MongoClient(uri);

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return NextResponse.json({ error: "Invalid JSON format." }, { status: 400 });
    }
    console.log(body)
    // Validate the incoming data
    const { email, password } = body;
    console.log(email)
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    console.log(body)
    console.log("Received request body:", body); // Log incoming request body
    console.log("Querying database for user with email:",email); // Log email being queried

    // Connect to MongoDB
    await client.connect();
    const database = client.db("maindb");
    const users = database.collection("doctors");
    const Email = email
    // Check if the user exists and the password matches
    const user = await users.findOne({ Email });
    console.log("Database query result:", user); // Log the result of the database query

    if (!user || user.DoctorSign !== password) {
      console.error("Invalid email or password.");
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    console.log("User authenticated successfully:", user); // Log successful authentication

    // Return success response with user details
    return NextResponse.json({
      message: "Login successful.",
      DoctorName: user.DoctorName,
      DoctorID: user.DoctorID,
      Email
    });
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  } finally {
    await client.close();
  }
}
