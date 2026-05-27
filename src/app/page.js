import { CardPost } from "../components/CardPost";
import { database } from "../lib/database";
import { createClient } from "../utils/supabase/server";
import { redirect } from "next/navigation";
import { logEvent } from "@/eventLogger";
import styles from "./page.module.css";
import Link from "next/link";

// Desabilitar cache para páginas protegidas
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getAllPosts(page, searchTerm) {
  return await database.getAllPosts(page, searchTerm);
}

export default async function Home({ searchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Se não houver usuário autenticado, redireciona para login
  if (error || !user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const currentPage = parseInt(resolvedSearchParams?.page || 1);
  const searchTerm = resolvedSearchParams?.q;
  const {
    data: posts,
    prev,
    next,
  } = await getAllPosts(currentPage, searchTerm);

  logEvent({
    step: "PAGE_VIEW",
    operation: "HOME_VIEW",
    userId: user.id,
  });

  return (
    <main className={styles.grid}>
      {posts.map((post) => (
        <CardPost key={post.id} post={post} />
      ))}
      <div className={styles.links}>
        {prev && (
          <Link href={{ pathname: "/", query: { page: prev, q: searchTerm } }}>
            Página anterior
          </Link>
        )}
        {next && (
          <Link href={{ pathname: "/", query: { page: next, q: searchTerm } }}>
            Próxima página
          </Link>
        )}
      </div>
    </main>
  );
}
