import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const response = NextResponse.json({ message: "Signed out successfully" });

    response.cookies.set("token", "", {
      httpOnly: true,
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Signout error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
