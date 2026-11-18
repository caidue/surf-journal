# Surf Spot Ratings, Uncertain Wave Heights, and User Size Limits

Research date: 2026-11-18. Access limits: surfline.com pages (LOTUS feature page, forecast-performance page) and the Surfline Labs Medium post returned HTTP 403 to direct fetch, so the Surfline details below come from search-engine summaries of Surfline's own pages, not from full reads. web.archive.org could not be fetched, so no archived Magicseaweed FAQ was read.

## 1. How do commercial products compute spot ratings, and which inputs dominate?

### Takeaway
Every product that discloses anything says ratings come mainly from **(a) a spot-specific surf size derived from swell (height + period + direction run through spot exposure/bathymetry)** and **(b) local wind**, with tide as a secondary or spot-specific factor. None publishes an exact formula. Surfline's model ratings are explicitly "relative to each spot's potential", and its top ratings need a human who has seen the surf. Surf-forecast.com's stars reward bigger and longer-period swell and are cut by onshore wind.

### Cited Findings
**Surfline (LOTUS + human forecasters)**
- Surfline's own pages (as summarized by search): ratings update hourly from LOTUS, "which takes into account surf height and wind conditions". Ratings are "relative to each spot's potential" and account for regional and spot-specific nuances. Surfline calls them "guides—not guarantees" — [Surfline What's New: LOTUS](https://www.surfline.com/lp/whatsnew/features/lotus-swell-model) (fetch blocked; content via search summary)
- LOTUS uses machine learning for hourly local results. It draws on about 25 years of Surfline's historical surf reports, about 20 years of camera data, satellite data, bathymetry mapping and forecaster input — [Surfline LOTUS page](https://www.surfline.com/lp/whatsnew/features/lotus-swell-model) (via search summary)
- Surfline moved to a **5-bar condition rating**. "Good" and "Epic" labels can override the bar, but **only forecasters who have observed the conditions** can assign them. At most spots the model ratings use surf height and wind. A "Fair" at Pipeline is not the same as a "Fair" at an average beach break — [Surfline What's New, Apr-25 release](https://www.surfline.com/lp/whatsnew/releases/apr-25) (via search summary; date taken to be April 2025 from the URL)
- Older 1–10 Surfline scale (secondhand, 2010s repost attributed to Surfline's founder): 1 = Flat ... 10 = Epic. Middle levels were defined by the share of waves that are fair, good or epic to ride. It also notes that what an average surfer would rate GOOD an advanced surfer might rate only FAIR — [Steemit repost](https://steemit.steemapps.com/surfing/@potatrick/surfline-s-rating-of-surf-heights-and-quality) (secondary and probably outdated)
- Criticism: a student opinion piece says LOTUS wave heights have become "wildly inaccurate and possibly hazardous" since the AI integration. It is a single opinion, not an evaluation — [Golden Gate Xpress](https://goldengatexpress.org/113424/opinion/opinion-surfline-sucks-now/)

**Surf-forecast.com**
- The star rating runs 1–10 and is "based on swell size and character". Bigger swells and longer periods rate higher. Onshore wind lowers the rating in proportion to wind speed and turns the star pale. Flat surf, blown-out onshore surf or very strong wind from any direction gives 0. A 10 means "best big surf with classic conditions and light offshore winds" — [Surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq)
- The FAQ notes that periods under ~9 s tend to be locally generated wind sea and are less likely to give good surf — [Surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq) (via search summary)
- Forecast swell heights are open-water heights near the coast, not breaking heights. Breaking height is "strongly determined by the local sea bed geometry". The FAQ gives no method for direction or exposure — [Surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq)
- The stars are size-biased: bigger always rates higher, up to "best big surf". That is the opposite of a skill-aware rating — [Surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq)

**Surf Captain (2020 blog post)**
- Runs its own WAVEWATCH III-based model. At each spot's offshore output point, the 360° spectrum is split statistically into swell partitions and **the two most energetic partitions are used**. For each, the energy reaching the location is estimated, checked against buoys where available, and fed to their algorithm to give surf height. Locations "are not treated equally": the same offshore swell gives different surf heights depending on bathymetry. Heights are "implied for the average to better breaks in the local region" — [Surf Captain blog, 7 Jul 2020](https://surfcaptain.com/blog/1/understand-the-surf-height-forecast)

**Windguru**
- Third-party guides describe Windguru's stars as a **wind** rating (more wind, more stars), not a wave rating. Windguru publishes no wave-quality formula — [Mundo-Surf guide](https://mundo-surf.com/blog/en/?p=1888) (secondary)

**Other rating schemes**
- BigSalty rates waves from swell period, direction and height combined with wind direction — [BigSalty swell rating system](https://bigsalty.com/en/post/view/bigsalty-swell-rating-system/) (via search summary)
- The "Swell Rating System" paper on stormsurf.com classifies breaking waves by swell amplitude, period and quality. It treats locally generated wind waves as degrading quality. Only the table of contents was found — [Stormsurf papers](https://stormsurf.com/page2/papers/category.html)

### Inferences
- The industry pattern is **swell first, then spot transfer, then wind/tide modifiers**. Surf height is itself derived from swell partitions plus spot exposure, so a recommender that reasons from swell (height, period, direction against the spot window) is following the same logic the big products use internally.
- Surf Captain's "top-two partitions" approach implies that the combined significant wave height (Hs, all wave energy lumped into one height) is not what drives surf height. The useful input is the swell partitions aimed at the spot. A combined Hs inflated by wind sea that doesn't reach the break would over-predict surf height.
- Surfline needs a human observer for top ratings and keeps model ratings relative to each spot. That signals that even the market leader doesn't fully trust pure model output for the extremes.

### Gaps
- No product publishes its rating formula or weights. Surfline's full LOTUS documentation could not be read (403).
- Magicseaweed's star system could not be verified from a primary or archived source. From memory and unverified: MSW used solid stars for swell quality and faded stars when wind spoiled it, and shut down in 2023 after merging into Surfline. One search summary wrongly said MSW closed in 2016.
- Glassy, Dawn Patrol and Surfline Sessions: no rating-method documentation was found.

## 2. Do products use swell energy (kJ, H²T) instead of height for size, and how is it used to compare spots?

### Takeaway
Surf-forecast.com is the main product that exposes swell **energy (kJ)**. It presents energy as a better guide to surf power than height alone, recommends that users **calibrate their own small and large comfort limits in kJ**, and computes it after accounting for swell direction and local bathymetry. No exact formula is published.

### Cited Findings
- Energy in kJ "indicates the power of the predicted waves", depends on both size and period, and is a better guide than height alone because short- and long-period waves of similar height surf differently. The FAQ suggests noting the energy on a small surfable day and on your biggest comfortable day to define your personal range. Rough guide: about 100 kJ "just about surfable", 200–1000 kJ punchier, 1000–5000+ kJ "really heavy and even dangerous at some breaks" — [Surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq)
- The energy combines all swell heights and periods at the offshore point and then accounts for **swell direction and local bathymetry** to estimate energy reaching the spot. Personal bands quoted: ≤100 tiny, 100–300 longboard, >300 shortboard or mid-length, >1000 beyond one surfer's comfort zone. A Reddit commenter says a favourite Indonesian wave "only works below 350". Examples include "4 ft @ 16 s vs 6 ft @ 14 s" as hard to compare by height and period alone — [Surf-forecast Greenroom, 16 Apr 2025](https://www.surf-forecast.com/greenroom/how-surf-forecasts-wave-energy-tool-is-like-volume-for-surfboards/)
- Guides note that long-period swell (≥13 s) breaks bigger than its forecast height, and that swells arriving at a steep angle to a spot lose a lot of size and power — [DeepSwell spot guide](https://deepswell.com/surf-guide/US/Kauai/PKs/2109); [Surf Girl Mag](https://surfgirlmag.com/?p=283876) (commercial, rules of thumb)

### Inferences
- In standard linear wave theory, deep-water energy flux per metre of crest scales with **H²·T**. This is textbook physics and was not re-verified this session. A 2.2 m limit expressed as height therefore means very different surf at 8 s and at 16 s, and energy is a fairer single size axis.
- Design option: store the user's limit as **energy** (or derive a height limit that depends on period) and compute energy from the **swell partitions inside the spot's directional window**, not from combined Hs. This also handles wind sea from outside the window, which adds to Hs but not to surfable energy at the spot.
- Surf-forecast's "calibrate from your logged sessions" advice fits a surf-journal app. Fit the user's comfort ceiling from sessions they logged as "too big" or "max comfortable", instead of a typed-in 2.2 m.

### Gaps
- Surf-forecast's exact kJ formula and units are not published (it is described loosely as "energy per meter cubed in a wavefront").
- No published comparison was found of energy-based and height-based accuracy for predicting surf size.

## 3. How do products present ranges and uncertainty?

### Takeaway
Surf heights are commonly shown as **ranges** (e.g. 3–4 ft, or 1–1.5 m) representing typical-to-set waves. Accuracy falls with lead time and with bigger surf. Surfline's own published accuracy shows errors of ±1.5 ft or more in a large share of cases. Operational ocean centres use **ensembles and exceedance probabilities** (for example, P(Hs > threshold)), but no surf app was found that exposes ensemble spread or a confidence score.

### Cited Findings
- Surf reports give a range that estimates commonly arriving set heights. The higher a value sits in the range, the less often waves that size arrive — [University of Hawaii Sea Level Center](https://uhslc.soest.hawaii.edu/outreach/vary/why_surf_varies.html)
- Observer "occasional" heights correspond roughly to H1/100, the highest wave in about 100 — [Caldwell 2004, WIF paper](https://data-ww3.ifremer.fr/BIB/Caldwell_8WIF2004.pdf)
- Surfline-reported accuracy for an older model: reported heights 0–4 ft were within 1.5 ft about **83%** of the time, and 4–6 ft about **62%** of the time ("clearly room for improvement"). Surfline uses mean absolute error against a baseline and says human-forecaster adjustment adds measurable value over the raw model — [Surfline Labs, "Surf Forecast Accuracy" (Medium, ~2019)](https://medium.com/surfline-labs/surf-forecast-accuracy-b563605f104c) (fetch blocked; figures via search summary)
- Surfline rolls out LOTUS spot updates only where it has "enough significant data and confidence" that they improve the forecast — [Surfline Forecast Performance](https://www.surfline.com/lp/whatsnew/forecast-performance-updates) (via search summary)
- Seven-day predictions are of dramatically lower quality than 24-hour forecasts — [Surfertoday](https://www.surfertoday.com/surfing/14122-how-to-read-a-surf-report) (secondary)
- NOAA's Global Wave Ensemble System (GWES) presents exceedance probability as a share of ensemble members: "30% chance of waves exceeding 18 ft" means 7 of 21 members exceed it — [NOAA OPC GWES explanation](https://ocean.weather.gov/gwes_explain.php)
- ECMWF found its ensemble wave probabilities reliable, with slight over-confidence for waves above 6 m and 8 m — [ECMWF Tech Memo 388 (2002)](https://www.ecmwf.int/sites/default/files/elibrary/2002/12060-assessment-ecmwf-ensemble-prediction-system-waves-and-marine-winds.pdf)
- Recommended practice: when assessing threshold exceedance, evaluate **both the probability and how far the threshold is exceeded**. 90% odds of exceeding by 1 m differs from 90% odds of exceeding by 10–20 cm — [UN Ocean Prediction wiki](https://unoceanprediction.org/resources/wiki/chapters/380)

### Inferences
- Treating one computed height as an exact value overstates its precision. At ~4–6 ft, Surfline itself is off by more than 1.5 ft about 38% of the time. A 2.2 m hard cut is well inside typical error, so a spot forecast at 2.3 m has a large chance of actually being under 2.2 m, and the reverse.
- When several sources disagree (for example, the computed height for one spot differs a lot between sources), **source spread can stand in for ensemble spread**. Use min/median/max across sources as low/central/high and widen the range with lead time.

### Gaps
- No surf-specific product was found that shows a numeric confidence or ensemble spread to users. Surfline's range-construction method was not readable (403).
- No published figures were found for how fast surf-height error grows per forecast day.

## 4. How do products apply user skill or size limits: hard cut-off, soft penalty, or warning?

### Takeaway
The big incumbents (Surfline, surf-forecast.com, Windguru) give **one rating for everyone**, which often favours bigger surf, and leave suitability to the user. A newer wave of apps (BUIO, WaveCheck, SurfMap, Swellify, Lazy Surfer, Surf Prophet) personalise by skill, board or logged sessions. Their marketing describes **scoring and alerts** ("ranks days for your level", "Too small for your level" alert), not exclusion. None documents whether "too big" is a hard cut or a penalty. No public best-practice standard for personalised surf recommendations was found.

### Cited Findings
- Surfline and Magicseaweed "don't take your personal taste in waves into account" and give "a one-size-fits-all rating" — [Lazy Surfer App Store listing](https://apps.apple.com/us/app/lazy-surfer/id1450887020) (competitor claim). Lazy Surfer alerts when conditions match sessions you logged and has a 16-day personalised forecast — same source
- BUIO: the forecast "automatically acknowledges your skill level, the wave size you are comfortable in and the boards you ride" and becomes more accurate as you log sessions — [BUIO](https://buioapp.com); [App Store](https://apps.apple.com/dk/app/buio/id912585764)
- SurfMap: a "Too small for your level" alert, a weekly view that ranks days for your level, and per-spot learning of preferred tide and size — [SurfMap App Store](https://apps.apple.com/app/id6749829392)
- WaveCheck scores each forecast by skill level and board, or by user preferences — [WaveCheck App Store](https://apps.apple.com/app/id6759298516). Swellify gives hourly ratings per spot by skill level — [Swellify](https://apps.apple.com/us/app/swellify/id6470770160). Surf Prophet gives skill-level recommendations learned from successful sessions — [AppAdvice](https://appadvice.com/app/surf-prophet/6749921029)
- Surfline Premium+ (July 2024) adds Smart Cam wave timeline and distribution, crowd counts and clips, framed as helping surfers decide by their own preferences. No user size-limit scoring was found — [Shop-Eat-Surf](https://shop-eat-surf-outdoor.com/?p=543054)
- Surf-forecast.com tells users to self-calibrate their comfortable kJ range instead of the site filtering for them — [Surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq)
- Surfline's own framing: ratings depend on the rater. Advanced surfers may rate GOOD days only FAIR — [Steemit repost of Surfline scale](https://steemit.steemapps.com/surfing/@potatrick/surfline-s-rating-of-surf-heights-and-quality)

### Inferences
- No surveyed product was found to **hide** a spot because forecast size exceeds a user setting. The prevailing pattern is to show everything and rank, flag or alert. A hard exclusion on an uncertain number is out of step with the field.
- Asymmetric risk matters. "Too big" is a safety issue, while "too small" is only a wasted trip. A reasonable design keeps a **hard cut only when even the low end of the range clearly exceeds the limit** (high confidence of being dangerous) and uses a penalty plus warning otherwise.

### Gaps
- None of the personalised apps documents its algorithm. Hard and soft behaviour can't be confirmed from listings.
- No academic or industry best-practice guide for personalised surf recommendation was found.

## 5. Decision-making under uncertainty: range against limit, confidence-scaled penalties, warnings, and swell-partition fallback

### Takeaway
Weather-communication research shows that **giving people the uncertainty (probabilities or ranges) improves decisions and preserves trust**, while bare recommendations or deterministic values do not. Ensemble practice checks **the probability and the margin** of exceeding a threshold. Together these support replacing the hard 2.2 m cut-off with a range-vs-limit comparison, a confidence-weighted penalty, a "might be bigger than you like" warning, and swell-partition / energy-based sizing when combined height is dominated by wind sea or sources disagree.

### Cited Findings
- Acknowledging forecast uncertainty **increased trust** in the prediction, and uncertainty information **improved decision quality** overall. Participants given only decision recommendations did no better than those given deterministic forecasts — [LeClerc & Joslyn, AMS 2011 abstract](https://ams.confex.com/ams/91Annual/webprogram/Paper182589.html); [Joslyn group dissertation, UW](https://digital.lib.washington.edu/researchworks/items/5005f5c9-f791-4882-84fd-5ec28581d181/full) (lab studies)
- With probabilistic information, people came closer to the optimal decision standard, though they didn't fully reach it. Adding explicit uncertainty preserves trust better than reducing false alarms — [Use and Communication of Probabilistic Forecasts (arXiv 1408.4812)](https://arxiv.org/pdf/1408.4812), citing Joslyn & LeClerc and LeClerc & Joslyn 2015 ("cry wolf", Risk Analysis)
- An uncertainty estimate may soften the loss of trust caused by inconsistent forecasts, for example sources disagreeing or forecasts changing between runs — Burgeno & Joslyn, cited in [arXiv 1408.4812](https://arxiv.org/pdf/1408.4812)
- Exceedance should weigh both probability and margin — [UN Ocean Prediction wiki](https://unoceanprediction.org/resources/wiki/chapters/380). Ensemble exceedance is computed as the share of members above the threshold — [NOAA GWES](https://ocean.weather.gov/gwes_explain.php)
- Partition-based surf height (the top-2 energetic swell partitions at the spot) is an industry approach — [Surf Captain 2020](https://surfcaptain.com/blog/1/understand-the-surf-height-forecast). Periods under ~9 s are mostly local wind sea and less likely to produce good surf — [Surf-forecast.com FAQ](https://www.surf-forecast.com/pages/faq)

### Inferences (design options for the app, ranked)
1. **Range vs limit with three outcomes, not one.** Build low/central/high for the spot from the spread across sources and lead-time widening. Then:
   - If low > limit + margin: exclude, or show as "too big" with high confidence.
   - If high ≤ limit: no penalty.
   - Otherwise: keep the spot, apply a penalty and show "might be bigger than you like (1.8–2.6 m, sources disagree)".
2. **Soft penalty scaled by exceedance probability and margin.** For example, penalty = w · P(size > limit) · min(1, excess/limit), with P taken from the share of sources or members above the limit. This directly follows the "probability plus margin" practice.
3. **Confidence-weighted blending of size signals.** When computed spot heights are unreliable (large disagreement, or Hs dominated by short-period wind sea), shift weight to the **swell-based estimate**: the primary swell partition's height, period and direction against the spot window, or energy (∝H²T) in the window. Combined Hs stays a secondary signal.
4. **Express the user's limit in energy, or as a period-dependent height,** calibrated from logged sessions (surf-forecast's "note kJ on your biggest comfortable day" approach). This fits a surf-journal app well.
5. **Show the uncertainty to the user.** Research says this raises trust and improves decisions more than a bare ranking does. Asymmetric safety risk argues for keeping a hard exclusion only for confident, large exceedances.

### Gaps
- No surf-specific study was found on uncertainty communication or on soft and hard filtering for size limits. The decision-science evidence comes from general weather lab studies.
- No published thresholds were found for how much source disagreement should count as "unreliable". These would need tuning against the user's own logged sessions.
