export const env = {
  WORKER_URL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WORKER_URL) || ((typeof import.meta !== 'undefined' && import.meta.env?.PROD) ? 'https://backend.sumanai.sumanonline.com' : 'http://localhost:8787'),
  IS_DEV: typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV),
  IS_PROD: typeof import.meta !== 'undefined' && Boolean(import.meta.env?.PROD),
  MODE: (typeof import.meta !== 'undefined' && import.meta.env?.MODE) || 'development',
};

export default env;
