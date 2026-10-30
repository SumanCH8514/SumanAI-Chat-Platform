import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import ChatPage from '../pages/ChatPage';
import NotFoundPage from '../pages/NotFoundPage';
import MainLayout from '../layouts/MainLayout';
import AppSkeleton from '../components/AppSkeleton';

const ToolsView = lazy(() => import('../pages/ToolsView'));
const BGRemover = lazy(() => import('../pages/BGRemover'));
const TextToImage = lazy(() => import('../pages/tools/TextToImage'));
const ImageGenerator = lazy(() => import('../pages/tools/ImageGenerator'));
const FaceEnhancer = lazy(() => import('../pages/tools/FaceEnhancer'));
const TextSummarizer = lazy(() => import('../pages/tools/TextSummarizer'));
const AIWriter = lazy(() => import('../pages/tools/AIWriter'));
const Translator = lazy(() => import('../pages/tools/Translator'));
const CodeAssistant = lazy(() => import('../pages/tools/CodeAssistant'));
const VoiceToText = lazy(() => import('../pages/tools/VoiceToText'));
const VideoStoryboard = lazy(() => import('../pages/tools/VideoStoryboard'));

const TermsOfService = lazy(() => import('../pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const AboutUs = lazy(() => import('../pages/AboutUs'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const AdminRoute = lazy(() => import('./AdminRoute'));
const AdminLayout = lazy(() => import('../pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminModels = lazy(() => import('../pages/admin/AdminModels'));
const AdminQuotas = lazy(() => import('../pages/admin/AdminQuotas'));
const ExplorePage = lazy(() => import('../pages/ExplorePage'));
const LibraryPage = lazy(() => import('../pages/LibraryPage'));
const FilesPage = lazy(() => import('../pages/FilesPage'));
const HistoryPage = lazy(() => import('../pages/HistoryPage'));

export const AppRoutes = ({ onSettingsClick, onLoginClick }) => {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatPage
                onSettingsClick={onSettingsClick}
                onLoginClick={onLoginClick}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <ExplorePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <LibraryPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/files"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <FilesPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <HistoryPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/view"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <ToolsView />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/bg-remover"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <BGRemover />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/text-to-image"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <TextToImage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/image-generator"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <ImageGenerator />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/face-enhancer"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <FaceEnhancer />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/text-summarizer"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <TextSummarizer />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/ai-writer"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <AIWriter />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/translator"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <Translator />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/code-assistant"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <CodeAssistant />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/voice-to-text"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <VoiceToText />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/video-generator"
          element={
            <ProtectedRoute>
              <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
                <VideoStoryboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/terms"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <TermsOfService />
            </MainLayout>
          }
        />
        <Route
          path="/terms-of-service"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <TermsOfService />
            </MainLayout>
          }
        />
        <Route
          path="/pages/Terms Of Service"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <TermsOfService />
            </MainLayout>
          }
        />
        <Route
          path="/pages/terms-of-service"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <TermsOfService />
            </MainLayout>
          }
        />

        <Route
          path="/privacy"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <PrivacyPolicy />
            </MainLayout>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <PrivacyPolicy />
            </MainLayout>
          }
        />
        <Route
          path="/pages/Privacy Policy"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <PrivacyPolicy />
            </MainLayout>
          }
        />
        <Route
          path="/pages/privacy-policy"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <PrivacyPolicy />
            </MainLayout>
          }
        />

        <Route
          path="/about"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <AboutUs />
            </MainLayout>
          }
        />
        <Route
          path="/about-us"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <AboutUs />
            </MainLayout>
          }
        />
        <Route
          path="/pages/about us"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <AboutUs />
            </MainLayout>
          }
        />
        <Route
          path="/pages/about-us"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <AboutUs />
            </MainLayout>
          }
        />
        <Route
          path="/about_project"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <AboutUs />
            </MainLayout>
          }
        />
        <Route
          path="/about-project"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <AboutUs />
            </MainLayout>
          }
        />
        <Route
          path="/pages/about_project"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <AboutUs />
            </MainLayout>
          }
        />
        <Route
          path="/pages/about-project"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <AboutUs />
            </MainLayout>
          }
        />

        <Route
          path="/contact"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <ContactPage />
            </MainLayout>
          }
        />
        <Route
          path="/support"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <ContactPage />
            </MainLayout>
          }
        />
        <Route
          path="/pages/contact"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <ContactPage />
            </MainLayout>
          }
        />
        <Route
          path="/pages/support"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <ContactPage />
            </MainLayout>
          }
        />
        <Route
          path="/pages/Support & Contact"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <ContactPage />
            </MainLayout>
          }
        />
        <Route
          path="/pages/support-and-contact"
          element={
            <MainLayout onSettingsClick={onSettingsClick} onLoginClick={onLoginClick}>
              <ContactPage />
            </MainLayout>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="models" element={<AdminModels />} />
          <Route path="quotas" element={<AdminQuotas />} />
        </Route>

        <Route
          path="/:chatId"
          element={
            <ProtectedRoute>
              <ChatPage
                onSettingsClick={onSettingsClick}
                onLoginClick={onLoginClick}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <NotFoundPage
              onSettingsClick={onSettingsClick}
              onLoginClick={onLoginClick}
            />
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
