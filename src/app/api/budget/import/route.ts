import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/validators";
import * as XLSX from "xlsx";

interface RawRow {
  Date?: string | number | Date;
  Title?: string;
  Category?: string;
  Type?: string;
  Amount?: number | string;
  Method?: string;
  Note?: string;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(err("Unauthorized"), { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(err("No file provided"), { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<RawRow>(worksheet);

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json(
        err("Uploaded file is empty or could not be parsed"),
        { status: 400 }
      );
    }

    // Get user categories for matching
    const userCategories = await prisma.category.findMany({
      where: { userId: session.user.id },
    });
    const categoryMap = new Map(
      userCategories.map((c) => [c.name.toLowerCase().trim(), c.id])
    );

    let importedCount = 0;
    const errors: string[] = [];

    const entriesToCreate = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const title = String(
        row.Title || row["title"] || row["Description"] || "Imported Entry"
      ).trim();
      const rawAmount = row.Amount ?? row["amount"];
      const amountNum =
        typeof rawAmount === "string" ? parseFloat(rawAmount) : Number(rawAmount);

      if (isNaN(amountNum) || amountNum <= 0) {
        errors.push(`Row ${i + 2}: Invalid amount`);
        continue;
      }

      // Parse date
      let entryDate = new Date();
      const rawDate = row.Date ?? row["date"];
      if (rawDate) {
        const parsed = new Date(String(rawDate));
        if (!isNaN(parsed.getTime())) {
          entryDate = parsed;
        }
      }

      // Parse type (INCOME or EXPENSE)
      const rawType = String(
        row.Type || row["type"] || "EXPENSE"
      ).toUpperCase().trim();
      const type = rawType === "INCOME" ? "INCOME" : "EXPENSE";

      // Match category
      const rawCat = String(
        row.Category || row["category"] || ""
      ).toLowerCase().trim();
      const categoryId = categoryMap.get(rawCat) || null;

      const method = row.Method ? String(row.Method).trim() : null;
      const note = row.Note ? String(row.Note).trim() : null;

      entriesToCreate.push({
        userId: session.user.id,
        date: entryDate,
        title,
        categoryId,
        type: type as "INCOME" | "EXPENSE",
        amount: amountNum,
        method,
        note,
      });
      importedCount++;
    }

    if (entriesToCreate.length > 0) {
      await prisma.budgetEntry.createMany({
        data: entriesToCreate,
      });
    }

    return NextResponse.json(
      ok({
        importedCount,
        errors: errors.slice(0, 10),
      })
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to import file";
    return NextResponse.json(err(msg), { status: 500 });
  }
}
