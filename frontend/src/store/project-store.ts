import { create } from "zustand";
import type { ProjectDetailResponse, ProjectListResponse, ProjectSummary } from "../shared/types/api";
import { getProjectDetail, getProjects } from "../shared/api/toyclaw";

interface ProjectStore {
  projects: ProjectSummary[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  currentProject: ProjectDetailResponse | null;
  detailLoading: boolean;
  detailError: string | null;
  fetchProjects: (page?: number) => Promise<void>;
  fetchProjectDetail: (requestId: string) => Promise<void>;
  clearDetail: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  total: 0,
  page: 1,
  loading: false,
  error: null,
  currentProject: null,
  detailLoading: false,
  detailError: null,
  fetchProjects: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const data: ProjectListResponse = await getProjects({ page, pageSize: 12 });
      set({
        projects: data.projects,
        total: data.total,
        page: data.page,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "加载项目列表失败",
      });
    }
  },
  fetchProjectDetail: async (requestId: string) => {
    set({ detailLoading: true, detailError: null });
    try {
      const data = await getProjectDetail(requestId);
      set({ currentProject: data, detailLoading: false });
    } catch (err) {
      set({
        detailLoading: false,
        detailError: err instanceof Error ? err.message : "加载项目详情失败",
      });
    }
  },
  clearDetail: () => {
    set({ currentProject: null, detailError: null });
  },
}));
