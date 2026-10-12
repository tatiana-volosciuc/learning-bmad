import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  createSitterProfile,
  updateSitterProfile,
  getMySitterProfile,
  uploadPortfolioPhoto,
  deletePortfolioPhoto,
  type SitterProfilePayload,
  type SitterService,
} from '@/api/sitter.api'

const SERVICE_OPTIONS: SitterService[] = ['boarding', 'dog_walking', 'day_care', 'drop_in']
const MAX_SERVICE_AREAS = 3
const MAX_PHOTOS = 6
const BIO_MAX_LENGTH = 500

export function SitterProfileForm() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: profile } = useQuery({
    queryKey: ['mySitterProfile'],
    queryFn: () => getMySitterProfile().then((r) => r.data.data),
    retry: false,
  })

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [serviceAreas, setServiceAreas] = useState<string[]>([''])
  const [services, setServices] = useState<SitterService[]>([])
  const [rates, setRates] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [languageInput, setLanguageInput] = useState('')
  const [languages, setLanguages] = useState<string[]>([])

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setBio(profile.bio ?? '')
    setServiceAreas(profile.service_areas.length > 0 ? profile.service_areas : [''])
    setServices(profile.services ?? [])
    setRates(profile.rates ?? '')
    setExperienceYears(profile.experience_years != null ? String(profile.experience_years) : '')
    setLanguages(profile.languages ?? [])
  }, [profile])

  const mutation = useMutation({
    mutationFn: (payload: SitterProfilePayload) =>
      profile ? updateSitterProfile(payload) : createSitterProfile(payload),
    onSuccess: () => {
      toast.success(t('sitter.profile_saved', 'Profile saved!'))
      queryClient.invalidateQueries({ queryKey: ['mySitterProfile'] })
    },
  })

  const photoMutation = useMutation({
    mutationFn: (file: File) => uploadPortfolioPhoto(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mySitterProfile'] }),
  })

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: number) => deletePortfolioPhoto(photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mySitterProfile'] }),
  })

  function toggleService(service: SitterService) {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    )
  }

  function updateServiceArea(index: number, value: string) {
    setServiceAreas((prev) => prev.map((a, i) => (i === index ? value : a)))
  }

  function addServiceArea() {
    if (serviceAreas.length < MAX_SERVICE_AREAS) setServiceAreas((prev) => [...prev, ''])
  }

  function removeServiceArea(index: number) {
    setServiceAreas((prev) => prev.filter((_, i) => i !== index))
  }

  function addLanguage() {
    const value = languageInput.trim()
    if (value && !languages.includes(value)) {
      setLanguages((prev) => [...prev, value])
    }
    setLanguageInput('')
  }

  function removeLanguage(lang: string) {
    setLanguages((prev) => prev.filter((l) => l !== lang))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) photoMutation.mutate(file)
    e.target.value = ''
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({
      full_name: fullName,
      bio: bio || undefined,
      service_areas: serviceAreas.filter((a) => a.trim().length > 0),
      services,
      rates: rates || undefined,
      experience_years: experienceYears ? Number(experienceYears) : undefined,
      languages: languages.length > 0 ? languages : undefined,
    })
  }

  const photoCount = profile?.portfolio_photos.length ?? 0

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {mutation.isError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {t('common.error_generic', 'Something went wrong. Please try again.')}
        </div>
      )}

      <div>
        <label htmlFor="sitter-full-name" className="block text-sm font-medium text-gray-700">
          {t('sitter.form.full_name', 'Full Name')}
        </label>
        <input
          id="sitter-full-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={150}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="sitter-bio" className="block text-sm font-medium text-gray-700">
          {t('sitter.form.bio', 'Bio')}
        </label>
        <textarea
          id="sitter-bio"
          rows={4}
          maxLength={BIO_MAX_LENGTH}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
        />
        <p className="text-xs text-gray-400 text-right mt-0.5">
          {BIO_MAX_LENGTH - bio.length} {t('inquiry.chars_remaining', 'characters remaining')}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('sitter.form.service_areas', 'Service Areas (up to 3)')}
        </label>
        <div className="space-y-2">
          {serviceAreas.map((area, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={area}
                onChange={(e) => updateServiceArea(index, e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              />
              {serviceAreas.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeServiceArea(index)}
                  className="px-3 text-sm text-gray-500 hover:text-red-600"
                >
                  {t('common.remove', 'Remove')}
                </button>
              )}
            </div>
          ))}
        </div>
        {serviceAreas.length < MAX_SERVICE_AREAS && (
          <button
            type="button"
            onClick={addServiceArea}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            {t('sitter.form.add_area', '+ Add area')}
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('sitter.form.services', 'Services Offered')}
        </label>
        <div className="flex flex-wrap gap-3">
          {SERVICE_OPTIONS.map((service) => (
            <label key={service} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={services.includes(service)}
                onChange={() => toggleService(service)}
              />
              {t(`sitter.service_${service}`, service)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="sitter-rates" className="block text-sm font-medium text-gray-700">
          {t('sitter.form.rates', 'Rates')}
        </label>
        <input
          id="sitter-rates"
          type="text"
          value={rates}
          onChange={(e) => setRates(e.target.value)}
          maxLength={200}
          placeholder="€15/night boarding"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="sitter-experience" className="block text-sm font-medium text-gray-700">
          {t('sitter.form.experience_years', 'Years of Experience')}
        </label>
        <input
          id="sitter-experience"
          type="number"
          min={0}
          max={50}
          value={experienceYears}
          onChange={(e) => setExperienceYears(e.target.value)}
          className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="sitter-language-input"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t('sitter.form.languages', 'Languages Spoken')}
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {languages.map((lang) => (
            <span
              key={lang}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
            >
              {lang}
              <button
                type="button"
                onClick={() => removeLanguage(lang)}
                className="text-gray-400 hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="sitter-language-input"
            type="text"
            value={languageInput}
            onChange={(e) => setLanguageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addLanguage()
              }
            }}
            maxLength={10}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={addLanguage}
            className="px-3 text-sm text-blue-600 hover:underline"
          >
            {t('sitter.form.add_language', '+ Add')}
          </button>
        </div>
      </div>

      {profile && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('sitter.form.portfolio', 'Care Portfolio (max 6 photos)')}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
            {profile.portfolio_photos.map(
              (photo) =>
                photo.url && (
                  <div key={photo.id} className="relative">
                    <img src={photo.url} alt="" className="w-full h-20 object-cover rounded-md" />
                    <button
                      type="button"
                      onClick={() => deletePhotoMutation.mutate(photo.id)}
                      className="absolute top-0.5 right-0.5 bg-white/80 rounded-full px-1.5 text-xs text-red-600"
                    >
                      ×
                    </button>
                  </div>
                )
            )}
          </div>
          {photoCount < MAX_PHOTOS && (
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
      >
        {mutation.isPending
          ? t('sitter.form.saving', 'Saving…')
          : t('sitter.form.save', 'Save Profile')}
      </button>
    </form>
  )
}
