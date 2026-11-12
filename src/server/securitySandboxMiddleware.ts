import type { Request, Response, NextFunction } from "express";

const DANGEROUS_REQUEST_PATTERN =
  /(\.\.\/|\.\.\\|\/etc\/passwd|\/proc\/self|codesign\.key|codesign\.pfx|certs\/codesign)/i;

/**
 * Server-Side Origin Verification & Workspace Path Sandbox Middleware:
 * 1. Blocks path traversal or credential file probes across URL, query, and JSON body.
 * 2. Verifies Origin / Host consistency on mutating requests (POST, PUT, DELETE, PATCH)
 *    so external cross-origin pages cannot invoke local workspace or tool endpoints.
 */
export function securitySandboxMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const rawUrl = String(req.originalUrl || req.url || "");
    const bodyStr = req.body ? JSON.stringify(req.body) : "";

    if (
      DANGEROUS_REQUEST_PATTERN.test(rawUrl) ||
      DANGEROUS_REQUEST_PATTERN.test(bodyStr)
    ) {
      res.status(403).json({
        error: "Blocked by MAHR Workspace Security Sandbox: forbidden path or resource pattern.",
      });
      return;
    }

    const method = (req.method || "GET").toUpperCase();
    const isMutating =
      method === "POST" ||
      method === "PUT" ||
      method === "DELETE" ||
      method === "PATCH";

    if (isMutating) {
      const origin = req.headers.origin;
      const host = req.headers.host;

      if (origin && host) {
        try {
          const originUrl = new URL(origin);
          const originHost = originUrl.host.toLowerCase();
          const reqHost = host.toLowerCase();

          const isSameHost = originHost === reqHost;
          const isAllowedPlatformOrigin =
            originHost.endsWith(".run.app") ||
            originHost.endsWith(".google.com") ||
            originHost.startsWith("localhost:") ||
            originHost.startsWith("127.0.0.1:");

          if (!isSameHost && !isAllowedPlatformOrigin) {
            res.status(403).json({
              error: `Cross-origin request rejected by security gate (${originHost}).`,
            });
            return;
          }
        } catch {
          res.status(403).json({
            error: "Malformed Origin header rejected by security gate.",
          });
          return;
        }
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}
