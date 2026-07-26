import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Adresse email invalide");
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères");
export const pinSchema = z
  .string()
  .regex(/^\d{4,6}$/, "Le code PIN doit contenir entre 4 et 6 chiffres");

export const parentRegisterSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  email: emailSchema,
  password: passwordSchema,
});

export const teacherApplicationSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  email: emailSchema,
  message: z.string().trim().max(2000).optional(),
});

export const childCreateSchema = z.object({
  name: z.string().trim().min(1, "Le prénom est requis"),
  birthYear: z.coerce
    .number()
    .int()
    .min(new Date().getFullYear() - 18)
    .max(new Date().getFullYear() - 3, "L'enfant doit avoir au moins 3 ans"),
  pin: pinSchema,
});

export const childLoginSchema = z.object({
  childId: z.string().min(1),
  pin: z.string().min(1),
});
