import {
  BookOpenIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  ArrowPathIcon,
  PlusIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ChatBubbleBottomCenterTextIcon,
  DocumentTextIcon,
  FlagIcon,
  CheckCircleIcon,
  CheckIcon,
  BookmarkIcon as HeroBookmarkIcon,
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  ClockIcon,
  TagIcon,
} from "@heroicons/react/24/outline"

import { TrophyIcon as HeroTrophyIcon, MapPinIcon } from "@heroicons/react/24/solid"

export { BookOpenIcon }
export { PlusIcon }
export { ArrowLeftIcon }
export { TrashIcon }
export { UsersIcon }
export { FlagIcon }
export { CheckCircleIcon }
export { CheckIcon }
export { ArrowPathIcon }

export const TrophyIcon = HeroTrophyIcon

export function LockIcon({ className }: { className?: string }) {
  return <LockClosedIcon className={className} />
}

// Export LockIconComponent as an alias export for backward compatibility
export const LockIconComponent = LockIcon

export function MessageCircleIcon({ className }: { className?: string }) {
  return <ChatBubbleLeftIcon className={className} />
}

export function AlertTriangleIcon({ className }: { className?: string }) {
  return <ExclamationTriangleIcon className={className} />
}

export function AlertIcon({ className }: { className?: string }) {
  return <ExclamationTriangleIcon className={className} />
}

export function UploadIcon({ className }: { className?: string }) {
  return <CloudArrowUpIcon className={className} />
}

export function XIcon({ className }: { className?: string }) {
  return <XMarkIcon className={className} />
}

export function LoaderIcon({ className }: { className?: string }) {
  return <ArrowPathIcon className={className} />
}

export function SendIcon({ className }: { className?: string }) {
  return <PaperAirplaneIcon className={className} />
}

export function LogOutIcon({ className }: { className?: string }) {
  return <ArrowRightOnRectangleIcon className={className} />
}

export function ShieldIcon({ className }: { className?: string }) {
  return <ShieldCheckIcon className={className} />
}

export function SettingsIcon({ className }: { className?: string }) {
  return <Cog6ToothIcon className={className} />
}

export function GridIcon({ className }: { className?: string }) {
  return <Squares2X2Icon className={className} />
}

export function TrendingUpIcon({ className }: { className?: string }) {
  return <ArrowTrendingUpIcon className={className} />
}

export function MessageSquareIcon({ className }: { className?: string }) {
  return <ChatBubbleBottomCenterTextIcon className={className} />
}

export function MessageIcon({ className }: { className?: string }) {
  return <ChatBubbleBottomCenterTextIcon className={className} />
}

export function FileTextIcon({ className }: { className?: string }) {
  return <DocumentTextIcon className={className} />
}

export function FileIcon({ className }: { className?: string }) {
  return <DocumentTextIcon className={className} />
}

export function BookmarkIcon({ className }: { className?: string }) {
  return <HeroBookmarkIcon className={className} />
}

export function QuoteIcon({ className }: { className?: string }) {
  return <ChatBubbleLeftRightIcon className={className} />
}

export function PinIcon({ className }: { className?: string }) {
  return <MapPinIcon className={className} />
}

export function CrownIcon({ className }: { className?: string }) {
  return <HeroTrophyIcon className={className} />
}

export function HistoryIcon({ className }: { className?: string }) {
  return <ClockIcon className={className} />
}

export function TagIconComponent({ className }: { className?: string }) {
  return <TagIcon className={className} />
}
