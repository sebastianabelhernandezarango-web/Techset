import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    const categories = await query(`SELECT * FROM "Category" ORDER BY name`);
    return NextResponse.json(categories);
}