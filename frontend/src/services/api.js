import axios from 'axios';

// Em produção (na Vercel por exemplo), isso virá de uma variável de ambiente (VITE_API_URL)
// Mas para testarmos nosso SaaS localmente, ele vai bater no nosso Server Node!
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export default api;
