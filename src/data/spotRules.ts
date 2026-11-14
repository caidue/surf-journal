import type { RuleSource, SpotRule } from '../types';

/**
 * Local knowledge for the built-in spots: the rules an instructor uses to decide when a spot works
 * and for whom, collected from local and first-hand sources (research report "Local surf school
 * spot knowledge", 2026-11-14) and written in our own words.
 *
 * Confidence: high = several independent local sources agree; medium = one local source with
 * support elsewhere, or consistent physics; low = sources conflict, or a single source.
 * A source that states a condition ("the lower the tide, the more dangerous") outranks a one-word
 * "best tide" label, which often encodes visitor safety rather than wave quality.
 *
 * `inRating` says whether the spot's rating already follows the rule. Conditional rules (tide by
 * swell size, gates on the regional swell, wind vetoes, timing) need the rules engine (next step)
 * and are shown in the spot guide until then. No source gives a wind speed in knots or a swell
 * period threshold for any spot: such numbers will be tuning parameters, never "local fact".
 */

const src = {
  jandia: { name: 'Jandía Riders (local bodyboarders)', url: 'https://jandia-riders.es.tl/%3Cdiv-align=-g-center-g-%3EOlas-y-caracteristicas%3C-s-div%3E.htm', kind: 'local' },
  surfmarket: (slug: string): RuleSource => ({ name: 'surfmarket.org', url: `https://www.surfmarket.org/es/olas/europa/canarias/fuerteventura/${slug}`, kind: 'local' }),
  singlequiver: { name: 'singlequiver', url: 'https://www.singlequiver.com/enelpico/surftrip-isla-de-fuerteventura-canarias/', kind: 'local' },
  ssaftv: { name: 'Surf Skate Academy FTV', url: 'https://surfskateacademyfuerteventura.com/surf-en-fuerteventura/', kind: 'local' },
  wanna: (slug: string): RuleSource => ({ name: 'Wannasurf', url: `https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/${slug}/index.html`, kind: 'first-hand' }),
  playas: (path: string): RuleSource => ({ name: 'FuerteventuraPlayas', url: `https://www.fuerteventuraplayas.com/${path}`, kind: 'portal' }),
  planet: { name: 'Planet Surf Camps', url: 'https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura', kind: 'school' },
  pure: { name: 'Pure Surf Camps', url: 'https://www.puresurfcamps.com/en/blog/fuerteventura-surf-guide/', kind: 'school' },
  billabong: { name: 'Billabong Surf Camp', url: 'https://billabongsurfcamp.es/surf-spots/', kind: 'school' },
  sunwave: { name: 'Sunwave Surf Camp', url: 'https://sunwavesurfcamp.com/blog/show/125-beginners-surf-spots-fuerteventura', kind: 'school' },
  surfescape: { name: 'Surfescape', url: 'https://www.surfescape.com/blog/fuerteventura-surf-spots-guide', kind: 'school' },
  tripspoint: { name: 'El Cotillo surf course (TripsPoint)', url: 'https://www.tripspoint.com/spain/el-cotillo/tour/water-activities-sports/surf-course-in-el-cotillo-on-fuerteventura/4420', kind: 'school' },
  tabula: { name: 'Tabula Rasa', url: 'https://www.tabularasateam.it/en/blog/surfing-in-fuerteventura/', kind: 'school' },
  gonna: { name: 'gonna.surf', url: 'https://gonna.surf/fuerteventura/la-caleta/essentials-spot-guide', kind: 'travel' },
  atlas: (page: string): RuleSource => ({ name: 'The Surf Atlas', url: `https://thesurfatlas.com/surfing-in-canary-islands/${page}/`, kind: 'travel' }),
  mondo: (path: string): RuleSource => ({ name: 'Mondo.surf', url: `https://www.mondo.surf/surf-spot/${path}`, kind: 'travel' }),
  sf: (slug: string): RuleSource => ({ name: 'surf-forecast.com', url: `https://www.surf-forecast.com/breaks/${slug}`, kind: 'forecast-site' }),
  surfline: (path: string): RuleSource => ({ name: 'Surfline', url: `https://www.surfline.com/surf-report/${path}`, kind: 'forecast-site' }),
  session1114: { name: 'Your session, La Caleta, 2026-11-14 (good 11:00–12:00, flat 12:00–14:00)', kind: 'observation' },
} satisfies Record<string, RuleSource | ((x: string) => RuleSource)>;

export const SPOT_RULES: Record<string, SpotRule[]> = {
  /* ---------------- North Shore ---------------- */
  'fv-rocky-point': [
    {
      id: 'rocky-fallback',
      kind: 'role',
      text: 'The fallback when the North Shore is too big (or too windy): the inside works on swells of about 2.5–5 m; the outside only when the North Shore is well over 5 m.',
      confidence: 'high',
      sources: [src.playas('es/spot/rocky-point-inside/'), src.wanna('rocky_point_outside'), src.planet, src.atlas('majanicho')],
      inRating: false,
    },
    {
      id: 'rocky-outside-tide',
      kind: 'tide',
      text: 'Outside (Bajo del Medio): low to mid tide.',
      confidence: 'medium',
      sources: [src.wanna('rocky_point_outside'), src.playas('es/spot/rocky-point-outside/')],
      inRating: true,
    },
    {
      id: 'rocky-inside-tide',
      kind: 'tide',
      text: 'Inside: all tides, careful at low tide over the reef shelf.',
      confidence: 'low',
      sources: [src.playas('es/spot/rocky-point-inside/'), src.sf('Rocky-Point_Bajodel-Medio')],
      inRating: false,
      note: 'Other guides say high tide; the app still prefers mid–high for the inside.',
    },
  ],
  'fv-el-muelle': [
    {
      id: 'muelle-tide-by-size',
      kind: 'tide',
      text: 'Small to medium swell: only surfable at low tide (dangerous at high tide on the reef). Big swell: holds size, above all at high tide.',
      confidence: 'high',
      sources: [src.playas('es/spot/el-muelle/'), src.surfmarket('muelle'), src.jandia],
      inRating: false,
      note: 'The app uses low–mid on every swell; the big-swell exception needs the rules engine.',
    },
    {
      id: 'muelle-level',
      kind: 'level',
      text: 'A shallow slab next to the harbour wall: experts only.',
      confidence: 'medium',
      sources: [src.playas('es/spot/el-muelle/'), src.jandia],
      inRating: true,
    },
  ],
  'fv-bristol': [
    {
      id: 'bristol-tide-level',
      kind: 'level',
      text: 'Breaks on all tides; the lower the tide, the more powerful and dangerous (low tide is for experts).',
      confidence: 'medium',
      sources: [src.surfmarket('bristol'), src.playas('es/spot/bristol/'), src.planet],
      inRating: false,
    },
    {
      id: 'bristol-wind',
      kind: 'wind',
      text: 'Sheltered from westerly wind.',
      confidence: 'medium',
      sources: [src.surfmarket('bristol')],
      inRating: false,
    },
  ],
  'fv-generoso': [
    {
      id: 'generosa-tide',
      kind: 'tide',
      text: 'Tide is disputed: Spanish local sources say low and mid (especially low tide with southerly wind); Wannasurf says high tide only; others say all tides.',
      confidence: 'low',
      sources: [src.surfmarket('generoso'), src.playas('es/spot/generoso-surf-spot/'), src.wanna('la_hennerosa'), src.sf('Genarosa')],
      inRating: true,
      note: 'Until sessions settle it, the app gives no tide preference here.',
    },
    {
      id: 'generosa-small-swell',
      kind: 'role',
      text: 'Picks up small north swells when the rest of the North Shore is small.',
      confidence: 'medium',
      sources: [src.singlequiver, src.wanna('la_hennerosa')],
      inRating: false,
    },
  ],
  'fv-suicides': [
    {
      id: 'suicides-gate',
      kind: 'role',
      text: 'Usually only works when the North Shore is big and clean; mid to high tide.',
      confidence: 'medium',
      sources: [src.wanna('suicidios'), src.sf('Suicides_2'), src.mondo('suicidios/guide/2370')],
      inRating: false,
      note: 'The tide part is in the rating; the "North Shore big" condition needs the rules engine.',
    },
  ],
  'fv-mejillones': [
    {
      id: 'mejillones-small',
      kind: 'role',
      text: 'High tide; still has waves when other North Shore spots are smaller.',
      confidence: 'low',
      sources: [src.playas('es/spot/mejillones/'), src.wanna('mejillones')],
      inRating: false,
      note: 'Location and data are disputed: a Wannasurf comment says its pin is really La Caleta.',
    },
  ],
  'fv-la-caleta': [
    {
      id: 'caleta-swell',
      kind: 'swell',
      text: 'Needs a northerly swell; north-west swell does not wrap into the bay.',
      confidence: 'medium',
      sources: [src.gonna, src.sf('Mechihonas')],
      inRating: true,
    },
    {
      id: 'caleta-tide-by-size',
      kind: 'tide',
      text: 'Small to moderate north swell: low to low-mid, rising (better at low tide; avoid big tides). A preference for higher tide applies, if at all, only on bigger swells.',
      confidence: 'low',
      sources: [src.gonna, src.session1114, src.planet, src.playas('en/?p=7880'), src.billabong, src.tabula],
      inRating: false,
      note: 'Sources conflict (high / all tides / low). Until the rules engine applies the size-dependent window, the app gives no tide preference here.',
    },
    {
      id: 'caleta-wind',
      kind: 'wind',
      text: 'Needs E, SE or S wind; N to NNE wind is onshore and closes it down.',
      confidence: 'medium',
      sources: [src.planet, src.mondo('caleta/guide/1525')],
      inRating: true,
    },
    {
      id: 'caleta-level',
      kind: 'level',
      text: 'Used by surf schools: improvers and intermediates on small days.',
      confidence: 'medium',
      sources: [src.mondo('caleta/guide/1525'), src.planet, src.session1114],
      inRating: true,
    },
  ],
  'fv-majanicho': [
    {
      id: 'majanicho-inside-gate',
      kind: 'size',
      text: 'The inside peaks only appear when the outside reefs are about 2 m or more; the bay A-frame from about 3 m outside. Incoming tide, little wind.',
      confidence: 'high',
      sources: [src.playas('es/spot/majanicho-inside/'), src.surfmarket('majanicho'), src.wanna('majanicho')],
      inRating: false,
      note: 'The app still treats the inside peaks as working from 0.8 m.',
    },
    {
      id: 'majanicho-outside',
      kind: 'tide',
      text: 'Outside: all tides, about 0.5–2 m; windsurfers take it over in easterly wind.',
      confidence: 'medium',
      sources: [src.playas('es/spot/majanicho-outside/'), src.wanna('majanicho'), src.mondo('majanicho-outside/guide/2465')],
      inRating: true,
    },
  ],
  'fv-the-bubble': [
    {
      id: 'bubble-tide',
      kind: 'tide',
      text: 'Mid to mid-high tide; locals wait for the right point of the tide. Needs a bigger swell than the El Hierro bay.',
      confidence: 'medium',
      sources: [src.planet, src.pure, src.surfmarket('bubbles'), src.wanna('the_bubble')],
      inRating: true,
    },
  ],
  'fv-derecha-alemanes': [
    {
      id: 'derecha-wind',
      kind: 'wind',
      text: 'Very sensitive to wind: N or NW wind makes it mushy and unrideable.',
      confidence: 'medium',
      sources: [src.wanna('derecha_de_los_alemanes')],
      inRating: false,
    },
    {
      id: 'derecha-ladder',
      kind: 'size',
      text: 'Needs more swell than the left across the bay; all tides.',
      confidence: 'high',
      sources: [src.wanna('derecha_de_los_alemanes'), src.sf('Los-Alemanes'), src.playas('en/?p=7914')],
      inRating: true,
    },
  ],
  'fv-el-hierro': [
    {
      id: 'izquierda-low-tide',
      kind: 'level',
      text: 'All tides, but the wave gets very aggressive at low tide (expert territory then). Works on smaller swell than the right.',
      confidence: 'medium',
      sources: [src.jandia, src.surfmarket('izquierda-del-hierro'), src.playas('es/spot/izquiera-del-hierro/'), src.wanna('hierro_left')],
      inRating: false,
    },
  ],
  'fv-punta-blanca': [
    {
      id: 'punta-blanca-soft',
      kind: 'level',
      text: 'Softer than any other North Shore reef and protected from straight NW swell; popular with surf schools when small. Urchins on lower tides.',
      confidence: 'medium',
      sources: [src.atlas('fuerteventura-surf'), src.atlas('majanicho'), src.playas('es/spot/punta-blanca/'), src.mondo('punta-blanca/guide/2367')],
      inRating: true,
    },
  ],

  /* ---------------- El Cotillo / west ---------------- */
  'fv-cotillo-piedra-playa': [
    {
      id: 'cotillo-tide-by-level',
      kind: 'tide',
      text: 'Beginners: low tide and swell under about 1 m (at high tide the waves break on the shore). Intermediate and advanced sessions about 3 hours either side of high tide.',
      confidence: 'medium',
      sources: [src.surfescape, src.tripspoint],
      inRating: false,
      note: 'The app uses mid–high for the Piedra Playa peaks for everyone.',
    },
    {
      id: 'cotillo-castillo',
      kind: 'wind',
      text: 'Castillo (north end) is more sheltered from north wind and a school favourite; offshore in easterly wind. Closes out when big.',
      confidence: 'medium',
      sources: [src.atlas('el-cotillo-surf')],
      inRating: true,
    },
  ],
  'fv-esquinzo': [
    {
      id: 'esquinzo-tide',
      kind: 'tide',
      text: 'Best around high tide; heavy tubes at low tide on big NW swell. More sheltered from NE wind than the North Shore.',
      confidence: 'medium',
      sources: [src.sf('Playade-Esquinzo_1'), src.tabula, src.atlas('el-cotillo-surf')],
      inRating: true,
    },
  ],
  'fv-cotillo-spew-pits': [
    {
      id: 'spew-pits-unknown',
      kind: 'tide',
      text: 'Experts only, NW swell, NE wind. No source gives a tide preference.',
      confidence: 'low',
      sources: [src.atlas('el-cotillo-surf'), src.sf('Spew-Pits')],
      inRating: true,
      note: 'Location disputed: The Surf Atlas puts it about 100 m outside the harbour mouth.',
    },
  ],

  /* ---------------- Corralejo east side and Lobos ---------------- */
  'fv-lobos': [
    {
      id: 'lobos-tide',
      kind: 'tide',
      text: 'Low to mid tide; starts at about 1–1.5 m and holds 2.5 m+.',
      confidence: 'high',
      sources: [src.wanna('los_lobos'), src.planet],
      inRating: true,
    },
    {
      id: 'lobos-ferry',
      kind: 'logistics',
      text: 'Ferry island: the first boat arrives around 10:00; check the last departure time.',
      confidence: 'medium',
      sources: [src.planet, src.atlas('corralejo-surf')],
      inRating: false,
    },
  ],
  'fv-flag-beach': [
    {
      id: 'flag-wind',
      kind: 'wind',
      text: 'A first stop for Corralejo surf schools; the main problem is the wind (NW–W is offshore). Low to mid tide, sharp rocks at low tide.',
      confidence: 'low',
      sources: [src.atlas('corralejo-surf'), src.sunwave, src.playas('en/?p=7699')],
      inRating: false,
      note: 'The forecast point may sit near Lobos, so its wind and waves are less reliable.',
    },
  ],
  'fv-corralejo-beach': [
    {
      id: 'grandes-exposure',
      kind: 'swell',
      text: 'Works on summer N–NE swells; moderate NW swell mostly misses it. NW wind is offshore; summer easterlies spoil the glassiness.',
      confidence: 'medium',
      sources: [src.atlas('corralejo-surf'), src.surfline('corralejo-beach/584204204e65fad6a77096a4')],
      inRating: true,
    },
  ],
  'fv-playa-los-matos': [
    {
      id: 'matos-level',
      kind: 'level',
      text: 'For intermediates who can judge a rip and check the tide.',
      confidence: 'low',
      sources: [src.atlas('corralejo-surf')],
      inRating: true,
    },
  ],
  'fv-glass-beach': [
    {
      id: 'burro-timing',
      kind: 'timing',
      text: 'Mid tide (one guide says lower tide); NE swell of 1–2 m. The wind picks up in the afternoon: surf mornings and evenings.',
      confidence: 'medium',
      sources: [src.sf('El-Burro'), src.planet, src.atlas('corralejo-surf'), src.playas('en/?p=7674')],
      inRating: false,
      note: 'The tide part is in the rating; the morning preference needs the rules engine.',
    },
  ],
  'fv-playa-del-moro': [
    {
      id: 'moro-tide',
      kind: 'tide',
      text: 'Medium to low tide (rocks show at low); consistent in summer N–E windswell, usually flat in winter unless a big N–NW swell wraps in.',
      confidence: 'medium',
      sources: [src.surfescape, src.atlas('corralejo-surf')],
      inRating: false,
      note: 'The app gives no tide preference here yet.',
    },
  ],
};

/** Every rule for a spot (none for your own spots). */
export const rulesFor = (spotId: string): SpotRule[] => SPOT_RULES[spotId] ?? [];
