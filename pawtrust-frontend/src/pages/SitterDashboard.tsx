import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SitterProfileForm } from '@/components/sitters/SitterProfileForm'
import { getMySitterProfile, getContactSubmissions } from '@/api/sitter.api'

function MessagesTab() {
  const { t } = useTranslation()
  const { data } = useQuery({
    queryKey: ['sitterContactSubmissions'],
    queryFn: () => getContactSubmissions().then((r) => r.data.data),
    retry: false,
  })

  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-sm">{t('sitter.no_messages', 'No messages yet.')}</p>
  }

  return (
    <div className="space-y-3">
      {data.map((submission) => (
        <div key={submission.id} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-gray-900">{submission.sender_name}</span>
            <span className="text-xs text-gray-400">
              {new Date(submission.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-700">{submission.message}</p>
        </div>
      ))}
    </div>
  )
}

export default function SitterDashboard() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'profile' | 'messages'>('profile')

  const { data: profile } = useQuery({
    queryKey: ['mySitterProfile'],
    queryFn: () => getMySitterProfile().then((r) => r.data.data),
    retry: false,
  })

  const isIncomplete = profile != null && !profile.is_complete

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t('sitter.dashboard.title', 'Sitter Dashboard')}
        </h1>

        {isIncomplete && (
          <div className="mb-4 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-3 py-2">
            {t(
              'sitter.incomplete_banner',
              'Your profile is incomplete. Complete it to appear in search results.'
            )}
          </div>
        )}

        <div className="flex gap-2 border-b border-gray-200 mb-4">
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              tab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            {t('sitter.dashboard_profile_tab', 'My Profile')}
          </button>
          <button
            type="button"
            onClick={() => setTab('messages')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              tab === 'messages'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            {t('sitter.dashboard_messages_tab', 'Messages')}
          </button>
        </div>

        {tab === 'profile' ? <SitterProfileForm /> : <MessagesTab />}
      </div>
    </DashboardLayout>
  )
}
