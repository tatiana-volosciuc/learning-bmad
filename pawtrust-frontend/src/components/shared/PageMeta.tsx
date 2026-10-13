import { Helmet } from 'react-helmet-async'

interface PageMetaProps {
  title: string
  description?: string
  ogImage?: string
  ogType?: 'website' | 'article'
}

export function PageMeta({ title, description, ogImage, ogType = 'website' }: PageMetaProps) {
  const fullTitle = `${title} | PawTrust`
  const canonical =
    typeof window !== 'undefined' ? `https://pawtrust.md${window.location.pathname}` : undefined

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="PawTrust" />
    </Helmet>
  )
}
