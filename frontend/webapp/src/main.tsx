import { createRoot } from 'react-dom/client';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import './globals.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router';
import { queryClient } from './queryClient.ts';
import { QueryClientProvider } from '@tanstack/react-query';
import { colors } from './shared/styling/colors.ts';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <Theme
        accentColor={colors.theme.radix.primary}
        grayColor={colors.theme.radix.gray}
        radius="small"
        scaling="95%"
      >
        <App />
      </Theme>
    </QueryClientProvider>
  </BrowserRouter>
);
