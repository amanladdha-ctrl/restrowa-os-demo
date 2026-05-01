import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

const SESSION_COOKIE = "restrowa_session";
const SESSION_DAYS = 7;

export type SessionUser = {
  email: string;
  exp: number;
  id: string;
  name: string | null;
  passwordChangeRecommended: boolean;
  restaurant: {
    id: string;
    name: string;
    paymentDueAmount: string;
    slug: string;
    status: string;
    trialEndDate: string;
  } | null;
  restaurantId: string | null;
  role: UserRole;
};

function getSecret() {
  return process.env.SESSION_SECRET || "dev-only-change-this-secret";
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createSessionTokenFromUser(user: Omit<SessionUser, "exp">) {
  const payload = encode({
    ...user,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  } satisfies SessionUser);

  return `${payload}.${sign(payload)}`;
}

export async function setSession(user: Omit<SessionUser, "exp">) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, createSessionTokenFromUser(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/"
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;

  const session = decode<SessionUser>(payload);
  if (session.exp < Date.now()) return null;

  return session;
}

export async function requireRole(roles: UserRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!roles.includes(user.role)) {
    redirect("/unauthorized");
  }

  return user;
}

export function getDefaultPath(role: UserRole) {
  if (role === "SUPER_ADMIN") return "/admin";
  if (role === "RESTAURANT_OWNER") return "/owner";
  return "/staff";
}
