import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { CHILD_SESSION_COOKIE, verifyChildSessionToken } from "@/lib/auth/childSession";

// Décodage direct du JWT NextAuth (via next-auth/jwt) plutôt que d'importer src/auth.ts :
// ce dernier tire Prisma/bcrypt, incompatibles avec le runtime Edge du middleware.
export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const isParentArea = nextUrl.pathname.startsWith("/dashboard");
  const isTeacherArea = nextUrl.pathname.startsWith("/teacher/dashboard");
  const isDevArea = nextUrl.pathname.startsWith("/dev/console");
  const isChildArea = nextUrl.pathname.startsWith("/app");

  if (isParentArea || isTeacherArea || isDevArea) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    const role = token?.role as string | undefined;

    if (isParentArea && role !== "PARENT") {
      return NextResponse.redirect(new URL("/parent/login", nextUrl));
    }
    if (isTeacherArea && role !== "TEACHER") {
      return NextResponse.redirect(new URL("/teacher/login", nextUrl));
    }
    if (isDevArea && role !== "DEV_ADMIN") {
      return NextResponse.redirect(new URL("/dev/login", nextUrl));
    }
  }

  if (isChildArea) {
    const token = req.cookies.get(CHILD_SESSION_COOKIE)?.value;
    const childSession = token ? await verifyChildSessionToken(token) : null;
    if (!childSession) {
      return NextResponse.redirect(new URL("/child/select-profile", nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/teacher/dashboard/:path*", "/dev/console/:path*", "/app/:path*"],
};
