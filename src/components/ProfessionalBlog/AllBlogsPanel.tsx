"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import BlogCard from "@/components/BlogCard";
import CardSkeleton from "@/components/CardSkeleton";
import Reveal from "@/components/Reveal";
import LoadMoreButton from "@/components/LoadMoreButton";
import BlogScreenService, {
  toBlogCard,
  toBlogArticle,
  type BlogCard as BlogCardData,
  type BlogArticle,
} from "@/services/BlogScreenService";
import BlogDetail from "@/screens/BlogScreen/BlogDetail";
import { fallbackPosts } from "@/screens/BlogScreen/data";

/** "All Blogs" — the professional dashboard counterpart of homedot-mobile-app's
 * AllBlogList "All" tab (every professional's published blog, not just the
 * signed-in professional's own — that's ProfessionalBlogScreen's separate
 * "My Blogs" mode). Reuses BlogScreenService/BlogCard/BlogDetail as-is
 * rather than wiring PROFESSIONALS_API's GET_ALL_BLOGS
 * ("commonblog/favorites-blog-list") — the guest BLOG.LIST feed already
 * personalizes with fav state for any signed-in caller (ApiService attaches
 * the token automatically), same reasoning BlogScreenService's own comment
 * on BLOG.LIST gives for not duplicating that branch. No login-gating here
 * (unlike BlogScreen) since this only ever renders once the professional is
 * already signed in. Mobile's category tabs (House/Garden/Home Design)
 * aren't reproduced — the web /blog feed already dropped those in favor of
 * a single feed + search, and this mirrors that same simplification. */
export default function AllBlogsPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<BlogCardData[]>(fallbackPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const [saved, setSaved] = useState<string[]>([]);
  const [detail, setDetail] = useState<BlogArticle | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const autoOpenHandled = useRef(false);

  useEffect(() => {
    BlogScreenService.getFavoriteBlogs().then((res) => {
      if (res.success && res.data?.status && res.data.data) {
        setSaved(res.data.data.map((b) => b.blogId || b._id || ""));
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    BlogScreenService.getBlogList(1).then((res) => {
      if (cancelled) return;
      setInitialLoad(false);
      const result = res.data?.data?.[0];
      if (res.success && res.data?.status) {
        const list = result ? result.data.map(toBlogCard) : [];
        setPosts(list);
        setPage(1);
        setHasMore(list.length > 0 && (result?.totalCount ? list.length < result.totalCount.total_rows : true));
      } else {
        setPosts([]);
        setHasMore(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const res = await BlogScreenService.getBlogList(page + 1);
    setLoadingMore(false);
    const result = res.data?.data?.[0];
    if (res.success && res.data?.status && result && result.data.length > 0) {
      const next = result.data.map(toBlogCard);
      setPosts((prev) => [...prev, ...next]);
      setPage((p) => p + 1);
      if (result.totalCount) setHasMore(posts.length + next.length < result.totalCount.total_rows);
    } else {
      setHasMore(false);
    }
  };

  const setPostQueryParam = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("post", slug);
    else params.delete("post");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const openDetail = (slug: string) => {
    autoOpenHandled.current = true;
    setDetailLoading(true);
    setDetail(null);
    setPostQueryParam(slug);
    BlogScreenService.getBlogDetail(slug).then((res) => {
      setDetailLoading(false);
      if (res.success && res.data?.status && res.data.data) {
        setDetail(toBlogArticle(res.data.data));
      }
    });
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailLoading(false);
    setPostQueryParam(null);
  };

  // Resolves a shared "?post=<slug>" link once — same best-effort-once
  // pattern as BlogScreen's identical effect.
  useEffect(() => {
    if (autoOpenHandled.current) return;
    const slug = searchParams.get("post");
    if (!slug) return;
    autoOpenHandled.current = true;
    const timer = setTimeout(() => openDetail(slug), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSave = (id: string) => {
    const wasSaved = saved.includes(id);
    setSaved((s) => (wasSaved ? s.filter((x) => x !== id) : [...s, id]));
    BlogScreenService.toggleFavoriteBlog(id).then((res) => {
      if (!res.success) {
        setSaved((s) => (wasSaved ? [...s, id] : s.filter((x) => x !== id)));
      }
    });
  };

  const list = useMemo(() => {
    if (!query.trim()) return posts;
    const q = query.trim().toLowerCase();
    return posts.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
  }, [posts, query]);

  const [featured, ...rest] = list;

  if (detail || detailLoading) {
    return (
      <BlogDetail
        article={detail}
        loading={detailLoading}
        saved={!!detail && saved.includes(detail.id)}
        onSave={() => detail && toggleSave(detail.id)}
        onBack={closeDetail}
        onOpenRelated={openDetail}
      />
    );
  }

  return (
    <div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          height: 46,
          border: `1.5px solid ${colors.line}`,
          borderRadius: radius.md,
          padding: "0 14px",
          color: colors.muted,
          background: colors.bg,
          marginBottom: spacing.lg,
        }}
      >
        <Icon name="search" size={17} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all blogs — kitchens, budgets, contractors…"
          style={{ border: "none", outline: "none", background: "none", width: "100%", fontSize: fontSize.sm, color: colors.ink }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            style={{ display: "flex", flexShrink: 0, color: colors.muted }}
          >
            <Icon name="close" size={14} />
          </button>
        )}
      </label>

      {initialLoad ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.lg }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", border: `1px dashed ${colors.line}`, borderRadius: radius.lg, background: colors.bg }}>
          <span
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: colors.primarySoft,
              color: colors.primary,
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
            }}
          >
            <Icon name="book" size={26} />
          </span>
          <h3 style={{ fontSize: fontSize.lg, marginBottom: 8 }}>No blogs match your search</h3>
          <p style={{ color: colors.muted }}>Try a different keyword, or check back soon — professionals post here regularly.</p>
        </div>
      ) : (
        <>
          {featured && !query.trim() && (
            <Reveal style={{ marginBottom: spacing.xl }}>
              <BlogCard post={featured} featured onOpen={() => featured.slug && openDetail(featured.slug)} saved={saved.includes(featured.id)} onSave={toggleSave} />
            </Reveal>
          )}
          <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.lg }}>
            {(query.trim() ? list : rest).map((p) => (
              <BlogCard key={p.id} post={p} onOpen={() => p.slug && openDetail(p.slug)} saved={saved.includes(p.id)} onSave={toggleSave} />
            ))}
          </Reveal>
        </>
      )}

      {hasMore && list.length > 0 && !query.trim() && <LoadMoreButton onClick={loadMore} loading={loadingMore} label="Show more blogs" />}
    </div>
  );
}
