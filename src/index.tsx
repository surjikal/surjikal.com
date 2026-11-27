import { Hono } from 'hono'
import { Fragment } from 'hono/jsx'
import { renderer } from './renderer'
import { MUSIC_LINKS, SITE } from './site'
import {
  COLOR_SCHEMES,
  RESOLUTION_PRESETS,
  SATURATION_MAX,
  SATURATION_MIN,
  SPEED_MAX,
  SPEED_MIN,
  VIZ_MODES,
} from './viz'

const PUBLIC_CACHE_HEADERS = {
  'cache-control': 'public, max-age=0, s-maxage=3600',
  'x-content-type-options': 'nosniff',
} as const

const AI_USER_AGENTS = [
  '*',
  'Googlebot',
  'Bingbot',
  'OAI-SearchBot',
  'GPTBot',
  'ChatGPT-User',
  'PerplexityBot',
  'ClaudeBot',
  'anthropic-ai',
  'Google-Extended',
] as const

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get('/.well-known/discord', (c) =>
  c.text('dh=25740a84b0fd31b6ea341d11a673e829dd03315c', 200, {
    'content-type': 'text/plain; charset=UTF-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  }),
)

app.get('/robots.txt', (c) => {
  const origin = new URL(c.req.url).origin
  const rules = AI_USER_AGENTS.flatMap((agent) => [`User-agent: ${agent}`, 'Allow: /', ''])
  const body = [...rules, `Sitemap: ${origin}/sitemap.xml`, ''].join('\n')

  return c.text(body, 200, {
    'content-type': 'text/plain; charset=UTF-8',
    ...PUBLIC_CACHE_HEADERS,
  })
})

app.get('/sitemap.xml', (c) => {
  const origin = new URL(c.req.url).origin
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`

  return c.body(xml, 200, {
    'content-type': 'application/xml; charset=UTF-8',
    ...PUBLIC_CACHE_HEADERS,
  })
})

app.get('/llms.txt', (c) => {
  const origin = new URL(c.req.url).origin
  const body = [
    `# ${SITE.artist} (${SITE.name})`,
    '',
    `> Official homepage for ${SITE.artist} (${SITE.name}), based in ${SITE.location}.`,
    '',
    '## Official Links',
    '',
    `- Website: ${origin}/`,
    ...MUSIC_LINKS.map((link) => `- ${link.title}: ${link.href}`),
    '',
  ].join('\n')

  return c.text(body, 200, {
    'content-type': 'text/plain; charset=UTF-8',
    ...PUBLIC_CACHE_HEADERS,
  })
})

app.use('/', renderer)

function VizSelect({
  control,
  label,
  options,
}: {
  control: string
  label: string
  options: readonly { readonly id: string; readonly label: string }[]
}) {
  return (
    <select class="viz-select" data-viz-control={control} aria-label={label}>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function VizSlider({
  control,
  label,
  min,
  max,
}: {
  control: string
  label: string
  min: number
  max: number
}) {
  return (
    <label class="viz-slider">
      <span class="viz-slider-label">{label}</span>
      <input
        type="range"
        class="viz-range"
        data-viz-control={control}
        min={min}
        max={max}
        step="1"
        aria-label={label}
      />
      <output class="viz-slider-readout" data-viz-readout={control} />
    </label>
  )
}

function VizToggle() {
  return (
    <div class="viz-toggle" role="group" aria-label="Background visualization controls">
      <button type="button" class="viz-btn" data-viz-dir="-1" aria-label="Previous visualization">
        ‹
      </button>
      <VizSelect control="mode" label="Select visualization" options={VIZ_MODES} />
      <button type="button" class="viz-btn" data-viz-dir="1" aria-label="Next visualization">
        ›
      </button>
      <span class="viz-sep" aria-hidden="true" />
      <VizSelect control="color" label="Select color scheme" options={COLOR_SCHEMES} />
      <span class="viz-sep" aria-hidden="true" />
      <VizSlider
        control="saturation"
        label="Saturation"
        min={SATURATION_MIN}
        max={SATURATION_MAX}
      />
      <span class="viz-sep" aria-hidden="true" />
      <VizSelect control="resolution" label="Select resolution" options={RESOLUTION_PRESETS} />
      <span class="viz-sep" aria-hidden="true" />
      <VizSlider control="speed" label="Speed" min={SPEED_MIN} max={SPEED_MAX} />
    </div>
  )
}

function HomePage() {
  return (
    <>
      <canvas class="bg-life" aria-hidden="true" />
      <main class="page">
        <div class="hero">
          <div class="surj-wrap">
            <svg
              class="surj"
              viewBox="0 0 1000 190"
              preserveAspectRatio="none"
              role="img"
              aria-label={SITE.artist}
            >
              <text x="0" y="165" textLength="1000" lengthAdjust="spacingAndGlyphs">
                {SITE.artist}
              </text>
            </svg>
          </div>

          <nav class="music-links" aria-label="Music and video">
            {MUSIC_LINKS.map((link, index) => (
              <Fragment key={link.id}>
                {index > 0 && <span class="divider" aria-hidden="true" />}
                <a
                  class={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.title}
                >
                  <span class="sr-only">{link.ariaLabel}</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={link.svgPath} />
                  </svg>
                </a>
              </Fragment>
            ))}
          </nav>
        </div>
      </main>
      <VizToggle />
    </>
  )
}

app.get('/', (c) => {
  for (const [header, value] of Object.entries(PUBLIC_CACHE_HEADERS)) {
    c.header(header, value)
  }
  c.header('x-robots-tag', 'index, follow')
  c.header('referrer-policy', 'strict-origin-when-cross-origin')

  return c.render(<HomePage />)
})

export default app
