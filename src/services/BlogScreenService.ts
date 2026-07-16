import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";

// The list/search/favorites endpoints all return blogImage as either a bare
// URL string (guest feed) or an array of upload records (professional
// create/edit flow stores `{ imageFile }` objects) — normalizeImage below
// collapses every shape down to a single displayable URL.
export type RawBlogImage = string | { imageFile?: string } | (string | { imageFile?: string })[] | undefined;

export interface BlogAuthorRecord {
  name?: string;
  profileImage?: string;
}

export interface BlogRecord {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  blogImage?: RawBlogImage;
  publishDate?: string;
  authorData?: BlogAuthorRecord[];
  fav?: boolean;
}

export interface BlogListPage {
  data: BlogRecord[];
  totalCount?: { total_rows: number };
}

export interface BlogListBody {
  status: boolean;
  message: string;
  data: BlogListPage[];
}

export interface BlogDetailBlock {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  blogImage?: RawBlogImage;
  publishDate?: string;
  authorType?: string;
}

export interface BlogDetailAuthor {
  userId?: { name?: string; profileImage?: string };
  professionalSlug?: string;
  professionalCategoryName?: string;
  description?: string;
}

export interface BlogDetailRelated {
  slug: string;
  title: string;
  description?: string;
  blogImage?: string;
}

export interface BlogDetailData {
  blog: BlogDetailBlock;
  user?: BlogDetailAuthor;
  relatedBlogs?: BlogDetailRelated[];
}

// Not wrapped in the usual `data: [{...}]` array — mirrors
// homedot-mobile-app's blogDetailed, which reads `res.data.data` directly.
export interface BlogDetailBody {
  status: boolean;
  message: string;
  data: BlogDetailData;
}

// FAVORITE_BLOG returns a flat array directly under `data`, not the
// `data: [{ data: [] }]` double-wrap the list endpoints use — confirmed
// against homedot-mobile-app's addToFavorite handler, which reads
// `res.data.data` straight into its favorites state.
export interface FavoriteBlogBody {
  status: boolean;
  message: string;
  data: BlogRecord[];
}

export interface ToggleFavoriteBlogBody {
  status: boolean;
  message: string;
}

export type BlogCategory = "house" | "garden" | "home";

// All Blog screen API calls live here. The screen only ever imports this
// file — never ApiService or fetch directly.
export const BlogScreenService = {
  // Guest-accessible — no auth required.
  getBlogList: (page: number): Promise<ApiResponse<BlogListBody>> =>
    ApiService.get<BlogListBody>(API_ENDPOINTS.BLOG.LIST(page)),

  // Guest-accessible — no auth required.
  getBlogsByCategory: (category: BlogCategory): Promise<ApiResponse<BlogListBody>> =>
    ApiService.get<BlogListBody>(API_ENDPOINTS.BLOG.SEARCH_BY_TYPE(category)),

  // Guest-accessible — no auth required.
  getBlogDetail: (slug: string): Promise<ApiResponse<BlogDetailBody>> =>
    ApiService.get<BlogDetailBody>(API_ENDPOINTS.BLOG.DETAIL(slug)),

  // Requires a stored auth token. A single endpoint toggles favorite/
  // unfavorite for that blog — calling it again un-favorites it, same
  // pattern as ProfessionalsScreenService.toggleFavoriteProfessional.
  toggleFavoriteBlog: (blogId: string): Promise<ApiResponse<ToggleFavoriteBlogBody>> =>
    ApiService.post<ToggleFavoriteBlogBody>(API_ENDPOINTS.BLOG.TOGGLE_FAVORITE, { blog: blogId }),

  // Requires a stored auth token.
  getFavoriteBlogs: (): Promise<ApiResponse<FavoriteBlogBody>> =>
    ApiService.get<FavoriteBlogBody>(API_ENDPOINTS.BLOG.GET_FAVORITES),
};

const FALLBACK_BLOG_IMAGE =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80";

// Collapses the string | {imageFile} | array-of-either shape every blog
// image field can arrive in down to a single displayable URL.
export function normalizeBlogImage(raw: RawBlogImage): string {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (typeof first === "string" && first) return first;
  if (first && typeof first === "object" && first.imageFile) return first.imageFile;
  return FALLBACK_BLOG_IMAGE;
}

function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function formatBlogDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export interface BlogCard {
  id: string;
  slug: string;
  image: string;
  author: string;
  authorAvatar?: string;
  date: string;
  title: string;
  excerpt: string;
  fav: boolean;
}

// Maps a raw list/search/favorites record onto the card shape BlogCard and
// BlogScreen render.
export function toBlogCard(record: BlogRecord): BlogCard {
  return {
    id: record._id,
    slug: record.slug,
    image: normalizeBlogImage(record.blogImage),
    author: record.authorData?.[0]?.name?.trim() || "HomeDot",
    authorAvatar: record.authorData?.[0]?.profileImage,
    date: formatBlogDate(record.publishDate),
    title: record.title.trim(),
    excerpt: record.description ? truncate(record.description, 150) : "",
    fav: !!record.fav,
  };
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  date: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: string;
  authorBio?: string;
  professionalSlug?: string;
  related: BlogCard[];
}

// Maps a raw /blog/get-single-blog/:slug response onto the full article
// shape BlogDetail renders.
export function toBlogArticle(data: BlogDetailData): BlogArticle {
  const { blog, user, relatedBlogs } = data;
  return {
    id: blog._id,
    slug: blog.slug,
    title: blog.title.trim(),
    description: blog.description?.trim() || "",
    image: normalizeBlogImage(blog.blogImage),
    date: formatBlogDate(blog.publishDate),
    authorName: user?.userId?.name?.trim() || "HomeDot",
    authorAvatar: user?.userId?.profileImage,
    authorRole: user?.professionalCategoryName,
    authorBio: user?.description,
    professionalSlug: user?.professionalSlug,
    related: (relatedBlogs ?? []).map((r) => ({
      id: r.slug,
      slug: r.slug,
      image: r.blogImage || FALLBACK_BLOG_IMAGE,
      author: "HomeDot",
      date: "",
      title: r.title.trim(),
      excerpt: r.description ? truncate(r.description, 110) : "",
      fav: false,
    })),
  };
}

export default BlogScreenService;
