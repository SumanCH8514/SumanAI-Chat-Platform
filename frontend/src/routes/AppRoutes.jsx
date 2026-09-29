import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import ChatPage from '../pages/ChatPage';
import NotFoundPage from '../pages/NotFoundPage';
import MainLayout from '../layouts/MainLayout';
import AppSkeleton from '../components/AppSkeleton';

const ToolsView = lazy(() => import('../pages/ToolsView'));
const BGRemover = lazy(() => import('../pages/BGRemover'));
const TermsOfService = lazy(() => import('../pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const AboutUs = lazy(() => import('../pages/AboutUs'));
const ContactPage = lazy(() => import('../pages/ContactPage'));

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
