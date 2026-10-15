// ═══════════════════════════════════════════════════════════════════════════════
// RAKT-CONNECT API CLIENT
// Configurable base URL (defaults to Gateway on port 3001) + Bearer Token Handling
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UserSession {
  id: string;
  name: string;
  role: string;
  did?: string;
  hospitalId?: string;
  expiresAt?: number;
}

type AuthListener = (session: UserSession | null) => void;

class ApiClient {
  private token: string | null = null;
  private user: UserSession | null = null;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedToken = localStorage.getItem('rakt_auth_token');
        const savedUser = localStorage.getItem('rakt_auth_user');
        if (savedToken) {
          this.token = savedToken;
        }
        if (savedUser) {
          this.user = JSON.parse(savedUser);
        }
      } catch (_) {
        // LocalStorage might be disabled or restricted
      }
    }
  }

  public getBaseUrl(): string {
    return API_BASE_URL;
  }

  public getToken(): string | null {
    return this.token;
  }

  public getUser(): UserSession | null {
    return this.user;
  }

  public setSession(token: string, user: UserSession) {
    this.token = token;
    this.user = user;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rakt_auth_token', token);
        localStorage.setItem('rakt_auth_user', JSON.stringify(user));
      } catch (_) {}
    }
    this.notifyListeners();
  }

  public clearSession() {
    this.token = null;
    this.user = null;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('rakt_auth_token');
        localStorage.removeItem('rakt_auth_user');
      } catch (_) {}
    }
    this.notifyListeners();
  }

  public onAuthChange(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.user);
    }
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Attach Bearer token if session exists and caller didn't supply an Authorization header
    if (this.token && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        // Expired or unauthorized session
        const errJson = await response.json().catch(() => null);
        console.warn(`[Auth 401] Endpoint ${endpoint} returned Unauthorized:`, errJson?.error || errJson?.message);
        throw new Error(errJson?.error || errJson?.message || 'Unauthorized: Session invalid or expired');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.error || errorData?.message || `HTTP Error ${response.status}`;
        throw new Error(errorMsg);
      }

      return response.json();
    } catch (error: any) {
      console.error(`[API Error] ${endpoint}:`, error.message);
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  // ── Authentication Helpers ───────────────────────────────────────────────────

  async login(role: string, adminKey?: string, abhaId?: string, name?: string): Promise<{ token: string; user: UserSession }> {
    const data = await this.post<any>('/auth/login', {
      role,
      adminKey: adminKey || process.env.NEXT_PUBLIC_DEFAULT_ADMIN_KEY || 'rakt_admin_dev_secret_key_2026',
      abhaId,
      name
    });

    const user: UserSession = {
      id: data.user?.id || 'staff-admin',
      name: data.user?.name || (role.replace(/_/g, ' ')),
      role: data.role,
      did: data.user?.did,
      hospitalId: data.user?.hospitalId || 'HFR-KA-0421'
    };

    this.setSession(data.token, user);
    return { token: data.token, user };
  }

  async logout(): Promise<void> {
    this.clearSession();
  }

  // ── Inventory & Units ────────────────────────────────────────────────────────

  async getInventory(hospitalId: string = 'HFR-KA-0421'): Promise<any> {
    return this.get<any>(`/inventory/${hospitalId}`);
  }

  async getExpiryAlerts(): Promise<any> {
    return this.get<any>('/inventory/expiry-alerts');
  }

  async collectUnit(payload: {
    donorDid: string;
    bloodGroup: string;
    component: string;
    volumeMl: number;
    hospitalHfr?: string;
    unitId?: string;
  }): Promise<any> {
    return this.post<any>('/unit/collect', payload);
  }

  async verifyUnit(unitId: string): Promise<any> {
    return this.get<any>(`/unit/${unitId}/verify`);
  }

  // ── Donors ───────────────────────────────────────────────────────────────────

  async getDonors(): Promise<{ donors: any[]; total: number }> {
    return this.get<{ donors: any[]; total: number }>('/donors');
  }

  async registerDonor(payload: {
    name: string;
    bloodGroup: string;
    abhaId: string;
    aadhaarHash?: string;
    consentGiven: boolean;
  }): Promise<any> {
    return this.post<any>('/donor/register', payload);
  }

  // ── Emergency Broadcast ──────────────────────────────────────────────────────

  async launchEmergencyBroadcast(payload: {
    bloodGroup: string;
    radiusKm: number;
    severityLevel?: string;
    targetAccepts?: number;
    hospitalHfr?: string;
  }): Promise<any> {
    return this.post<any>('/broadcast/emergency', payload);
  }

  async getActiveBroadcasts(all: boolean = false): Promise<{ activeBroadcasts: any[]; count: number }> {
    return this.get<{ activeBroadcasts: any[]; count: number }>(`/broadcast/active${all ? '?all=true' : ''}`);
  }

  async stopEmergencyBroadcast(broadcastId: string): Promise<any> {
    return this.post<any>(`/broadcast/${broadcastId}/stop`);
  }

  // ── Disaster Mode ────────────────────────────────────────────────────────────

  async getDisasterStatus(): Promise<any> {
    return this.get<any>('/disaster/status');
  }

  async requestDisaster(payload: {
    eventType: string;
    severity: string;
    title: string;
    description: string;
    affectedRegion: string;
    radiusKm: number;
  }): Promise<any> {
    return this.post<any>('/disaster/request', payload);
  }

  async approveDisaster(eventId: string, payload: {
    authorityId: string;
    authorityRole: string;
    dscFingerprint: string;
    mfaVerified: boolean;
  }): Promise<any> {
    return this.post<any>(`/disaster/${eventId}/approve`, payload);
  }

  // ── System & Audit ───────────────────────────────────────────────────────────

  async getFabricStatus(): Promise<any> {
    return this.get<any>('/fabric/status');
  }

  async getAuditLogs(limit: number = 20): Promise<any> {
    return this.get<any>(`/audit/log?limit=${limit}`);
  }

  async getAiDemandForecast(hospitalId: string = 'HFR-KA-0421', bloodGroup: string = 'O-'): Promise<any> {
    return this.get<any>(`/ai/predict/${hospitalId}?bloodGroup=${bloodGroup}&allowSimulation=true`);
  }
}

export const api = new ApiClient();
