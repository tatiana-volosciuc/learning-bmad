import { useTranslation } from 'react-i18next'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('auth.forgot_password_coming_soon', 'Password reset coming soon')}
        </h1>
      </div>
    </div>
  )
}
