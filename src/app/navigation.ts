import {
  BookOpen,
  House,
  type LucideIcon,
  MessageCircle,
  PlusCircle,
  Refrigerator,
  Settings,
  Trophy,
} from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
  /** 모바일 하단 탭에 노출할지 여부. 나머지는 홈·사이드바에서 진입한다. */
  inBottomNav: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: '홈', icon: House, inBottomNav: true },
  { path: '/inventory', label: '재료 관리', icon: Refrigerator, inBottomNav: true },
  { path: '/chat', label: 'AI 대화', icon: MessageCircle, inBottomNav: true },
  { path: '/recipes', label: '레시피', icon: BookOpen, inBottomNav: true },
  { path: '/add', label: '재료 추가', icon: PlusCircle, inBottomNav: false },
  { path: '/achievements', label: '관리 성과', icon: Trophy, inBottomNav: false },
  { path: '/settings', label: '설정', icon: Settings, inBottomNav: true },
]
