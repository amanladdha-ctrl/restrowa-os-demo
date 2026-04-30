import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "restrowa_session";
const SESSION_DAYS = 7;

type SessionPayload = {
  userId: string;
  exp: number;
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

export function createSessionToken(userId: string) {
  const payload = encode({
    userId,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  } satisfies SessionPayload);

  return `${payload}.${sign(payload)}`;
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, createSessionToken(userId), {
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

  const session = decode<SessionPayload>(payload);
  if (session.exp < Date.now()) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordChangeRecommended: true,
      restaurantId: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          trialEndDate: true,
          paymentDueAmount: true
        }
      }
    }
  });
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
