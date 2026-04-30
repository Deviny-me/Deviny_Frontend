'use client'

import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { buildUrl } from '@/lib/config'

import ruMessages from '../../../messages/ru.json'
import enMessages from '../../../messages/en.json'
import azMessages from '../../../messages/az.json'

export type Language = 'ru' | 'en' | 'az'

const LANGUAGE_STORAGE_KEY = 'deviny.language'
const LANGUAGE_SYNC_PENDING_KEY = 'deviny.language.pending-sync'

const messagesMap: Record<Language, typeof ruMessages> = {
  ru: ruMessages,
  en: enMessages,
  az: azMessages,
}

function isLanguage(value: unknown): value is Language {
  return value === 'ru' || value === 'en' || value === 'az'
}

function readStoredLanguage(key: string): Language | null {
  if (typeof window === 'undefined') return null

  try {
    const value = localStorage.getItem(key)
    return isLanguage(value) ? value : null
  } catch {
    return null
  }
}

function writeStoredLanguage(key: string, language: Language | null) {
  if (typeof window === 'undefined') return

  try {
    if (language) {
      localStorage.setItem(key, language)
    } else {
      localStorage.removeItem(key)
    }
  } catch {
    // Ignore storage failures and keep in-memory language state.
  }
}

function getAccessToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
}

async function persistLanguagePreference(token: string, language: Language) {
  await fetch(buildUrl('/me/settings/language'), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
    body: JSON.stringify({ language })
  })
}

export function getLanguageLabel(lang: Language): string {
  switch (lang) {
    case 'ru': return 'Русский'
    case 'en': return 'English'
    case 'az': return 'Azərbaycan'
  }
}

export function getLanguageFlag(lang: Language): string {
  switch (lang) {
    case 'ru': return '🇷🇺'
    case 'en': return '🇬🇧'
    case 'az': return '🇦🇿'
  }
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => Promise<void>
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
  initialLanguage?: Language
}

export function LanguageProvider({ children, initialLanguage = 'ru' }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(initialLanguage)
  const [isLoading, setIsLoading] = useState(false)

  // Apply stored preference after hydration to avoid SSR/client text mismatches.
  useEffect(() => {
    const storedLanguage = readStoredLanguage(LANGUAGE_STORAGE_KEY)
    if (storedLanguage && storedLanguage !== language) {
      setLanguageState(storedLanguage)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync with API on mount
  useEffect(() => {
    const syncLanguage = async () => {
      try {
        const token = getAccessToken()
        if (!token) return

        const storedLanguage = readStoredLanguage(LANGUAGE_STORAGE_KEY)
        const pendingLanguage = readStoredLanguage(LANGUAGE_SYNC_PENDING_KEY)

        const response = await fetch(buildUrl('/me/settings'), {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          const apiLanguage = isLanguage(data.language) ? data.language : initialLanguage
          const preferredLanguage = pendingLanguage ?? storedLanguage

          if (preferredLanguage) {
            setLanguageState(preferredLanguage)
            writeStoredLanguage(LANGUAGE_STORAGE_KEY, preferredLanguage)

            if (preferredLanguage !== apiLanguage) {
              try {
                await persistLanguagePreference(token, preferredLanguage)
              } catch (error) {
                console.error('Failed to sync stored language:', error)
                writeStoredLanguage(LANGUAGE_SYNC_PENDING_KEY, preferredLanguage)
                return
              }
            }

            writeStoredLanguage(LANGUAGE_SYNC_PENDING_KEY, null)
            return
          }

          if (apiLanguage !== language) {
            setLanguageState(apiLanguage)
          }

          writeStoredLanguage(LANGUAGE_STORAGE_KEY, apiLanguage)
          writeStoredLanguage(LANGUAGE_SYNC_PENDING_KEY, null)
        }
      } catch (error) {
        console.error('Failed to sync language:', error)
      }
    }

    syncLanguage()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep browser-level language metadata aligned with in-app language selection.
  useEffect(() => {
    if (typeof document === 'undefined') return

    document.documentElement.lang = language

    const localizedTitle = messagesMap[language]?.metadata?.title
    if (localizedTitle) {
      document.title = localizedTitle
    }

    const localizedDescription = messagesMap[language]?.metadata?.description
    if (localizedDescription) {
      let descriptionTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
      if (!descriptionTag) {
        descriptionTag = document.createElement('meta')
        descriptionTag.name = 'description'
        document.head.appendChild(descriptionTag)
      }
      descriptionTag.content = localizedDescription
    }
  }, [language])

  const setLanguage = useCallback(async (newLanguage: Language) => {
    setIsLoading(true)
    setLanguageState(newLanguage)
    writeStoredLanguage(LANGUAGE_STORAGE_KEY, newLanguage)

    try {
      const token = getAccessToken()
      if (!token) {
        writeStoredLanguage(LANGUAGE_SYNC_PENDING_KEY, newLanguage)
        return
      }

      await persistLanguagePreference(token, newLanguage)
      writeStoredLanguage(LANGUAGE_SYNC_PENDING_KEY, null)
    } catch (error) {
      console.error('Failed to save language:', error)
      writeStoredLanguage(LANGUAGE_SYNC_PENDING_KEY, newLanguage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const contextValue = useMemo(() => ({ language, setLanguage, isLoading }), [language, setLanguage, isLoading])

  const messages = messagesMap[language]

  return (
    <LanguageContext.Provider value={contextValue}>
      <NextIntlClientProvider locale={language} messages={messages} timeZone="Asia/Baku">
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
