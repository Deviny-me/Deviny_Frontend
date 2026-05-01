'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Award,
  Briefcase,
  ArrowLeft,
  Loader2,
  Phone,
  Globe,
  MessageCircle,
  Users,
  Star,
  Trophy,
  X,
} from 'lucide-react'
import { API_URL, fetchWithAuth, getMediaUrl } from '@/lib/config'
import { localizeCityName, localizeCountryName } from '@/lib/data/countries'
import { useTranslations } from 'next-intl'
import { TrainerProfileResponse } from '@/types/trainerProfile'
import ChatModal from '@/components/chat/ChatModal'
import { useAccentColors, getRoleRingClass, getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { useAuth } from '@/features/auth/AuthContext'
import { useLanguage } from '@/components/language/LanguageProvider'

interface ExpertProfileContentProps {
  basePath: string
}

export function ExpertProfileContent({ basePath }: ExpertProfileContentProps) {
  const params = useParams()
  const router = useRouter()
  const accent = useAccentColors()
  const slug = params.slug as string
  const { language } = useLanguage()
  const t = useTranslations('experts')
  const tc = useTranslations('common')
  const { user: currentUser } = useAuth()

  const [profile, setProfile] = useState<TrainerProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCertificate, setSelectedCertificate] = useState<{ fileUrl: string; title: string } | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetchWithAuth(`${API_URL}/trainers/${slug}/profile`)
        if (!response.ok) {
          if (response.status === 404) throw new Error('Trainer not found')
          throw new Error('Failed to load trainer profile')
        }

        const data = await response.json()
        setProfile(data)
      } catch (err) {
        console.error('Failed to fetch trainer profile:', err)
        setError(err instanceof Error ? err.message : 'Failed to load trainer profile')
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) fetchProfile()
  }, [slug])

  return (
    <>
      <div className="space-y-4 pb-6">
        {/* Back Button */}
        <button
          onClick={() => router.push(`${basePath}/experts`)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('backToExperts')}</span>
        </button>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12 bg-surface-2 rounded-xl border border-border-subtle">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('profileNotAvailable')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => router.push(`${basePath}/experts`)}
              className={`px-6 py-2 bg-gradient-to-r ${accent.gradient} text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity`}
            >
              {t('backToExperts')}
            </button>
          </div>
        )}

        {/* Profile Content */}
        {!isLoading && !error && profile && (() => {
          const expertAccent = getAccentColorsByRole(profile.trainer.role)
          const localizedCountry = localizeCountryName(profile.trainer.country, language)
          const localizedCity = localizeCityName(profile.trainer.city, profile.trainer.country, language)
          return (
            <div className="space-y-4">
              {/* Header Card */}
              <div className="bg-surface-2 rounded-xl border border-border-subtle p-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {profile.trainer.avatarUrl ? (
                      <img
                        src={getMediaUrl(profile.trainer.avatarUrl) || ''}
                        alt={profile.trainer.fullName}
                        className={`w-32 h-32 rounded-xl object-cover ${getRoleRingClass(profile.trainer.role)}`}
                      />
                    ) : (
                      <div className={`w-32 h-32 rounded-xl bg-gradient-to-br ${expertAccent.gradient} flex items-center justify-center`}>
                        <span className="text-white text-4xl font-bold">{profile.trainer.initials}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h1 className="page-title-compact">{profile.trainer.fullName}</h1>
                    {profile.trainer.primaryTitle && (
                      <p className={`${expertAccent.text} mt-2 text-lg`}>{profile.trainer.primaryTitle}</p>
                    )}
                    {profile.trainer.secondaryTitle && (
                      <p className="text-sm text-muted-foreground mt-1">{profile.trainer.secondaryTitle}</p>
                    )}

                    {/* Gender and Phone */}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {profile.trainer.gender && (
                        <p className="text-sm text-muted-foreground">{profile.trainer.gender}</p>
                      )}
                      {profile.trainer.phone && (
                        <a
                          href={`tel:${profile.trainer.phone}`}
                          className={`flex items-center gap-1 text-sm text-muted-foreground ${expertAccent.hoverText} transition-colors`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{profile.trainer.phone}</span>
                        </a>
                      )}
                    </div>

                    {/* Location */}
                    {(profile.trainer.location || profile.trainer.city || profile.trainer.country) && (
                      <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                        <Globe className="w-4 h-4" />
                        <span>
                          {profile.trainer.location ||
                            [localizedCity, localizedCountry].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-6 mt-4 text-sm">
                      {profile.trainer.experienceYears ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="w-4 h-4" />
                          <span>{profile.trainer.experienceYears} {t('yearsExperience')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-faint-foreground">
                          <Briefcase className="w-4 h-4" />
                          <span>{t('noExperience')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Award className="w-4 h-4" />
                        <span>{profile.trainer.programsCount} {profile.trainer.programsCount !== 1 ? t('programs') : t('program')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{profile.trainer.studentsCount} {profile.trainer.studentsCount !== 1 ? t('students') : t('student')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Trophy className="w-4 h-4" />
                        <span>{profile.trainer.achievementsCount} {profile.trainer.achievementsCount !== 1 ? t('achievements') : t('achievement')}</span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-background rounded-lg">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-foreground font-semibold">
                          {profile.trainer.ratingValue > 0 ? profile.trainer.ratingValue.toFixed(1) : '0.0'}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({profile.trainer.reviewsCount} {profile.trainer.reviewsCount !== 1 ? tc('reviews') : t('review')})
                        </span>
                      </div>
                    </div>

                    {/* Contact Buttons */}
                    {profile.trainer.userId !== currentUser?.id && (
                      <div className="flex flex-wrap items-center gap-3 mt-6">
                        <button
                          onClick={() => setIsChatOpen(true)}
                          className={`px-4 py-2 bg-gradient-to-r ${expertAccent.gradient} text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          {t('sendMessage')}
                        </button>
                        {profile.trainer.phone && (
                          <a
                            href={`tel:${profile.trainer.phone}`}
                            className="px-4 py-2 bg-background hover:bg-hover-overlay rounded-lg text-sm text-muted-foreground transition-colors flex items-center gap-2"
                          >
                            <Phone className="w-4 h-4" />
                            {t('call')}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="bg-surface-2 rounded-xl border border-border-subtle p-6">
                <h2 className="text-xl font-semibold text-foreground mb-3">{t('about')}</h2>
                {profile.about?.text ? (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{profile.about.text}</p>
                ) : (
                  <p className="text-sm text-faint-foreground italic">{t('noDescription')}</p>
                )}
              </div>

              {/* Specializations */}
              <div className="bg-surface-2 rounded-xl border border-border-subtle p-6">
                <h2 className="text-xl font-semibold text-foreground mb-3">{t('specializations')}</h2>
                {profile.specializations && profile.specializations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.specializations.map((spec) => (
                      <span
                        key={spec.id}
                        className={`px-3 py-1.5 ${expertAccent.bgMuted} ${expertAccent.text} rounded-lg text-sm font-medium`}
                      >
                        {spec.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-faint-foreground italic">{t('noSpecializations')}</p>
                )}
              </div>

              {/* Certificates */}
              <div className="bg-surface-2 rounded-xl border border-border-subtle p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">{t('certificates')}</h2>
                {profile.certificates && profile.certificates.length > 0 ? (
                  <div className="space-y-3">
                    {profile.certificates.map((cert) => (
                      <div key={cert.id} className="flex items-start gap-3 p-3 bg-background rounded-lg hover:bg-hover-overlay transition-colors">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${expertAccent.gradient} flex items-center justify-center flex-shrink-0`}>
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-foreground">{cert.title}</h3>
                          {cert.issuer && (
                            <p className="text-xs text-muted-foreground mt-0.5">{cert.issuer} • {cert.year}</p>
                          )}
                          {cert.fileUrl && cert.fileName && (
                            <button
                              onClick={() => setSelectedCertificate({ fileUrl: cert.fileUrl!, title: cert.title })}
                              className={`text-xs ${expertAccent.text} hover:underline mt-1 inline-block`}
                            >
                              {t('viewCertificate')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-faint-foreground italic">{t('noCertificates')}</p>
                )}
              </div>

              {/* Achievements */}
              <div className="bg-surface-2 rounded-xl border border-border-subtle p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">{t('achievements')}</h2>
                {profile.achievements && profile.achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profile.achievements.map((achievement) => {
                      const toneColors: Record<string, string> = {
                        gold: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
                        silver: 'bg-gradient-to-br from-gray-300 to-gray-500',
                        bronze: 'bg-gradient-to-br from-orange-400 to-orange-600',
                        blue: 'bg-gradient-to-br from-blue-400 to-blue-600',
                        green: 'bg-gradient-to-br from-green-400 to-green-600',
                        purple: 'bg-gradient-to-br from-purple-400 to-purple-600',
                        red: 'bg-gradient-to-br from-red-400 to-red-600',
                      }
                      const bgColor = toneColors[achievement.tone.toLowerCase()] || `bg-gradient-to-br ${expertAccent.gradient}`

                      return (
                        <div key={achievement.id} className="flex items-start gap-3 p-3 bg-background rounded-lg hover:bg-hover-overlay transition-colors">
                          <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center text-xl flex-shrink-0`}>
                            {achievement.iconKey}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-foreground">{achievement.title}</h3>
                            {achievement.subtitle && (
                              <p className="text-xs text-muted-foreground mt-0.5">{achievement.subtitle}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-faint-foreground italic">{t('noAchievements')}</p>
                )}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Certificate Modal */}
      {selectedCertificate && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedCertificate(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-surface-2 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <h3 className="text-foreground font-semibold">{selectedCertificate.title}</h3>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <img
                src={getMediaUrl(selectedCertificate.fileUrl) || ''}
                alt={selectedCertificate.title}
                className="w-full h-auto rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {isChatOpen && profile && (
        <ChatModal
          otherUserId={profile.trainer.userId}
          otherUserName={profile.trainer.fullName}
          otherUserAvatarUrl={profile.trainer.avatarUrl}
          otherUserRole={profile.trainer.role}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </>
  )
}
