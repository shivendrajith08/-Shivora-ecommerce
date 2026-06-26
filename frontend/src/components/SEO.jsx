import { Helmet } from 'react-helmet-async'

export default function SEO({ title, description, image, url, type = 'website' }) {
  const siteName = 'Shivora'
  const defaultTitle = 'Shivora | Luxury Online Shopping'
  const defaultDescription = 'Shop premium fashion, electronics, home & more at Shivora. Free shipping. Cash on delivery.'
  const defaultImage = 'https://shivora-ecommerce.vercel.app/og-image.jpg'
  const siteUrl = 'https://shivora-ecommerce.vercel.app'
  const fullTitle = title ? `${title} | ${siteName}` : defaultTitle
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl
  const absoluteImage = !image ? defaultImage : image.startsWith('http') ? image : `${siteUrl}${image}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={absoluteImage} />
      <link rel="canonical" href={fullUrl} />
    </Helmet>
  )
}
