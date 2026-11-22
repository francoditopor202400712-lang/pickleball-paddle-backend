
import {
  supabase,
  createAuthClient
} from "../config/supabase.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    const token = header.startsWith("Bearer ")
      ? header.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Bearer token is required."
        }
      });
    }

    const authClient = createAuthClient();

    const { data, error } =
      await authClient.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Your session is invalid or expired."
        }
      });
    }

    req.user = data.user;
    next();

  } catch (error) {
    next(error);
  }
}

export async function requireAdmin(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (error) {
      console.error("Admin profile lookup failed:", {
        code: error.code,
        message: error.message
      });

      return res.status(503).json({
        success: false,
        error: {
          code: "PROFILE_LOOKUP_FAILED",
          message: "Unable to verify administrator access."
        }
      });
    }

    if (data?.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Administrator access is required."
        }
      });
    }

    next();

  } catch (error) {
    next(error);
  }
}
