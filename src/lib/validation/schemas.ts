import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Adresse email invalide");
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères");
export const pinSchema = z
  .string()
  .regex(/^\d{4,6}$/, "Le code PIN doit contenir entre 4 et 6 chiffres");
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "L'identifiant doit contenir au moins 3 caractères")
  .max(30, "L'identifiant doit contenir au plus 30 caractères")
  .regex(/^[a-z0-9_.-]+$/, "Lettres, chiffres, points, tirets et underscores uniquement");

// L'inscription n'exige plus d'email : un identifiant seul suffit (email ajoutable plus tard
// depuis le tableau de bord, voir changeParentEmail/addParentEmail dans lib/actions/auth.ts).
export const parentRegisterSchema = z
  .object({
    name: z.string().trim().min(1, "Le nom est requis"),
    email: z.string().trim().toLowerCase().optional(),
    username: z.string().trim().toLowerCase().optional(),
    password: passwordSchema,
  })
  .refine((data) => Boolean(data.email) || Boolean(data.username), {
    message: "Renseigne un email ou un identifiant",
    path: ["username"],
  })
  .refine((data) => !data.email || emailSchema.safeParse(data.email).success, {
    message: "Adresse email invalide",
    path: ["email"],
  })
  .refine((data) => !data.username || usernameSchema.safeParse(data.username).success, {
    message: "Identifiant invalide (3-30 caractères : lettres, chiffres, points, tirets, underscores)",
    path: ["username"],
  });

export const teacherApplicationSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  email: emailSchema,
  message: z.string().trim().max(2000).optional(),
});

// Limité au primaire/début de collège, cohérent avec le programme actuel (numération, opérations,
// fractions) — pas de contenu distinct par classe pour l'instant, voir Child.gradeLevel.
export const GRADE_LEVELS = ["CP", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e"] as const;
export const gradeLevelSchema = z.enum(GRADE_LEVELS, "Classe invalide");

export const childCreateSchema = z.object({
  name: z.string().trim().min(1, "Le prénom est requis"),
  birthYear: z.coerce
    .number()
    .int()
    .min(new Date().getFullYear() - 18)
    .max(new Date().getFullYear() - 3, "L'enfant doit avoir au moins 3 ans"),
  gradeLevel: gradeLevelSchema,
  pin: pinSchema,
});

export const childLoginSchema = z.object({
  childId: z.string().min(1),
  pin: z.string().min(1),
});

// Connexion directe (sans qu'un parent soit déjà connecté sur l'appareil) — voir
// loginChildByNamePin dans lib/actions/auth.ts.
export const childDirectLoginSchema = z.object({
  name: z.string().trim().min(1, "Le prénom est requis"),
  pin: z.string().min(1, "Le code PIN est requis"),
});
