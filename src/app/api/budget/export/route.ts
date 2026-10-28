import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthRange } from "@/lib/format";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // YYYY-MM (optional)
  const format = (url.searchParams.get("format") || "xlsx").toLowerCase();

  const whereClause: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (month) {
    const { start, end } = getMonthRange(month);
    whereClause.date = { gte: start, lte: end };
  }

  const entries = await prisma.budgetEntry.findMany({
    where: whereClause,
    include: { category: true },
    orderBy: { date: "desc" },
  });

  const rows = entries.map((e) => ({
    Date: e.date.toISOString().slice(0, 10),
    Title: e.title,
    Category: e.category?.name || "Uncategorized",
    Type: e.type,
    Amount: Number(e.amount),
    Method: e.method || "",
    Note: e.note || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Budget");

  const filename = `PocketLedger_Budget_${month || "All"}`;

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }

  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
}
