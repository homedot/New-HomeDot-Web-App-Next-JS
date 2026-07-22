import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";

export interface GalleryImageRecord {
  _id: string;
  projectImage: string;
}

export interface GalleryProjectRecord {
  _id: string;
  projectName?: string;
  location?: string;
  projectImageList?: GalleryImageRecord[];
}

// Mirrors homedot-mobile-app's ProfessionalGalleryScreen.js — the portfolio
// endpoint returns active vs. past projects as two separate buckets.
export interface GalleryListRecord {
  projectList?: GalleryProjectRecord[];
  projectHistoryList?: GalleryProjectRecord[];
}

export interface GalleryListBody {
  status: boolean;
  message: string;
  data: GalleryListRecord[];
}

export interface ProfessionalGalleryActionBody {
  status: boolean;
  message: string;
}

// UI-facing, flattened shape — one entry per photo, not per project. Mirrors
// ProfessionalGalleryScreen.js:387-397 exactly: photos from `projectList`
// (active) are tagged `historyType: false`, photos from `projectHistoryList`
// (past) are tagged `historyType: true`, and the final list is
// `past.concat(active)` — history first, then active. `historyType` also
// decides the delete request's `type` field ("outside" for true, "inside"
// for false — see ProfessionalGalleryService.deleteImage).
export interface GalleryImage extends GalleryImageRecord {
  historyType: boolean;
  projectName?: string;
  location?: string;
}

export function flattenGallery(record: GalleryListRecord): GalleryImage[] {
  const active = (record.projectList ?? []).flatMap((p) =>
    (p.projectImageList ?? []).map((img) => ({ ...img, historyType: false, projectName: p.projectName, location: p.location })),
  );
  const past = (record.projectHistoryList ?? []).flatMap((p) =>
    (p.projectImageList ?? []).map((img) => ({ ...img, historyType: true, projectName: p.projectName, location: p.location })),
  );
  return [...past, ...active];
}

// All Workfolio API calls live here — image upload itself reuses
// ProfessionalDashboardService.uploadProjectImage (same COMMON.IMAGE_UPLOAD
// endpoint/field), not duplicated here.
export const ProfessionalGalleryService = {
  // Requires a stored auth token. `userId` is the professional's own
  // professionalInfo[0].userId (from useProfessionalHomeStore), not the
  // professional-info document's own _id.
  getGallery: (userId: string): Promise<ApiResponse<GalleryListBody>> =>
    ApiService.get<GalleryListBody>(API_ENDPOINTS.PROFESSIONAL.GALLERY_LIST(userId)),

  // Requires a stored auth token. `location: "propertyImg"` is a hardcoded
  // literal string in homedot-mobile-app's own ProfessionalDetailsServices.js:66
  // — not a bug here, the address the user actually picks goes into
  // `projectName` instead. Mirrored exactly so this hits the same backend
  // code path mobile does.
  addProject: (payload: { projectName: string; projectImages: string[] }): Promise<ApiResponse<ProfessionalGalleryActionBody>> =>
    ApiService.post<ProfessionalGalleryActionBody>(API_ENDPOINTS.PROFESSIONAL.ADD_PROJECT_GALLERY, {
      location: "propertyImg",
      projectName: payload.projectName,
      project_images: payload.projectImages,
    }),

  // Requires a stored auth token.
  deleteImage: (imageId: string, historyType: boolean): Promise<ApiResponse<ProfessionalGalleryActionBody>> =>
    ApiService.post<ProfessionalGalleryActionBody>(API_ENDPOINTS.PROFESSIONAL.GALLERY_IMAGE_DELETE, {
      image: imageId,
      type: historyType ? "outside" : "inside",
    }),
};

export default ProfessionalGalleryService;
