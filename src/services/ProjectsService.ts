import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";

export type ProjectStatus = "Ongoing" | "Completed" | "Cancelled" | "Pending" | string;

export interface ProjectImageRecord {
  projectImage: string;
}

// Mirrors the fields homedot-mobile-app's UserSideProjectListingCards reads
// straight off each list item.
export interface ProjectRecord {
  _id: string;
  projectName: string;
  projectImages?: ProjectImageRecord[];
  projectStatus: ProjectStatus;
  startDate?: string;
  endDate?: string;
  location?: string;
  projectSlug: string;
}

// ALL_PROJECTS returns one page shared across all three status buckets,
// not a separately-paginated list per tab.
export interface ProjectListGroups {
  ongoing?: ProjectRecord[];
  completed?: ProjectRecord[];
  cancelled?: ProjectRecord[];
}

export interface ProjectListBody {
  status: boolean;
  message: string;
  data: ProjectListGroups[];
}

export interface ProjectDetailProfessional {
  name?: string;
}

// Mirrors the fields homedot-mobile-app's UserSideProjectsDetailedsScreen
// reads off `selectedProjectDetailed`.
export interface ProjectDetailRecord {
  _id: string;
  projectName: string;
  projectStatus: ProjectStatus;
  location?: string;
  startDate?: string;
  endDate?: string;
  professionalUser?: ProjectDetailProfessional[];
  projectImageList?: ProjectImageRecord[];
}

// Not wrapped the usual way — PROJECT_DETAILED returns `data: [{...}]`, read
// as data[0], same convention as several other single-record endpoints here.
export interface ProjectDetailBody {
  status: boolean;
  message: string;
  data: ProjectDetailRecord[];
}

export interface ProjectActionBody {
  status: boolean;
  message: string;
}

// All "my projects" API calls live here. Screens/components only ever
// import this file — never ApiService or fetch directly.
export const ProjectsService = {
  // Requires a stored auth token.
  getMyProjects: (page = 1): Promise<ApiResponse<ProjectListBody>> =>
    ApiService.get<ProjectListBody>(API_ENDPOINTS.PROJECTS.LIST(page)),

  // Requires a stored auth token.
  getProjectDetail: (slug: string): Promise<ApiResponse<ProjectDetailBody>> =>
    ApiService.get<ProjectDetailBody>(API_ENDPOINTS.PROJECTS.DETAIL(slug)),

  // Requires a stored auth token. Marks an ongoing project as complete —
  // mirrors homedot-mobile-app's completeProject.
  completeProject: (id: string, completedDate: string): Promise<ApiResponse<ProjectActionBody>> =>
    ApiService.post<ProjectActionBody>(API_ENDPOINTS.PROJECTS.COMPLETE(id), { completedDate }),

  // Requires a stored auth token. Rates/reviews the professional who worked
  // the project — mirrors homedot-mobile-app's projectReview.
  addProjectRating: (id: string, rating: number, review: string): Promise<ApiResponse<ProjectActionBody>> =>
    ApiService.post<ProjectActionBody>(API_ENDPOINTS.PROJECTS.ADD_RATING(id), { rating, review }),

  // Requires a stored auth token. A separate review of the HomeDot app
  // itself, prompted right after the project's professional review —
  // mirrors homedot-mobile-app's appReview. Note the plural `reviews` field.
  addAppReview: (rating: number, reviews: string): Promise<ApiResponse<ProjectActionBody>> =>
    ApiService.post<ProjectActionBody>(API_ENDPOINTS.PROJECTS.APP_REVIEW, { rating, reviews }),
};

export default ProjectsService;
