import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { Portfolio } from "@/models/Portfolio";
import { dbConnect } from "@/lib/mogodb"; // your db connection function

export async function DELETE(req: Request) {
  await dbConnect();

  const cookieStore = cookies();
  const token = (await cookieStore).get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized - token missing" }, { status: 401 });
  }

  const decoded = verifyJWT(token);
  if (!decoded || typeof decoded === "string" || !decoded.email) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const { stockSymbol } = await req.json();
  const userEmail = decoded.email;

  try {
    const updated = await Portfolio.findOneAndUpdate(
      { userEmail },
      { $pull: { stocks: stockSymbol } },
      { new: true }
    );

    return NextResponse.json({ message: "Stock removed from portfolio", portfolio: updated });
  } catch (error) {
    console.error("Error removing stock from portfolio:", error);
    return NextResponse.json({ error: "Failed to remove stock" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  await dbConnect();

  const cookieStore = cookies();
  const token = (await cookieStore).get("token")?.value; // assuming JWT is stored as 'token'

  if (!token) {
    return NextResponse.json({ error: "Unauthorized - token missing" }, { status: 401 });
  }

  const decoded = verifyJWT(token);
  if (!decoded || typeof decoded === "string" || !decoded.email) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const { stockSymbol } = await req.json();
  const userEmail = decoded.email;

  try {
  const updated = await Portfolio.findOneAndUpdate(
    { userEmail },
    { $addToSet: { stocks: stockSymbol } }
  );


    return NextResponse.json({ message: "Stock added to portfolio", portfolio: updated });
  } catch (error) {
    console.error("Error updating portfolio:", error);
    return NextResponse.json({ error: "Failed to update portfolio" }, { status: 500 });
  }
}
