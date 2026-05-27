"use server";

import { createClient } from "../utils/supabase/server";
import { logEvent, logEventError } from "../eventLogger";

export async function signUp(email, password, userData = {}) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) {
      logEventError({
        step: "AUTH",
        operation: "REGISTER_FAILED",
        userId: null,
        error,
      });

      return { success: false, error: error.message };
    }

    logEvent({
      step: "AUTH",
      operation: "REGISTER_SUCCESS",
      userId: data.user?.id,
    });

    return { success: true, data };
  } catch (err) {
    logEventError({
      step: "AUTH",
      operation: "REGISTER_FAILED",
      userId: null,
      err,
    });

    return { success: false, error: "Erro interno do servidor" };
  }
}

export async function signIn(email, password) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logEventError({
        step: "AUTH",
        operation: "LOGIN_FAILED",
        userId: null,
        error,
      });
      return { success: false, error: error.message };
    }

    logEvent({
      step: "AUTH",
      operation: "LOGIN_SUCCESS",
      userId: data.user?.id,
    });
    return { success: true, data };
  } catch (err) {
    logEventError({
      step: "AUTH",
      operation: "LOGIN_FAILED",
      userId: null,
      err,
    });
    return { success: false, error: "Erro interno do servidor" };
  }
}

export async function signOut() {
  try {
    const supabase = await createClient();

    // Pegar user antes de fazer logout
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("Logout error");
      return { success: false, error: error.message };
    }

    console.log("Logout OK");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Erro interno do servidor" };
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient();

    // ✅ SEMPRE usar getUser() em server code - revalida o token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user };
  } catch (err) {
    return { success: false, error: "Erro interno do servidor" };
  }
}
