import { API_URL } from '../config/env';

const BASE_URL = `${API_URL}/api`;

const baseHeaders = {
  'Content-Type': 'application/json',
};

// Paprastas helperis su token support
const api = {
  async get(path, token) {
    const headers = {
      ...baseHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      console.log('➡️ GET', `${BASE_URL}${path}`);
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers,
      });
      return res;
    } catch (err) {
      console.error('API GET error', err);
      throw err;
    }
  },

  async post(path, body, token) {
    const headers = {
      ...baseHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      console.log('➡️ POST', `${BASE_URL}${path}`, 'body =', body);
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      return res;
    } catch (err) {
      console.error('API POST error', err);
      throw err;
    }
  },

  async put(path, body, token) {
    const headers = {
      ...baseHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      console.log('➡️ PUT', `${BASE_URL}${path}`, 'body =', body);
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      return res;
    } catch (err) {
      console.error('API PUT error', err);
      throw err;
    }
  },

  async del(path, token) {
    const headers = {
      ...baseHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      console.log('➡️ DELETE', `${BASE_URL}${path}`);
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'DELETE',
        headers,
      });
      return res;
    } catch (err) {
      console.error('API DEL error', err);
      throw err;
    }
  },
};

export default api;

export { BASE_URL };
