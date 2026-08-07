import type { NextFunction, Request, Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import { db, sessionsTable, usersTable, type User } from "@workspace/db";

import { SESSION_COOKIE_NAME, hashSessionToken } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Reads the session cookie (if present), resolves it to a user, and attaches
 * the user to `req.user`. Never rejects the request — route-level guards
 * (`requireAuth` / `requireAdmin`) decide what to do when `req.user` is
 * missing. This lets public routes optionally personalize responses without
 * duplicating the session lookup.
 */
export async function attachSession(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  if (!token) {
    next();
    return;
  }

  try {
    const tokenHash = hashSessionToken(token);
    const rows = await db
      .select({ user: usersTable })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(usersTable.id, sessionsTable.userId))
      .where(and(eq(sessionsTable.id, tokenHash), gt(sessionsTable.expiresAt, new Date())))
      .limit(1);

    if (rows[0]) {
      req.user = rows[0].user;
    }
  } catch {
    // Treat lookup failures as "not authenticated" rather than crashing the
    // request pipeline; the DB may be briefly unavailable.
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
