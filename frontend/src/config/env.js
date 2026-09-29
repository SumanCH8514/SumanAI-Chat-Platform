export const env = {
  WORKER_URL: import.meta.env.VITE_WORKER_URL || (import.meta.env.PROD ? 'https://backend.sumanai.sumanonline.com' : 'http://localhost:8787'),
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
};

export default env;
