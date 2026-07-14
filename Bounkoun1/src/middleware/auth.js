import { supabase } from "../db/supabaseClient.js";

// Verifies the Authorization: Bearer <token> header against Supabase
// Auth, and attaches the verified user to req.user. Rejects the
// request if the token is missing or invalid.
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = data.user;
  next();
}
