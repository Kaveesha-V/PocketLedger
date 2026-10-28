import { z } from "zod";

// ─────────────────────────────────────────────
//  Auth
// ─────────────────────────────────────────────

export const SignupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
    currency: z.string().default("LKR"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// ─────────────────────────────────────────────
//  Budget
// ─────────────────────────────────────────────

export const BudgetEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  title: z.string().min(1, "Title is required").max(100),
  categoryId: z.string().optional().nullable(),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const BudgetEntryUpdateSchema = BudgetEntrySchema.partial();

// ─────────────────────────────────────────────
//  Categories
// ─────────────────────────────────────────────

export const CategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

// ─────────────────────────────────────────────
//  Friends
// ─────────────────────────────────────────────

export const FriendSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

// ─────────────────────────────────────────────
//  Ledger Transactions
// ─────────────────────────────────────────────

export const LedgerTransactionSchema = z.object({
  friendId: z.string().min(1, "Friend is required"),
  direction: z.enum(["I_GAVE", "I_BORROWED", "THEY_REPAID", "I_REPAID"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  reason: z.string().max(200).optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

// ─────────────────────────────────────────────
//  Reminders
// ─────────────────────────────────────────────

export const ReminderEmailSchema = z.object({
  friendId: z.string().min(1, "Friend is required"),
  message: z.string().min(1, "Message is required").max(2000),
});

export const ReminderWhatsappSchema = z.object({
  friendId: z.string().min(1, "Friend is required"),
  message: z.string().min(1, "Message is required").max(2000),
});

// ─────────────────────────────────────────────
//  Settings / Profile
// ─────────────────────────────────────────────

export const ProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  currency: z.string(),
  theme: z.enum(["light", "dark"]),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

// ─────────────────────────────────────────────
//  Zod v4 compatibility: provide .errors as alias to .issues
// ─────────────────────────────────────────────

declare module "zod" {
  interface ZodError {
    errors: any[];
  }
}

if (typeof (z.ZodError.prototype as any).errors === "undefined") {
  Object.defineProperty(z.ZodError.prototype, "errors", {
    get() {
      return this.issues;
    },
    configurable: true,
  });
}

// ─────────────────────────────────────────────
//  Common API response
// ─────────────────────────────────────────────

export type ApiResponse<T = unknown> =
  | { data: T; error: null }
  | { data: null; error: string };

export function ok<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}

export function err(error: string): ApiResponse<never> {
  return { data: null, error };
}

export function formatZodError(error: any): string {
  const issues = error?.issues || error?.errors || [];
  return issues[0]?.message || error?.message || "Validation error";
}

