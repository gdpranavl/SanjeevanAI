import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set.");
}
const client = new MongoClient(uri);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the incoming data
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // Connect to MongoDB
    await client.connect();
    const database = client.db("sanjeevanAI");
    const users = database.collection("doctors");

    // Check if the user exists and the password matches
    const user = await users.findOne({ email });
    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Return success response
    return NextResponse.json({ message: "Login successful." });
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  } finally {
    await client.close();
  }
}
