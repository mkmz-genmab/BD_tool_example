import type { NextFunction, Request, Response } from "express";

export type PipelineRole = "viewer" | "operator" | "admin";

type ParsedKey = {
  key: string;
  role: PipelineRole;
};

const ROLE_RANK: Record<PipelineRole, number> = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

declare global {
  namespace Express {
    interface Request {
      pipelineAuth?: {
        role: PipelineRole;
      };
    }
  }
}

function isValidRole(value: string): value is PipelineRole {
  return value === "viewer" || value === "operator" || value === "admin";
}

function parseApiKeysConfig(): ParsedKey[] {
  const raw = process.env.PIPELINE_API_KEYS;
  if (!raw || !raw.trim()) return [];

  const parsed: ParsedKey[] = [];
  for (const segment of raw.split(",")) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const [token, roleText] = trimmed.split(":");
    const key = (token || "").trim();
    const role = (roleText || "").trim();
    if (!key || !isValidRole(role)) continue;
    parsed.push({ key, role });
  }
  return parsed;
}

function extractApiKey(req: Request): string | null {
  const direct = req.header("x-api-key");
  if (direct && direct.trim()) {
    return direct.trim();
  }

  const auth = req.header("authorization");
  if (!auth) return null;
  const [scheme, token] = auth.split(" ");
  if (scheme?.toLowerCase() === "bearer" && token?.trim()) {
    return token.trim();
  }
  return null;
}

export function requirePipelineRole(minRole: PipelineRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const keys = parseApiKeysConfig();
    if (keys.length === 0) {
      req.pipelineAuth = { role: "admin" };
      return next();
    }

    const token = extractApiKey(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Missing API key. Provide x-api-key or Authorization Bearer token.",
      });
    }

    const match = keys.find((k) => k.key === token);
    if (!match) {
      return res.status(403).json({
        success: false,
        message: "Invalid API key.",
      });
    }

    if (ROLE_RANK[match.role] < ROLE_RANK[minRole]) {
      return res.status(403).json({
        success: false,
        message: `Insufficient role. Required: ${minRole}, provided: ${match.role}.`,
      });
    }

    req.pipelineAuth = { role: match.role };
    return next();
  };
}

export function getPipelineAuthSummary() {
  const keys = parseApiKeysConfig();
  return {
    enabled: keys.length > 0,
    configuredKeys: keys.length,
    rolesConfigured: Array.from(new Set(keys.map((k) => k.role))),
  };
}
