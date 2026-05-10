import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PlatformProvider } from '@/context/platform';
import { ServerProvider } from '@/context/server';
import { QueryProvider } from '@/context/query';
import { SDKProvider } from '@/context/sdk';
import { GlobalSyncProvider } from '@/context/global-sync';
import { NotificationProvider } from '@/context/notification';
import { SettingsProvider } from '@/context/settings';
import { LayoutProvider } from '@/context/layout';
import { I18nProvider } from '@/context/language';
import { CommandProvider } from '@/context/command';
import { ThemeProvider } from '@/context/theme';
import { TerminalProvider } from '@/context/terminal';
import { SyncProvider } from '@/context/sync';
import { PromptProvider } from '@/context/prompt';
import { HomePage } from '@/pages/home';
import { LayoutPage } from '@/pages/layout';
import { SessionPage } from '@/pages/session';
import { NotFoundPage } from '@/pages/not-found';

import '@/i18n/en';
import '@/i18n/zh';

export function App() {
  return (
    <PlatformProvider>
      <ThemeProvider>
        <ServerProvider>
          <QueryProvider>
            <SDKProvider>
              <GlobalSyncProvider>
                <NotificationProvider>
                  <SettingsProvider>
                    <LayoutProvider>
                      <I18nProvider>
                        <CommandProvider>
                          <TerminalProvider>
                            <SyncProvider>
                              <PromptProvider>
                                <BrowserRouter>
                                  <Routes>
                                    <Route path="/" element={<HomePage />} />
                                    <Route path="/:dir" element={<LayoutPage />}>
                                      <Route index element={<Navigate to="session" replace />} />
                                      <Route path="session" element={<SessionPage />} />
                                      <Route path="session/:id" element={<SessionPage />} />
                                    </Route>
                                    <Route path="*" element={<NotFoundPage />} />
                                  </Routes>
                                </BrowserRouter>
                              </PromptProvider>
                            </SyncProvider>
                          </TerminalProvider>
                        </CommandProvider>
                      </I18nProvider>
                    </LayoutProvider>
                  </SettingsProvider>
                </NotificationProvider>
              </GlobalSyncProvider>
            </SDKProvider>
          </QueryProvider>
        </ServerProvider>
      </ThemeProvider>
    </PlatformProvider>
  );
}
