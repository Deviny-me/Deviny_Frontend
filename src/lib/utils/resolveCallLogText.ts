/**
 * Resolves call log message text to the current UI locale.
 *
 * Call log messages can be:
 *   1. New marker strings like "::call:ended::"  (sent after the fix)
 *   2. Legacy translated strings stored in ru/en/az  (sent before the fix)
 *
 * Pass the `t` function from `useTranslations('chat')` and a `callTypeText`
 * helper that maps 'audio' | 'video' to the locale word.
 */
export function resolveCallLogText(
  text: string,
  t: (key: string, values?: Record<string, string>) => string,
  callTypeText: (type: 'audio' | 'video') => string,
): string {
  // ── New marker-based messages ──────────────────────────────────────────
  if (text === '::call:ended::') return t('callLogEnded')
  if (text === '::call:missed_incoming::') return t('callLogMissedIncoming')
  if (text === '::call:incoming_declined::') return t('callLogIncomingDeclined')
  if (text === '::call:started:audio::') return t('callLogStarted', { callType: callTypeText('audio') })
  if (text === '::call:started:video::') return t('callLogStarted', { callType: callTypeText('video') })
  if (text === '::call:joined:audio::') return t('callLogJoined', { callType: callTypeText('audio') })
  if (text === '::call:joined:video::') return t('callLogJoined', { callType: callTypeText('video') })
  if (text === '::call:missed_no_answer:audio::') return t('callLogMissedNoAnswer', { callType: callTypeText('audio') })
  if (text === '::call:missed_no_answer:video::') return t('callLogMissedNoAnswer', { callType: callTypeText('video') })

  // ── Legacy: messages stored as translated strings ──────────────────────
  // callLogEnded
  if (
    text === '📴 Звонок завершен.' ||
    text === '📴 Call ended.' ||
    text === '📴 Zəng bitdi.'
  ) return t('callLogEnded')

  // callLogIncomingDeclined
  if (
    text === '📵 Входящий звонок отклонен.' ||
    text === '📵 Incoming call declined.' ||
    text === '📵 Gələn zəng rədd edildi.'
  ) return t('callLogIncomingDeclined')

  // callLogMissedIncoming
  if (
    text === '📵 Пропущенный входящий звонок.' ||
    text === '📵 Missed incoming call.' ||
    text === '📵 Buraxılmış gələn zəng.'
  ) return t('callLogMissedIncoming')

  // callLogStarted — audio
  if (
    text === '📞 Начат аудио звонок.' ||
    text === '📞 Started a audio call.' ||
    text === '📞 audio zəng başladı.'
  ) return t('callLogStarted', { callType: callTypeText('audio') })

  // callLogStarted — video
  if (
    text === '📞 Начат видео звонок.' ||
    text === '📞 Started a video call.' ||
    text === '📞 video zəng başladı.'
  ) return t('callLogStarted', { callType: callTypeText('video') })

  // callLogJoined — audio
  if (
    text === '📞 Подключение к аудио звонку.' ||
    text === '📞 Joined a audio call.' ||
    text === '📞 audio zəngə qoşuldu.'
  ) return t('callLogJoined', { callType: callTypeText('audio') })

  // callLogJoined — video
  if (
    text === '📞 Подключение к видео звонку.' ||
    text === '📞 Joined a video call.' ||
    text === '📞 video zəngə qoşuldu.'
  ) return t('callLogJoined', { callType: callTypeText('video') })

  // callLogMissedNoAnswer — audio
  if (
    text === '📵 Пропущенный аудио звонок (без ответа).' ||
    text === '📵 Missed audio call (no answer).' ||
    text === '📵 Buraxılmış audio zəng (cavab yoxdur).'
  ) return t('callLogMissedNoAnswer', { callType: callTypeText('audio') })

  // callLogMissedNoAnswer — video
  if (
    text === '📵 Пропущенный видео звонок (без ответа).' ||
    text === '📵 Missed video call (no answer).' ||
    text === '📵 Buraxılmış video zəng (cavab yoxdur).'
  ) return t('callLogMissedNoAnswer', { callType: callTypeText('video') })

  return text
}
