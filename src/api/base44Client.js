import { createClient } from '@base44/sdk';

// Initialize Base44 client
// Check if environment variables are set, otherwise use mock mode
const appId = import.meta.env.VITE_BASE44_APP_ID;
const serverUrl = import.meta.env.VITE_BASE44_SERVER_URL || 'https://base44.app';
const token = import.meta.env.VITE_BASE44_TOKEN;

let base44Client;

if (appId) {
  // Production mode: Use real Base44 client
  console.log('✅ Base44 SDK initialized');
  console.log('   App ID:', appId);
  console.log('   Server:', serverUrl);
  console.log('   Auth:', token ? 'Token provided' : 'No token (public access)');
  
  base44Client = createClient({
    appId,
    serverUrl,
    token,
    autoInitAuth: true
  });
  
  // Log available entities after a short delay
  setTimeout(() => {
    if (base44Client.entities) {
      const entityNames = Object.keys(base44Client.entities);
      console.log('📦 Available Base44 entities:', entityNames);
      if (entityNames.length === 0) {
        console.warn('⚠️ No entities found! Create entities in Base44 dashboard:');
        console.warn('   https://istanbul-coastline-atlas-4b27e368.base44.app');
      }
    } else {
      console.warn('⚠️ base44.entities is undefined');
    }
  }, 1000);
} else {
  // Development mode: Use mock client
  console.warn('⚠️ Base44 App ID not found. Using mock mode.');
  console.warn('');
  console.warn('📋 To enable real Base44 storage:');
  console.warn('   1. Go to https://base44.app');
  console.warn('   2. Create or select your app');
  console.warn('   3. Copy your App ID from the dashboard');
  console.warn('   4. Create .env file: cp .env.example .env');
  console.warn('   5. Add: VITE_BASE44_APP_ID=your_app_id');
  console.warn('   6. Restart dev server: npm run dev');
  console.warn('');
  
  base44Client = {
    // Mock client for development
    entities: new Proxy({}, {
      get: () => ({
        list: () => Promise.resolve([]),
        filter: () => Promise.resolve([]),
        get: () => Promise.resolve(null),
        create: (data) => Promise.resolve({ _id: Date.now().toString(), ...data }),
        update: (id, data) => Promise.resolve({ _id: id, ...data }),
        delete: () => Promise.resolve({ success: true })
      })
    }),
    auth: {
      isAuthenticated: () => Promise.resolve(false),
      me: () => Promise.resolve(null),
      login: () => console.warn('Auth not available in mock mode'),
      logout: () => console.warn('Auth not available in mock mode')
    },
    isConnected: () => false
  };
}

export const base44 = base44Client;

// Export helper to check if Base44 is properly configured
export const isBase44Connected = () => {
  return !!appId;
};
