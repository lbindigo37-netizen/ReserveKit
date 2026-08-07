import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, sessionsTable, customersTable } from "@workspace/db";
import {
  GetCurrentUserResponse,
  LoginBody,
  LoginResponse,
  SignupBody,
  SignupResponse,
} from "@workspace/api-zod";

import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "../lib/auth";
import { requireAuth } from "../middlewares/session";

const router: IRouter = Router();

function setSessionCookie(res: import("express").Response, token: string): void {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

router.post("/auth/signup", async (req, res) => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail))
    .limit(1);
  if (existing[0]) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({ name, email: normalizedEmail, passwordHash, role: "customer" })
    .returning();

  // Every customer account gets a linked customer profile so booking
  // history / favorites / spend tracking work immediately after signup.
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part: string) => part[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
  await db.insert(customersTable).values({
    userId: user.id,
    name,
    email: normalizedEmail,
    initials: initials || "U",
    color: "#c36b4f",
  });

  const { token, tokenHash } = createSessionToken();
  await db.insert(sessionsTable).values({
    id: tokenHash,
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });

  setSessionCookie(res, token);
  res.status(201).json(SignupResponse.parse({ id: user.id, name: user.name, email: user.email, role: user.role }));
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const { token, tokenHash } = createSessionToken();
  await db.insert(sessionsTable).values({
    id: tokenHash,
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });

  setSessionCookie(res, token);
  res.json(LoginResponse.parse({ id: user.id, name: user.name, email: user.email, role: user.role }));
});

router.post("/auth/logout", async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  if (token) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, hashSessionToken(token)));
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  res.status(204).end();
});

router.get("/auth/me", requireAuth, (req, res) => {
  const user = req.user!;
  res.json(GetCurrentUserResponse.parse({ id: user.id, name: user.name, email: user.email, role: user.role }));
});

export default router;
