/**
 * Zod validation schemas for Ellixorrr forms.
 *
 * All user-submitted data is validated server-side before being written
 * to the database. Client-side validation is a UX convenience only and
 * is never trusted.
 *
 * Compatible with Zod v4 API.
 */
import { z } from "zod";

/**
 * Shared constraints.
 */
const EMAIL = z
  .string()
  .email("Please enter a valid email address.")
  .min(1, "Email is required.")
  .max(254, "Email is too long.");

const PASSWORD = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");

const NAME = z.string().min(1, "Name is required.").max(100, "Name is too long.");

const PHONE = z.string().max(30, "Phone number is too long.").optional().or(z.literal(""));

const BUSINESS_NAME = z
  .string()
  .max(100, "Business name is too long.")
  .optional()
  .or(z.literal(""));

const DESCRIPTION = z
  .string()
  .min(1, "Description is required.")
  .max(5000, "Description is too long.");

const SERVICE_TYPE = z.enum({
  Websites: "Websites",
  Applications: "Applications",
  Automations: "Automations",
  "Custom Solutions": "Custom Solutions",
});

export const registerSchema = z
  .object({
    full_name: NAME,
    email: EMAIL,
    password: PASSWORD,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: EMAIL,
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: EMAIL,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: PASSWORD,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const enquirySchema = z.object({
  name: NAME,
  email: EMAIL,
  phone: PHONE,
  business_name: BUSINESS_NAME,
  service_type: SERVICE_TYPE,
  project_description: DESCRIPTION,
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const profileSchema = z.object({
  full_name: NAME.optional(),
  email: EMAIL.optional(),
  phone: PHONE,
  business_name: BUSINESS_NAME,
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const projectSchema = z.object({
  customer_id: z.string().uuid("Invalid customer ID."),
  project_name: NAME,
  service_type: SERVICE_TYPE,
  description: DESCRIPTION.optional(),
  status: z
    .enum({
      enquiry: "enquiry",
      planning: "planning",
      in_progress: "in_progress",
      review: "review",
      completed: "completed",
      on_hold: "on_hold",
    })
    .optional(),
  start_date: z.string().datetime().optional().or(z.literal("")),
  expected_completion_date: z.string().datetime().optional().or(z.literal("")),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export const projectUpdateSchema = z.object({
  title: NAME,
  description: DESCRIPTION.optional(),
});

export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
