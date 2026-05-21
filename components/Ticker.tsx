'use client'

import { useEffect, useState } from 'react'
import type { BannerRow } from '@/lib/types'

// DB(soc_banners) 미적용 시 폴백 텍스트
const FALLBACK = [
  '📢 2024년 5월 22일 (수) 전체 서버 통합 업그레이드 프로그램 시작',
  '📋 보안 강화를 위한 새로운 네트워크 보안 프로토콜 적용',
  '⚠️ 서버실 출입 시 각 층 증명에 대한 업데이트 지침 안내',
  '🔧 정기 점검: 매월 마지막 주 금요일 23:00 ~ 익일 02:00',
  '📌 IP 신청 처리 기간: 영업일 기준 2~3일 소요',
]

interface Props {
  onMenuClick?: () => void
  isAdmin?: boolean
  onAdminToggle?: () => void
}

export default function Ticker({ onMenuClick, isAdmin, onAdminToggle }: Props) {
  const [texts, setTexts] = useState<string[]>(FALLBACK)

  useEffect(() => {
    fetch('/api/banners?active=1')
      .then(r => r.json())
      .then(j => {
        if (j.success && Array.isArray(j.data) && j.data.length > 0) {
          setTexts((j.data as BannerRow[]).map(b => b.text))
        }
      })
      .catch(() => { /* 폴백 유지 */ })
  }, [])

  const text = texts.join('   |   ')

  return (
    <div
      className="w-full flex items-center overflow-hidden flex-shrink-0 h-12 md:h-9"
      style={{ background: 'linear-gradient(90deg, #000d2f, #00205b)' }}
    >
      {/* 모바일 햄버거 버튼 */}
      {onMenuClick && (
        <button
          className="md:hidden flex-shrink-0 pl-3 pr-2 text-white/80 hover:text-white"
          onClick={onMenuClick}
          aria-label="메뉴 열기"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <line x1="3" y1="6"  x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* 공지 라벨 */}
      <div
        className="flex-shrink-0 mx-2 px-2.5 py-0.5 rounded text-xs font-display font-bold text-primary tracking-widest uppercase z-10"
        style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)' }}
      >
        공지
      </div>

      {/* 스크롤 텍스트 */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <span className="ticker-animate text-white/90 text-sm md:text-xs">
          &nbsp;&nbsp;&nbsp;&nbsp;{text}&nbsp;&nbsp;&nbsp;&nbsp;{text}
        </span>
      </div>

      {/* 관리자 토글 버튼 */}
      {onAdminToggle && (
        <button
          className={[
            'flex-shrink-0 pr-3 pl-2 flex items-center gap-1.5',
            'text-xs font-bold tracking-wide transition-colors',
            isAdmin ? 'text-amber-400' : 'text-white/35 hover:text-white/60',
          ].join(' ')}
          onClick={onAdminToggle}
          aria-label="관리자 모드 전환"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {isAdmin
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            }
          </svg>
          <span className="hidden sm:inline">{isAdmin ? '관리자' : '일반'}</span>
        </button>
      )}
    </div>
  )
}
