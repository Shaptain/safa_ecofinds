// api.js - Centralized API utility for EcoFINDS frontend

const API_BASE = 'http://localhost:8000';

const api = {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'API request failed');
      }

      return response.json();
    } catch (err) {
      console.error('API error:', err);
      throw err;
    }
  },

  // Auth APIs
  login: (email, password) =>
    api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData) =>
    api.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // Items APIs
  getItems: (category, search) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return api.request(`/items?${params.toString()}`);
  },

  getItem: (id) => api.request(`/items/${id}`),

  createItem: (itemData) =>
    api.request('/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),

  // Cart APIs
  getCart: () => api.request('/cart'),

  addToCart: (itemId, quantity = 1) =>
    api.request('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, quantity }),
    }),

  removeFromCart: (cartItemId) =>
    api.request(`/cart/${cartItemId}`, { method: 'DELETE' }),

  checkoutCart: () =>
    api.request('/cart/checkout', { method: 'POST' }),

  // Eco Store APIs
  getEcoStore: () => api.request('/eco-store'),

  purchaseEcoItem: (itemId) =>
    api.request(`/eco-store/${itemId}/purchase`, { method: 'POST' }),

  // User APIs
  getUserInfo: () => api.request('/users/me'),

  getTransactions: () => api.request('/transactions'),

  // Messages APIs
  getMessages: (itemId) => api.request(`/messages/${itemId}`),

  sendMessage: (messageData) =>
    api.request('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    }),
};

export default api;
