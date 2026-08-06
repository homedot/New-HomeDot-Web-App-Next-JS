import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";
import { normalizeBlogImage, type RawBlogImage } from "./BlogScreenService";

// The signed-in professional's own blog record — same underlying shape as
// BlogScreenService's BlogRecord (blogImage arrives in the same
// string/object/array form) plus the two fields only the owner's own list
// exposes: `draft` and `status`.
export interface ProfessionalBlogRecord {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  blogImage?: RawBlogImage;
  publishDate?: string;
  draft?: boolean;
  status?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfessionalBlogListPage {
  data: ProfessionalBlogRecord[];
  totalCount?: { total_rows: number };
}

// Double-wrapped like every other list endpoint in this codebase — mirrors
// homedot-mobile-app's blogList/getBlogDraftList, which both read
// `res.data.data[0].data`. Shared by both BLOG_LIST and BLOG_DRAFT_LIST,
// which return the identical shape (drafts just aren't paginated).
export interface ProfessionalBlogListBody {
  status: boolean;
  message: string;
  data: ProfessionalBlogListPage[];
}

export interface CreateOrUpdateBlogPayload {
  title: string;
  description: string;
  publishDate: string;
  blog_images: string[];
  draft: boolean;
}

export interface MutateBlogBody {
  status: boolean;
  message: string;
  data?: ProfessionalBlogRecord;
}

// All professional "My Blogs" API calls live here — the screen only ever
// imports this file, same convention as BlogScreenService.
export const ProfessionalBlogService = {
  // Requires a stored auth token.
  getBlogList: (page: number): Promise<ApiResponse<ProfessionalBlogListBody>> =>
    ApiService.get<ProfessionalBlogListBody>(API_ENDPOINTS.PROFESSIONAL.BLOG_LIST(page)),

  // Requires a stored auth token.
  getDraftBlogs: (): Promise<ApiResponse<ProfessionalBlogListBody>> =>
    ApiService.get<ProfessionalBlogListBody>(API_ENDPOINTS.PROFESSIONAL.BLOG_DRAFT_LIST),

  // Requires a stored auth token. `status: true` is always sent alongside
  // the payload fields — mirrors homedot-mobile-app's createBlog, which
  // hardcodes it (the professional only ever toggles `draft`, not `status`).
  createBlog: (payload: CreateOrUpdateBlogPayload): Promise<ApiResponse<MutateBlogBody>> =>
    ApiService.post<MutateBlogBody>(API_ENDPOINTS.PROFESSIONAL.BLOG_CREATE, { ...payload, status: true }),

  // Requires a stored auth token. Also used for the draft→publish action —
  // callers just pass `draft: false`.
  updateBlog: (slug: string, payload: CreateOrUpdateBlogPayload): Promise<ApiResponse<MutateBlogBody>> =>
    ApiService.put<MutateBlogBody>(API_ENDPOINTS.PROFESSIONAL.BLOG_UPDATE(slug), { ...payload, status: true }),

  // Requires a stored auth token. PUT, no body — soft delete.
  deleteBlog: (id: string): Promise<ApiResponse<MutateBlogBody>> =>
    ApiService.put<MutateBlogBody>(API_ENDPOINTS.PROFESSIONAL.BLOG_DELETE(id)),
};

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

export interface ProfessionalBlogCard {
  id: string;
  slug: string;
  image: string;
  title: string;
  excerpt: string;
  date: string;
  draft: boolean;
}

// Maps a raw BLOG_LIST/BLOG_DRAFT_LIST record onto the card shape
// ProfessionalBlog/Card renders.
export function toProfessionalBlogCard(record: ProfessionalBlogRecord): ProfessionalBlogCard {
  return {
    id: record._id,
    slug: record.slug,
    image: normalizeBlogImage(record.blogImage),
    title: (record.title || "").trim(),
    excerpt: record.description ? truncate(record.description, 150) : "",
    date: formatBlogDate(record.publishDate),
    draft: !!record.draft,
  };
}

export default ProfessionalBlogService;
