import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const CHILD_SESSION_COOKIE = "child_session";
const CHILD_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h — un enfant ne doit pas rester connecté indéfiniment

function getSecret() {
  const secret = process.env.CHILD_SESSION_SECRET;
  if (!secret) throw new Error("CHILD_SESSION_SECRET n'est pas configuré");
  return new TextEncoder().encode(secret);
}

export interface ChildSessionPayload {
  childId: string;
  parentId: string;
  name: string;
}

export async function createChildSessionToken(payload: ChildSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CHILD_SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyChildSessionToken(
  token: string,
): Promise<ChildSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.childId === "string" &&
      typeof payload.parentId === "string" &&
      typeof payload.name === "string"
    ) {
      return { childId: payload.childId, parentId: payload.parentId, name: payload.name };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setChildSessionCookie(payload: ChildSessionPayload) {
  const token = await createChildSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(CHILD_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CHILD_SESSION_TTL_SECONDS,
  });
}

export async function getChildSession(): Promise<ChildSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CHILD_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyChildSessionToken(token);
}

export async function clearChildSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CHILD_SESSION_COOKIE);
}

export { CHILD_SESSION_COOKIE };
