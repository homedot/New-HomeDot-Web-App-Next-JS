"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "@/utils/authStorage";
import ProfessionalBlogService, {
  type ProfessionalBlogRecord,
  type CreateOrUpdateBlogPayload,
} from "@/services/ProfessionalBlogService";

export type BlogTab = "published" | "draft";

// Form payload the create/edit modal submits — same shape the mutate
// endpoints expect minus `status` (ProfessionalBlogService.createBlog/
// updateBlog always sends `status: true` themselves).
export type BlogFormPayload = Omit<CreateOrUpdateBlogPayload, never>;

/** Shared "My Blogs" data + mutations for ProfessionalBlogScreen — same
 * shape as useProfessionalEnquiries.ts (auth-token check on mount, refresh/
 * loadMore/toast conventions). Published and draft blogs are two separate
 * lists (mirrors homedot-mobile-app's BLOG_LIST vs BLOG_DRAFT_LIST — drafts
 * aren't paginated there, so loadMore only ever applies to `published`).
 * `formTarget` doubles as the create/edit modal's open state: "new" opens
 * it in create mode, a record opens it pre-filled for editing, null keeps
 * it closed — avoids a separate boolean that could disagree with which
 * record is being edited. */
export function useProfessionalBlogs() {
  const [tab, setTab] = useState<BlogTab>("published");

  const [published, setPublished] = useState<ProfessionalBlogRecord[]>([]);
  const [publishedCount, setPublishedCount] = useState(0);
  const [publishedPage, setPublishedPage] = useState(1);
  const [drafts, setDrafts] = useState<ProfessionalBlogRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [formTarget, setFormTarget] = useState<"new" | ProfessionalBlogRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const [pubRes, draftRes] = await Promise.all([
      ProfessionalBlogService.getBlogList(1),
      ProfessionalBlogService.getDraftBlogs(),
    ]);
    setLoading(false);
    if (pubRes.success && pubRes.data?.status) {
      const page = pubRes.data.data?.[0];
      setPublished(page?.data ?? []);
      setPublishedCount(page?.totalCount?.total_rows ?? page?.data?.length ?? 0);
      setPublishedPage(1);
    }
    if (draftRes.success && draftRes.data?.status) {
      setDrafts(draftRes.data.data?.[0]?.data ?? []);
    }
  };

  useEffect(() => {
    if (!getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
      setLoading(false);
      return;
    }
    refresh();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = publishedPage + 1;
    const res = await ProfessionalBlogService.getBlogList(nextPage);
    setLoadingMore(false);
    const next = res.data?.data?.[0]?.data;
    if (res.success && res.data?.status && next && next.length > 0) {
      setPublished((prev) => [...prev, ...next]);
      setPublishedPage(nextPage);
    }
  };

  const openCreate = () => setFormTarget("new");
  const openEdit = (record: ProfessionalBlogRecord) => setFormTarget(record);
  const closeForm = () => setFormTarget(null);

  const submitForm = async (payload: BlogFormPayload) => {
    setSaving(true);
    const res =
      formTarget === "new"
        ? await ProfessionalBlogService.createBlog(payload)
        : await ProfessionalBlogService.updateBlog(formTarget!.slug, payload);
    setSaving(false);
    if (res.success && res.data?.status !== false) {
      const wasCreate = formTarget === "new";
      closeForm();
      refresh();
      setToast(res.data?.message || (wasCreate ? "Blog saved." : "Blog updated."));
    } else {
      setToast(res.data?.message || res.message || "Something went wrong.");
    }
  };

  const requestDelete = (id: string) => setDeletingId(id);
  const cancelDelete = () => setDeletingId(null);

  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    const res = await ProfessionalBlogService.deleteBlog(deletingId);
    setDeleting(false);
    setDeletingId(null);
    if (res.success && res.data?.status !== false) {
      refresh();
      setToast(res.data?.message || "Blog deleted.");
    } else {
      setToast(res.data?.message || res.message || "Something went wrong.");
    }
  };

  return {
    tab,
    setTab,
    published,
    publishedCount,
    drafts,
    loading,
    loadingMore,
    refresh,
    loadMore,
    formTarget,
    openCreate,
    openEdit,
    closeForm,
    saving,
    submitForm,
    deletingId,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
    toast,
  };
}

export default useProfessionalBlogs;
