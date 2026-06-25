import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ameen.mobile.app',
  appName: 'الأمين لجوالات',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
