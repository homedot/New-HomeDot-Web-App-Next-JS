import BlogScreenService, {
  toBlogCard,
  type BlogCard,
} from "@/services/BlogScreenService";

export interface BlogInitialData {
  posts: BlogCard[];
  hasMore: boolean;
}

// Fetches the first page of the blog feed server-side, so the browser never
// issues this request itself on initial load. Mirrors BlogScreen's own
// getBlogList(1) success/failure handling exactly.
export async function getBlogInitialData(): Promise<BlogInitialData> {
  const res = await BlogScreenService.getBlogList(1);
  const result = res.data?.data?.[0];
  if (res.success && res.data?.status) {
    const list = result ? result.data.map(toBlogCard) : [];
    return {
      posts: list,
      hasMore:
        list.length > 0 &&
        (result?.totalCount ? list.length < result.totalCount.total_rows : true),
    };
  }
  return { posts: [], hasMore: false };
}
