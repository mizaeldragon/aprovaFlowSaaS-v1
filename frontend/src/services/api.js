import axios from 'axios';

const rawBaseURL = String(import.meta.env.VITE_API_URL || 'http://localhost:3000/api').trim();
const sanitizedBaseURL = rawBaseURL.replace(/\/+$/, '');
const baseURL = /\/api$/i.test(sanitizedBaseURL) ? sanitizedBaseURL : `${sanitizedBaseURL}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true, // envia cookie httpOnly automaticamente em todas as requisições
});

export default api;
