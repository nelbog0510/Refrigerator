import type { RouteObject } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AchievementsPage } from '@/pages/AchievementsPage'
import { AddIngredientPage } from '@/pages/AddIngredientPage'
import { ChatPage } from '@/pages/ChatPage'
import { HomePage } from '@/pages/HomePage'
import { InventoryPage } from '@/pages/InventoryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RecipesPage } from '@/pages/RecipesPage'
import { SettingsPage } from '@/pages/SettingsPage'

export const routes: RouteObject[] = [
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
]
