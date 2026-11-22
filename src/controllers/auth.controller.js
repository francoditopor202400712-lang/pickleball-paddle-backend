
import { createAuthClient } from "../config/supabase.js";
import { ok, fail } from "../utils/http.js";

// REGISTER
export async function register(req, res, next) {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || password.length < 8) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Email and a password of at least 8 characters are required."
      );
    }

    // Use a separate authentication client
    const authClient = createAuthClient();

    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || ""
        }
      }
    });

    if (error) {
      return fail(
        res,
        400,
        "REGISTRATION_FAILED",
        error.message
      );
    }

    return ok(
      res,
      {
        user: data.user,
        session: data.session,
        message:
          "Account created. Check your email if email confirmation is enabled."
      },
      201
    );

  } catch (error) {
    next(error);
  }
}

// LOGIN
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Email and password are required."
      );
    }

    // Separate client prevents changing the
    // database client's authentication session
    const authClient = createAuthClient();

    const { data, error } =
      await authClient.auth.signInWithPassword({
        email,
        password
      });

    if (error || !data?.session?.access_token) {
      return fail(
        res,
        401,
        "INVALID_CREDENTIALS",
        "Email or password is incorrect, or email confirmation is required."
      );
    }

    return ok(res, {
      user: data.user,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at
    });

  } catch (error) {
    next(error);
  }
}
