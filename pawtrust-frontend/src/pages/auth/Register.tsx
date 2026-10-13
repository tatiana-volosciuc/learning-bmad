import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useRegister } from '@/hooks/useRegister'
import type { RegisterPayload } from '@/api/auth.api'
import { useTranslation } from 'react-i18next'

const ROLES = [
  { value: 'buyer', labelKey: 'auth.roles.buyer', icon: '🐾', descKey: 'auth.roles.buyer_desc' },
  {
    value: 'breeder',
    labelKey: 'auth.roles.breeder',
    icon: '🏠',
    descKey: 'auth.roles.breeder_desc',
  },
  { value: 'sitter', labelKey: 'auth.roles.sitter', icon: '❤️', descKey: 'auth.roles.sitter_desc' },
] as const

type Role = 'buyer' | 'breeder' | 'sitter'

type FormValues = {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: Role
}

export default function RegisterPage() {
  const { t } = useTranslation()
  const { mutate: register, isPending, error } = useRegister()

  const {
    register: field,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>()

  const selectedRole = watch('role')

  const onSubmit = (data: FormValues) => {
    const payload: RegisterPayload = {
      name: data.name,
      email: data.email,
      password: data.password,
      password_confirmation: data.password_confirmation,
      role: data.role,
    }
    register(payload)
  }

  // Extract API field-level errors
  const apiErrors =
    error && 'response' in (error as object)
      ? ((error as { response?: { data?: { errors?: Record<string, string[]> } } }).response?.data
          ?.errors ?? {})
      : {}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">PawTrust</h1>
          <h2 className="mt-2 text-xl text-gray-600">
            {t('auth.register_title', 'Create an account')}
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="name">
              {t('auth.name', 'Full name')}
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...field('name', { required: t('auth.name_required', 'Name is required') })}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            {apiErrors.name && <p className="mt-1 text-sm text-red-600">{apiErrors.name[0]}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="email">
              {t('auth.email', 'Email address')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...field('email', {
                required: t('auth.email_required', 'Email is required'),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('auth.email_invalid', 'Invalid email address'),
                },
              })}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            {apiErrors.email && <p className="mt-1 text-sm text-red-600">{apiErrors.email[0]}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              {t('auth.password', 'Password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...field('password', {
                required: t('auth.password_required', 'Password is required'),
                minLength: {
                  value: 8,
                  message: t('auth.password_min', 'Password must be at least 8 characters'),
                },
              })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="password_confirmation"
            >
              {t('auth.confirm_password', 'Confirm password')}
            </label>
            <input
              id="password_confirmation"
              type="password"
              autoComplete="new-password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...field('password_confirmation', {
                required: t('auth.confirm_password_required', 'Please confirm your password'),
                validate: (val) =>
                  val === watch('password') ||
                  t('auth.password_mismatch', 'Passwords do not match'),
              })}
            />
            {errors.password_confirmation && (
              <p className="mt-1 text-sm text-red-600">{errors.password_confirmation.message}</p>
            )}
          </div>

          {/* Role selector */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.role_label', 'I am a...')}
            </p>
            <input
              type="hidden"
              {...field('role', { required: t('auth.role_required', 'Please select a role') })}
            />
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map(({ value, labelKey, icon, descKey }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('role', value, { shouldValidate: true })}
                  className={`flex flex-col items-center rounded-xl border-2 p-4 cursor-pointer transition-colors ${
                    selectedRole === value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="mt-1 text-sm font-medium text-gray-900">
                    {t(labelKey, value)}
                  </span>
                  <span className="text-xs text-gray-500 text-center mt-0.5">{t(descKey, '')}</span>
                </button>
              ))}
            </div>
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending
              ? t('auth.registering', 'Creating account…')
              : t('auth.register', 'Create account')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          {t('auth.have_account', 'Already have an account?')}{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            {t('auth.login', 'Log in')}
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400">
          {t('auth.privacy_notice', 'By registering, you agree to our')}{' '}
          <Link to="/privacy" className="underline hover:text-gray-600">
            {t('common.privacy_policy', 'Privacy Policy')}
          </Link>{' '}
          {t('common.and', 'and')}{' '}
          <Link to="/terms" className="underline hover:text-gray-600">
            {t('common.terms_of_service', 'Terms of Service')}
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
