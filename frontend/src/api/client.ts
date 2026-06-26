const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error((await res.json()).detail || res.statusText);
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    req<{ token: string; name: string; role: string }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    req<{ token: string; name: string }>('/api/auth/register', {
      method: 'POST', body: JSON.stringify({ name, email, password }),
    }),
  me: () => req<{ email: string; name: string; role: string }>('/api/auth/me'),
  getDashboardStats: () => req<Record<string, unknown>>('/api/auth/dashboard'),

  predict: (profile: Record<string, unknown>) =>
    req<Record<string, unknown>>('/api/predict/career', {
      method: 'POST', body: JSON.stringify(profile),
    }),

  getMarketTrends: () => req<Record<string, unknown>>('/api/market/trends'),
  getSalaries: () => req<Record<string, unknown>>('/api/market/salaries'),
  getJobs: (career?: string) => req<Record<string, unknown>>(`/api/market/jobs${career ? `?career=${career}` : ''}`),

  getQuestions: (skill: string) => req<Record<string, unknown>>(`/api/assessment/questions/${skill}`),
  evaluate: (skill: string, answers: number[]) =>
    req<Record<string, unknown>>('/api/assessment/evaluate', {
      method: 'POST', body: JSON.stringify({ skill, answers }),
    }),
  availableSkills: () => req<Record<string, unknown>>('/api/assessment/available'),

  parseResume: async (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/resume/parse`, {
      method: 'POST', body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error((await res.json()).detail || res.statusText);
    return res.json();
  },

  enhanceResume: (payload: Record<string, unknown>) =>
    req<Record<string, unknown>>('/api/resume/enhance', {
      method: 'POST', body: JSON.stringify(payload),
    }),

  applySuggestions: (currentSkills: string[], suggestions: string[]) =>
    req<Record<string, unknown>>('/api/resume/apply-suggestions', {
      method: 'POST',
      body: JSON.stringify({ current_skills: currentSkills, suggestions }),
    }),
};
