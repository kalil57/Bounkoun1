import { supabaseAnon } from "../db/supabaseAnonClient.js";

export async function signup(email, password) {
  if (!email || !password) {
    throw new Error("Missing required fields: email, password");
  }
  const { data, error } = await supabaseAnon.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function login(email, password) {
  if (!email || !password) {
    throw new Error("Missing required fields: email, password");
  }
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}
