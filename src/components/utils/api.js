import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.mercadopago.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
