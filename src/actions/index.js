"use server";

import { revalidatePath } from "next/cache";
import { database } from "../lib/database";
import { createClient } from "../utils/supabase/server";

export async function incrementThumbsUp(post) {
  try {
    // ✅ PROTEÇÃO: Verificar autenticação
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error("Não autenticado");
    }

    await database.incrementPostLikes(post.id);
    revalidatePath("/");
    revalidatePath(`/${post.slug}`);
  } catch (err) {
    throw err;
  }
}

export async function postComment(post, formData) {
  try {
    // ✅ PROTEÇÃO: Verificar autenticação e usar usuário real
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.log("Auth error");
      throw new Error("Não autenticado");
    }

    const username = user.email.split("@")[0];
    const author = await database.getOrCreateUser(username);

    await database.createComment(formData.get("text"), author.id, post.id);
    revalidatePath("/");
    revalidatePath(`/${post.slug}`);

    // Sem logs!
  } catch (err) {
    console.error("Comment error:", err);
    throw err;
  }
}

export async function postReply(parent, formData) {
  try {
    // ✅ PROTEÇÃO: Verificar autenticação e usar usuário real
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error("Não autenticado");
    }

    // ✅ USAR USUÁRIO AUTENTICADO ao invés de hardcoded
    const username = user.email.split("@")[0];
    const author = await database.getOrCreateUser(username);

    // Criar o comentário usando o postId do parent
    await database.createComment(
      formData.get("text"),
      author.id,
      parent.postId, // ✅ Usar postId do comment
      parent.parentId ?? parent.id, // ✅ Parent ID (se for resposta à resposta)
    );

    // Buscar o post para pegar o slug para revalidate
    const post = await database.getPostById(parent.postId);
    revalidatePath(`/${post.slug}`);
  } catch (err) {
    console.error("Reply error:", err);
    throw err;
  }
}
