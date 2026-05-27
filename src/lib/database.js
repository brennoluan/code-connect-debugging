import logger from "../logger";
import db from "../../supabase/db";

// Data layer para centralizar todas as consultas do Supabase
export class DatabaseService {
  // ===== POSTS =====

  async getAllPosts(page = 1, searchTerm = null) {
    try {
      const perPage = 4;
      const skip = (page - 1) * perPage;

      // Construir query base
      let query = db
        .from("Post")
        .select(
          `
          *,
          author:User(*),
          comments:Comment(*)
        `,
        )
        .order("id", { ascending: false })
        .range(skip, skip + perPage - 1);

      // Adicionar filtro de busca se necessário
      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }

      const { data: posts, error, count } = await query;

      if (error) {
        logger.error("DB:getAllPosts error", {
          step: "DATABASE",
          operation: "LIST_POSTS",
          page,
          searchTerm,
          perPage,
          error,
        });

        throw error;
      }

      // Calcular paginação
      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / perPage);
      const prev = page > 1 ? page - 1 : null;
      const next = page < totalPages ? page + 1 : null;

      logger.info("DB:getAllPosts success", {
        step: "DATABASE",
        operation: "LIST_POSTS",
        page,
        searchTerm,
        perPage,
      });

      return { data: posts || [], prev, next };
    } catch (error) {
      logger.error("DB:getAllPosts unexpected error", {
        step: "DATABASE",
        operation: "LIST_POSTS",
        page,
        searchTerm,
        perPage,
        error,
      });
      return { data: [], prev: null, next: null };
    }
  }

  async getPostBySlug(slug) {
    try {
      const { data: post, error } = await db
        .from("Post")
        .select(
          `
          *,
          author:User(*),
          comments:Comment(
            *,
            author:User(*),
            children:Comment(
              *,
              author:User(*)
            )
          )
        `,
        )
        .eq("slug", slug)
        .single();

      if (error) {
        logger.error("DB:getPostBySlug error", {
          step: "DATABASE",
          operation: "GET_POST_BY_SLUG",
          slug,
          error,
        });

        throw error;
      }

      if (!post) {
        logger.warn("DB:getPostBySlug post not found", {
          step: "DATABASE",
          operation: "GET_POST_BY_SLUG",
          slug,
        });

        const notFoundError = new Error(
          `Post com o slug ${slug} não foi encontrado`,
        );

        throw notFoundError;
      }

      // Filtrar apenas comentários principais (parentId = null)
      const mainComments =
        post.comments?.filter((comment) => comment.parentId === null) || [];
      post.comments = mainComments;

      logger.info("DB:getPostBySlug success", {
        step: "DATABASE",
        operation: "GET_POST_BY_SLUG",
        slug,
        postId: post.id,
      });

      return post;
    } catch (error) {
      logger.error("DB:getPostBySlug unexpected error", {
        step: "DATABASE",
        operation: "GET_POST_BY_SLUG",
        slug,
        error,
      });
      throw error;
    }
  }

  async getPostById(postId) {
    try {
      const { data: post, error } = await db
        .from("Post")
        .select("id, slug, title")
        .eq("id", postId)
        .single();

      if (error) {
        logger.error("DB:getPostById error", {
          step: "DATABASE",
          operation: "GET_POST_BY_ID",
          postId,
          error,
        });

        throw error;
      }

      if (!post) {
        logger.warn("DB:getPostById post not found", {
          step: "DATABASE",
          operation: "GET_POST_BY_ID",
          postId,
        });

        const notFoundError = new Error(
          `Post com ID ${postId} não foi encontrado`,
        );

        throw notFoundError;
      }

      logger.info("DB:getPostById success", {
        step: "DATABASE",
        operation: "GET_POST_BY_ID",
        postId,
        slug: post.slug,
      });

      return post;
    } catch (error) {
      logger.error("DB:getPostById unexpected error", {
        step: "DATABASE",
        operation: "GET_POST_BY_ID",
        postId,
        error,
      });
      throw error;
    }
  }

  async incrementPostLikes(postId) {
    try {
      // Primeiro buscar o post atual para pegar o número de likes
      const { data: currentPost, error: fetchError } = await db
        .from("Post")
        .select("likes")
        .eq("id", postId)
        .single();

      if (fetchError) {
        logger.error("DB:incrementPostLikes fetch error", {
          step: "DATABASE",
          operation: "INCREMENT_POST_LIKES",
          postId,
          error: fetchError,
        });

        throw fetchError;
      }

      // Incrementar likes
      const { data, error } = await db
        .from("Post")
        .update({ likes: (currentPost.likes || 0) + 1 })
        .eq("id", postId)
        .select()
        .single();

      if (error) {
        logger.error("DB:incrementPostLikes update error", {
          step: "DATABASE",
          operation: "INCREMENT_POST_LIKES",
          postId,
          error,
        });

        throw error;
      }

      logger.info("DB:incrementPostLikes success", {
        step: "DATABASE",
        operation: "INCREMENT_POST_LIKES",
        postId,
        likes: data.likes,
      });

      return data;
    } catch (error) {
      logger.error("DB:incrementPostLikes unexpected error", {
        step: "DATABASE",
        operation: "INCREMENT_POST_LIKES",
        postId,
        error,
      });
      throw error;
    }
  }

  // ===== COMMENTS =====

  async createComment(text, authorId, postId, parentId = null) {
    try {
      const { data, error } = await db
        .from("Comment")
        .insert({
          text,
          authorId,
          postId,
          parentId,
        })
        .select(
          `
          *,
          author:User(*)
        `,
        )
        .single();

      if (error) {
        logger.error("DB:createComment error", {
          step: "DATABASE",
          operation: "CREATE_COMMENT",
          authorId,
          postId,
          parentId,
          error,
        });

        throw error;
      }

      logger.info("DB:createComment success", {
        step: "DATABASE",
        operation: "CREATE_COMMENT",
        commentId: data.id,
        authorId,
        postId,
        parentId,
      });

      return data;
    } catch (error) {
      logger.error("DB:createComment unexpected error", {
        step: "DATABASE",
        operation: "CREATE_COMMENT",
        authorId,
        postId,
        parentId,
        error,
      });
      throw error;
    }
  }

  async getCommentReplies(parentId) {
    try {
      const { data: replies, error } = await db
        .from("Comment")
        .select(
          `
          *,
          author:User(*)
        `,
        )
        .eq("parentId", parentId)
        .order("createdAt", { ascending: true });

      if (error) {
        logger.error("DB:getCommentReplies error", {
          step: "DATABASE",
          operation: "GET_COMMENT_REPLIES",
          parentId,
          error,
        });

        throw error;
      }

      logger.info("DB:getCommentReplies success", {
        step: "DATABASE",
        operation: "GET_COMMENT_REPLIES",
        parentId,
        count: replies?.length ?? 0,
      });

      return replies || [];
    } catch (error) {
      logger.error("DB:getCommentReplies unexpected error", {
        step: "DATABASE",
        operation: "GET_COMMENT_REPLIES",
        parentId,
        error,
      });
      return [];
    }
  }

  // ===== USERS =====

  async getOrCreateUser(username) {
    try {
      // Tentar buscar o usuário primeiro
      const { data: existingUser, error: fetchError } = await db
        .from("User")
        .select("*")
        .eq("username", username)
        .maybeSingle(); // ✅ maybeSingle() não dá erro se não encontrar

      if (existingUser) {
        logger.info("DB:getOrCreateUser found existing", {
          step: "DATABASE",
          operation: "GET_OR_CREATE_USER",
          username,
          userId: existingUser.id,
        });

        return existingUser;
      }

      // Se não existe, criar
      const { data: newUser, error: createError } = await db
        .from("User")
        .insert({
          username,
          name: username,
          avatar:
            "https://raw.githubusercontent.com/gss-patricia/code-connect-assets/main/authors/anabeatriz_dev.png",
        })
        .select()
        .single();

      if (createError) {
        logger.error("DB:getOrCreateUser create error", {
          step: "DATABASE",
          operation: "GET_OR_CREATE_USER",
          username,
          error: createError,
        });

        throw createError;
      }

      logger.info("DB:getOrCreateUser created", {
        step: "DATABASE",
        operation: "GET_OR_CREATE_USER",
        username,
        userId: newUser.id,
      });

      return newUser;
    } catch (error) {
      logger.error("DB:getOrCreateUser unexpected error", {
        step: "DATABASE",
        operation: "GET_OR_CREATE_USER",
        username,
        error,
      });
      throw error;
    }
  }

  async getUserByUsername(username) {
    try {
      const { data: user, error } = await db
        .from("User")
        .select("*")
        .eq("username", username)
        .single();

      if (error) {
        logger.error("DB:getUserByUsername error", {
          step: "DATABASE",
          operation: "GET_USER_BY_USERNAME",
          username,
          error,
        });

        throw error;
      }

      logger.info("DB:getUserByUsername success", {
        step: "DATABASE",
        operation: "GET_USER_BY_USERNAME",
        username,
        userId: user.id,
      });

      return user;
    } catch (error) {
      logger.error("DB:getUserByUsername unexpected error", {
        step: "DATABASE",
        operation: "GET_USER_BY_USERNAME",
        username,
        error,
      });
      throw error;
    }
  }

  // ===== UTILS =====

  async getPostCount(searchTerm = null) {
    try {
      let query = db.from("Post").select("*", { count: "exact", head: true });

      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }

      const { count, error } = await query;

      if (error) {
        logger.error("DB:getPostCount error", {
          step: "DATABASE",
          operation: "GET_POST_COUNT",
          searchTerm,
          error,
        });

        throw error;
      }

      logger.info("DB:getPostCount success", {
        step: "DATABASE",
        operation: "GET_POST_COUNT",
        searchTerm,
        count: count || 0,
      });

      return count || 0;
    } catch (error) {
      logger.error("DB:getPostCount unexpected error", {
        step: "DATABASE",
        operation: "GET_POST_COUNT",
        searchTerm,
        error,
      });
      return 0;
    }
  }
}

// Instância singleton
export const database = new DatabaseService();
export default database;
