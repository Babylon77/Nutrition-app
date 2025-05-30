import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  Food,
  FoodLogEntry,
  BloodworkEntry,
  Analysis,
  RegisterData,
  LoginData,
  ApiResponse,
  PaginatedResponse,
  NutritionSummary,
  LabValue,
} from '../types';

// Use current origin in production, localhost in development
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? `${window.location.origin}/api` : 'http://localhost:5000/api');

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(data: LoginData): Promise<{ user: User; token: string }> {
    const response = await this.api.post('/auth/login', data);
    return response.data; // Backend returns data directly
  }

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    console.log('Sending to backend:', data); // Debug log
    const response = await this.api.post('/auth/register', data);
    return response.data; // Backend returns data directly
  }

  async getProfile(): Promise<any> {
    const response = await this.api.get('/auth/me');
    return response.data.user; // Backend returns { success: true, user: {...} }
  }

  async updateProfile(data: Partial<any>): Promise<any> {
    const response = await this.api.put('/auth/profile', data);
    return response.data.user; // Backend returns { success: true, user: {...} }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.put('/auth/password', { currentPassword, newPassword });
  }

  // Food endpoints
  async searchFoods(query: string): Promise<Food[]> {
    const response: AxiosResponse<ApiResponse<Food[]>> = 
      await this.api.get(`/food/search?q=${encodeURIComponent(query)}`);
    return response.data.data!;
  }

  async getFoodNutrition(foodId: string, quantity: number, unit: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = 
      await this.api.get(`/food/${foodId}/nutrition?quantity=${quantity}&unit=${unit}`);
    return response.data.data!;
  }

  async getFoodLogs(page = 1, limit = 10): Promise<PaginatedResponse<FoodLogEntry>> {
    const response: AxiosResponse<PaginatedResponse<FoodLogEntry>> = 
      await this.api.get(`/food/logs?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getFoodLogByDate(date: string): Promise<FoodLogEntry | null> {
    try {
      const response: AxiosResponse<ApiResponse<FoodLogEntry>> = 
        await this.api.get(`/food/logs/${date}`);
      return response.data.data!;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createFoodLog(date: string, meals: any): Promise<FoodLogEntry> {
    const response: AxiosResponse<ApiResponse<FoodLogEntry>> = 
      await this.api.post('/food/logs', { date, meals });
    return response.data.data!;
  }

  async updateFoodLog(date: string, meals: any): Promise<FoodLogEntry> {
    const response: AxiosResponse<ApiResponse<FoodLogEntry>> = 
      await this.api.put(`/food/logs/${date}`, { meals });
    return response.data.data!;
  }

  async deleteFoodLog(date: string): Promise<void> {
    await this.api.delete(`/food/logs/${date}`);
  }

  async getNutritionSummary(days = 30): Promise<NutritionSummary> {
    const response: AxiosResponse<ApiResponse<NutritionSummary>> = 
      await this.api.get(`/food/summary?days=${days}`);
    return response.data.data!;
  }

  // Bloodwork endpoints
  async uploadBloodworkPDF(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('pdf', file);
    
    const response: AxiosResponse<any> = 
      await this.api.post('/bloodwork/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    return response.data; // Return full response including metadata
  }

  async createBloodworkEntry(date: string, labValues: LabValue[]): Promise<BloodworkEntry> {
    const response: AxiosResponse<ApiResponse<BloodworkEntry>> = 
      await this.api.post('/bloodwork/manual', { date, labValues });
    return response.data.data!;
  }

  async getBloodworkEntries(page = 1, limit = 10): Promise<PaginatedResponse<BloodworkEntry>> {
    const response: AxiosResponse<PaginatedResponse<BloodworkEntry>> = 
      await this.api.get(`/bloodwork?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getBloodworkEntry(id: string): Promise<BloodworkEntry> {
    const response: AxiosResponse<ApiResponse<BloodworkEntry>> = 
      await this.api.get(`/bloodwork/${id}`);
    return response.data.data!;
  }

  async updateBloodworkEntry(id: string, labValues: LabValue[]): Promise<BloodworkEntry> {
    const response: AxiosResponse<ApiResponse<BloodworkEntry>> = 
      await this.api.put(`/bloodwork/${id}`, { labValues });
    return response.data.data!;
  }

  async deleteBloodworkEntry(id: string): Promise<void> {
    await this.api.delete(`/bloodwork/${id}`);
  }

  getBloodworkPDFUrl(id: string): string {
    const token = localStorage.getItem('token');
    const baseUrl = `${this.api.defaults.baseURL}/bloodwork/${id}/pdf`;
    return token ? `${baseUrl}?token=${token}` : baseUrl;
  }

  async getBloodworkTrends(category?: string): Promise<any> {
    const url = category ? `/bloodwork/trends?category=${category}` : '/bloodwork/trends';
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(url);
    return response.data.data!;
  }

  // Analysis endpoints
  async analyzeNutrition(days = 7): Promise<Analysis> {
    const response: AxiosResponse<ApiResponse<Analysis>> = 
      await this.api.post('/analysis/nutrition', { days });
    return response.data.data!;
  }

  async analyzeBloodwork(bloodworkId?: string): Promise<Analysis> {
    const response: AxiosResponse<ApiResponse<Analysis>> = 
      await this.api.post('/analysis/bloodwork', bloodworkId ? { bloodworkId } : {});
    return response.data.data!;
  }

  async analyzeCorrelation(nutritionDays = 30, bloodworkId?: string): Promise<Analysis> {
    const response: AxiosResponse<ApiResponse<Analysis>> = 
      await this.api.post('/analysis/correlation', { 
        nutritionDays, 
        ...(bloodworkId && { bloodworkId }) 
      });
    return response.data.data!;
  }

  async getAnalyses(page = 1, limit = 10, type?: string): Promise<PaginatedResponse<Analysis>> {
    const url = type ? `/analysis?page=${page}&limit=${limit}&type=${type}` : `/analysis?page=${page}&limit=${limit}`;
    const response: AxiosResponse<PaginatedResponse<Analysis>> = await this.api.get(url);
    return response.data;
  }

  async getAnalysis(id: string): Promise<Analysis> {
    const response: AxiosResponse<ApiResponse<Analysis>> = await this.api.get(`/analysis/${id}`);
    return response.data.data!;
  }

  async deleteAnalysis(id: string): Promise<void> {
    await this.api.delete(`/analysis/${id}`);
  }

  // Development only - delete test users
  async deleteTestUser(email: string): Promise<{ message: string; deletedCount: number }> {
    const response = await this.api.delete(`/auth/delete-test-user/${email}`);
    return response.data; // The backend returns the data directly, not wrapped
  }

  async deleteAllTestUsers(): Promise<{ message: string; deletedCount: number }> {
    const response = await this.api.delete('/auth/delete-all-test-users');
    return response.data; // The backend returns the data directly, not wrapped
  }

  // Get analysis models
  async getAnalysisModels(): Promise<{ models: { value: string; label: string; description: string }[]; currentModel: string }> {
    const response: AxiosResponse<ApiResponse<{ models: { value: string; label: string; description: string }[]; currentModel: string }>> = 
      await this.api.get('/analysis/models');
    return response.data.data!;
  }

  // Supplement endpoints
  async analyzeSupplementWithAI(query: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = 
      await this.api.post('/supplements/analyze', { query });
    return response.data.data!;
  }

  async logSupplement(data: {
    date: string;
    timeOfDay: string;
    supplements: any[];
    notes?: string;
  }): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = 
      await this.api.post('/supplements/log', data);
    return response.data.data!;
  }

  async getSupplementsForDate(date: string): Promise<any[]> {
    const response: AxiosResponse<ApiResponse<any[]>> = 
      await this.api.get(`/supplements/date/${date}`);
    return response.data.data!;
  }

  async deleteSupplementLog(logId: string): Promise<void> {
    await this.api.delete(`/supplements/logs/${logId}`);
  }

  async getSupplementSummary(days = 30): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = 
      await this.api.get(`/supplements/summary?days=${days}`);
    return response.data.data!;
  }
}

export const apiService = new ApiService();

export const auth = {
  register: (data: RegisterData) => 
    apiService.register(data),
  
  login: (data: LoginData) => 
    apiService.login(data),
  
  getProfile: () => 
    apiService.getProfile(),
  
  updateProfile: (data: Partial<any>) => 
    apiService.updateProfile(data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) => 
    apiService.changePassword(data.currentPassword, data.newPassword),
  
  // Development only - delete test users
  deleteTestUser: (email: string) => 
    apiService.deleteTestUser(email),
  
  deleteAllTestUsers: () => 
    apiService.deleteAllTestUsers(),
};

export const food = {
  searchFoods: (query: string) => 
    apiService.searchFoods(query),
  
  getFoodNutrition: (foodId: string, quantity: number, unit: string) => 
    apiService.getFoodNutrition(foodId, quantity, unit),
  
  getFoodLogs: (page = 1, limit = 10) => 
    apiService.getFoodLogs(page, limit),
  
  getFoodLogByDate: (date: string) => 
    apiService.getFoodLogByDate(date),
  
  createFoodLog: (date: string, meals: any) => 
    apiService.createFoodLog(date, meals),
  
  updateFoodLog: (date: string, meals: any) => 
    apiService.updateFoodLog(date, meals),
  
  deleteFoodLog: (date: string) => 
    apiService.deleteFoodLog(date),
  
  getNutritionSummary: (days = 30) => 
    apiService.getNutritionSummary(days),
};

export const bloodwork = {
  uploadBloodworkPDF: (file: File) => 
    apiService.uploadBloodworkPDF(file),
  
  createBloodworkEntry: (date: string, labValues: LabValue[]) => 
    apiService.createBloodworkEntry(date, labValues),
  
  getBloodworkEntries: (page = 1, limit = 10) => 
    apiService.getBloodworkEntries(page, limit),
  
  getBloodworkEntry: (id: string) => 
    apiService.getBloodworkEntry(id),
  
  updateBloodworkEntry: (id: string, labValues: LabValue[]) => 
    apiService.updateBloodworkEntry(id, labValues),
  
  deleteBloodworkEntry: (id: string) => 
    apiService.deleteBloodworkEntry(id),
  
  getBloodworkPDFUrl: (id: string) => 
    apiService.getBloodworkPDFUrl(id),
  
  getBloodworkTrends: (category?: string) => 
    apiService.getBloodworkTrends(category),
};

export const analysis = {
  analyzeNutrition: (days = 7) => 
    apiService.analyzeNutrition(days),
  
  analyzeBloodwork: (bloodworkId?: string) => 
    apiService.analyzeBloodwork(bloodworkId),
  
  analyzeCorrelation: (nutritionDays = 30, bloodworkId?: string) => 
    apiService.analyzeCorrelation(nutritionDays, bloodworkId),
  
  getAnalyses: (page = 1, limit = 10, type?: string) => 
    apiService.getAnalyses(page, limit, type),
  
  getAnalysis: (id: string) => 
    apiService.getAnalysis(id),
  
  deleteAnalysis: (id: string) => 
    apiService.deleteAnalysis(id),

  // Get analysis models
  getAnalysisModels: () => apiService.getAnalysisModels(),
};

export const supplements = {
  analyzeSupplementWithAI: (query: string) => 
    apiService.analyzeSupplementWithAI(query),
  
  logSupplement: (data: {
    date: string;
    timeOfDay: string;
    supplements: any[];
    notes?: string;
  }) => 
    apiService.logSupplement(data),
  
  getSupplementsForDate: (date: string) => 
    apiService.getSupplementsForDate(date),
  
  deleteSupplementLog: (logId: string) => 
    apiService.deleteSupplementLog(logId),
  
  getSupplementSummary: (days = 30) => 
    apiService.getSupplementSummary(days),
}; 