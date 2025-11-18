import React from 'react'

type IconProps = {
  className?: string
  size?: number
  strokeWidth?: number
}

const iconProps = ({ size = 20, className, strokeWidth = 1.75 }: IconProps) => ({
  width: size,
  height: size,
  className,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const SparklesIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M7 3l.7 3.3L11 7l-3.3.7L7 11l-.7-3.3L3 7l3.3-.7L7 3z" />
    <path d="M17 5l.5 2L20 8l-2.5.5L17 11l-.5-2.5L14 8l2.5-.5L17 5z" />
    <path d="M15 13l.6 2.4L18 16l-2.4.6L15 19l-.6-2.4L12 16l2.4-.6L15 13z" />
  </svg>
)

export const SoundIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path
      d="M4.5 10v4a1 1 0 0 0 1 1H8l3 2.5a.75.75 0 0 0 1.21-.59V7.09A.75.75 0 0 0 11 6.5L8 9H5.5a1 1 0 0 0-1 1z"
      fill="currentColor"
      stroke="none"
    />
    <path d="M16 9.5a3 3 0 0 1 0 5" />
    <path d="M18 8a5 5 0 0 1 0 8" />
  </svg>
)

export const MicIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <rect x="9" y="4" width="6" height="12" rx="3" />
    <path d="M7 11v1a5 5 0 0 0 10 0v-1" />
    <path d="M12 19v2" />
  </svg>
)

export const NewspaperIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <rect x="4" y="5" width="15" height="14" rx="2" />
    <path d="M7 8.5h6.5" />
    <path d="M7 12h9" />
    <path d="M7 15.5h9" />
    <path d="M17.5 5v12.5a1.5 1.5 0 0 0 1.5 1.5h0" />
  </svg>
)

export const ImageIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="M9 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    <path d="M4 16l3.5-3 4 3.5 3-2 5.5 4" />
  </svg>
)

export const ChatBubbleIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M5 7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H11l-3.5 3V12H8" />
  </svg>
)

export const KeyIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <circle cx="14" cy="10" r="3" />
    <path d="M11 10H4v3h2l1.5-1.5L9 13l1-1" />
  </svg>
)

export const DownloadIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M12 4v10" />
    <path d="M8.5 10.5 12 14l3.5-3.5" />
    <path d="M5 19h14" />
  </svg>
)

export const RefreshIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M4 12a8 8 0 0 1 13.7-5.7L20 9" />
    <path d="M20 12a8 8 0 0 1-13.7 5.7L4 15" />
  </svg>
)

export const TrashIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M7 7h10" />
    <path d="M9 7V5h6v2" />
    <rect x="8" y="9" width="8" height="10" rx="1.5" />
  </svg>
)

export const EyeIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
)

export const EyeOffIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M3 3l18 18" />
    <path d="M9.88 9.88A2.5 2.5 0 0 1 14.12 14.1" />
    <path d="M7.4 7.7C4.9 9 3 12 3 12s3.5 6 9 6c1.2 0 2.3-.2 3.27-.55" />
    <path d="M16.6 12.4a2.5 2.5 0 0 0-3-3" />
    <path d="M17 9c2 .9 4 3 4 3a12.2 12.2 0 0 1-1.47 2.09" />
  </svg>
)

export const AlertIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M12 4 3.5 18a1 1 0 0 0 .86 1.5h15.28a1 1 0 0 0 .86-1.5L12 4z" />
    <path d="M12 10v3.5" />
    <circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none" />
  </svg>
)

export const CheckIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="M5 12.5 10 17l9-10" />
  </svg>
)

export const CalendarIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <rect x="4" y="6" width="16" height="14" rx="2" />
    <path d="M9 4v4" />
    <path d="M15 4v4" />
    <path d="M4 11h16" />
  </svg>
)

export const IdIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <rect x="4" y="6" width="16" height="12" rx="2" />
    <circle cx="9" cy="12" r="2" />
    <path d="M13 11h4" />
    <path d="M13 14h3" />
  </svg>
)

export const SendIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <path d="m4 12 16-7-4.5 7L20 19 4 12z" />
    <path d="M15.5 5 9 12" />
  </svg>
)

export const UserIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <circle cx="12" cy="9" r="3" />
    <path d="M5 19a7 7 0 0 1 14 0" />
  </svg>
)

export const RobotIcon = (props: IconProps) => (
  <svg {...iconProps(props)}>
    <rect x="4" y="7" width="16" height="10" rx="2" />
    <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    <circle cx="9" cy="12" r="1.2" />
    <circle cx="15" cy="12" r="1.2" />
    <path d="M10 16h4" />
  </svg>
)
