import { Outlet, type RouteObject } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { AchievementsPage } from '@/pages/AchievementsPage'
import { AddIngredientPage } from '@/pages/AddIngredientPage'
import { ChatPage } from '@/pages/ChatPage'
import { HomePage } from '@/pages/HomePage'
import { InventoryPage } from '@/pages/InventoryPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RecipesPage } from '@/pages/RecipesPage'
import { SettingsPage } from '@/pages/SettingsPage'

export const routes: RouteObject[] = [
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            path: '/',
            element: <AppLayout />,
            children: [
              { index: true, element: <HomePage /> },
              { path: 'inventory', element: <InventoryPage /> },
              { path: 'chat', element: <ChatPage /> },
              { path: 'recipes', element: <RecipesPage /> },
              { path: 'add', element: <AddIngredientPage /> },
              { path: 'achievements', element: <AchievementsPage /> },
              { path: 'settings', element: <SettingsPage /> },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]
