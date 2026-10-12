import {
  BookOpen,
  CirclePlus,
  House,
  type LucideIcon,
  MessageCircle,
  PlusCircle,
  Refrigerator,
  Settings,
  Soup,
  Sun,
  Trophy,
} from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

/** PC 사이드바 메뉴 */
export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: '홈', icon: House },
  { path: '/inventory', label: '재료 관리', icon: Refrigerator },
  { path: '/chat', label: 'AI 대화', icon: MessageCircle },
  { path: '/recipes', label: '레시피', icon: BookOpen },
  { path: '/add', label: '재료 추가', icon: PlusCircle },
  { path: '/achievements', label: '관리 성과', icon: Trophy },
  { path: '/settings', label: '설정', icon: Settings },
]

export interface BottomNavItem extends NavItem {
  /** 가운데에 크게 띄우는 주요 버튼 */
  primary?: boolean
}

/** 모바일 하단 바. 나머지 화면은 홈에서 진입한다. */
export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { path: '/', label: '홈', icon: House },
  { path: '/inventory', label: '재료', icon: Refrigerator },
  { path: '/add', label: '추가', icon: CirclePlus, primary: true },
  { path: '/recipes', label: '레시피', icon: Soup },
  { path: '/settings', label: '설정', icon: Sun },
]
