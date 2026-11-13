import type { Peak, SpotGuide } from '../types';

/**
 * Spot guides for the built-in northern Fuerteventura spots: peaks, season, boards, paddling
 * in and out, warnings, parking, facilities and freely licensed Wikimedia Commons photos.
 * Compiled from public surf guides (see each guide's sources) and written in our own words.
 * Generated from research notes; edit here or in the app's spot editor.
 */
export const SPOT_GUIDES: Record<string, { peaks: Peak[]; guide: SpotGuide }> = {
  "fv-rocky-point": {
    "peaks": [
      {
        "id": "inside",
        "name": "Inside",
        "description": "The closer-in reef, ridden by surf schools on small days. A right-hand wall that can get hollow in sections, plus a softer left.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "left and right",
        "level": "all",
        "goodWhen": "Mid to high tide on a N–NW swell with a light S–SW wind."
      },
      {
        "id": "outside",
        "name": "Outside (Bajo del Medio)",
        "description": "Further out, it needs serious size to break. Usually a long, mellow wall popular with longboards and SUPs, but heavy and hollow when really big.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "left and right",
        "level": "advanced",
        "goodWhen": "Only on big N–NW swells (when the North Shore is maxed out), with little or S–SE wind."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        11,
        12
      ],
      "seasonNote": "Winter N–NW swells; often the go-to when the North Shore is too big. Summer is mostly flat.",
      "boards": [
        "shortboard",
        "longboard on the left and the outside"
      ],
      "access": {
        "paddleOut": "Enter from the side of the reef rather than walking straight across it; one local tip is the access off Calle Poris.",
        "paddleIn": "Come back in at the side too, to avoid a long walk over the reef.",
        "easier": "High tide, when there is water over the reef shelf.",
        "harder": "Low tide (long, sharp walk over the reef); the outside paddle is long when it's big."
      },
      "warnings": [
        "long, sharp reef walk at low tide – wear booties",
        "shallow reef sections at low tide",
        "crowded when it's good",
        "heavy wipeouts on the outside when it's really big"
      ],
      "parking": "In town: there are public car parks near Punta Elena (Avenida Grandes Playas). Most people simply walk from the centre (5–15 min).",
      "facilities": [
        "in Corralejo town – bars and restaurants on the seafront",
        "surf shops and schools in town",
        "Punta Elena bar right by the break"
      ],
      "photos": [
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/Corralejo_February_2016-9203_-_panoramio.jpg/1280px-Corralejo_February_2016-9203_-_panoramio.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Corralejo_February_2016-9203_-_panoramio.jpg",
          "author": "Bengt Nyman",
          "license": "CC BY 3.0",
          "caption": "Reef shelf near Punta Elena, looking north across Corralejo bay to the town and harbour (wide panorama)."
        }
      ],
      "sources": [
        "https://www.fuerteventuraplayas.com/en/?p=8341",
        "https://www.fuerteventuraplayas.com/en/?p=7817",
        "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/rocky_point/index.html",
        "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/rocky_point_outside/index.html",
        "https://vvanat.fr/blog/carte-spot-surf-corralejo/",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://thesurfatlas.com/surfing-in-canary-islands/corralejo-surf/",
        "https://thesurfatlas.com/surfing-in-canary-islands/fuerteventura-surf/",
        "https://pt.surf-forecast.com/breaks/Rocky-Point_Bajodel-Medio",
        "https://www.openstreetmap.org/",
        "https://commons.wikimedia.org/wiki/File:Corralejo_February_2016-9203_-_panoramio.jpg"
      ]
    }
  },
  "fv-el-muelle": {
    "peaks": [
      {
        "id": "main",
        "name": "Harbour Wall",
        "description": "A powerful, ledgy left beside the harbour wall with several take-off zones. Inside and outside sections can link up on a solid NW swell.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "left",
        "level": "advanced",
        "goodWhen": "Low to mid tide on a NW–W swell of about 1.5–3 m, with SW (offshore) wind."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        4,
        10,
        11,
        12
      ],
      "seasonNote": "Autumn and winter swells; usually flat in summer.",
      "boards": [
        "shortboard on the inside",
        "longboard on the outside section"
      ],
      "access": {
        "paddleOut": "Walk along the seafront to the north side of the harbour by the boat ramp – the break is right there.",
        "paddleIn": "Back in by the same spot; mind the boat ramp, which appears suddenly at the end of the ride.",
        "easier": "Low to mid tide on a moderate swell.",
        "harder": "High tide, when waves break dangerously onto the shallow reef."
      },
      "warnings": [
        "shallow, sharp reef and rocks",
        "slabby, critical take-offs",
        "boat ramp at the end of the wave",
        "crowded at weekends"
      ],
      "parking": "Free public car parks around Corralejo harbour, a few minutes' walk from the break.",
      "facilities": [
        "cafés and restaurants overlooking the break",
        "public toilets at the harbour (daytime)",
        "surf shops and schools in Corralejo",
        "in town – no walk needed"
      ],
      "photos": [
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Surfer_%288239465594%29.jpg/1280px-Surfer_%288239465594%29.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Surfer_(8239465594).jpg",
          "author": "Andy Mitchell",
          "license": "CC BY-SA 2.0",
          "caption": "A surfer on a reef wave off the seafront just north-west of Corralejo harbour, November 2012."
        }
      ],
      "sources": [
        "https://www.fuerteventuraplayas.com/en/?p=7858",
        "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/el_muelle/index.html",
        "https://www.surf-forecast.com/breaks/El-Muelle",
        "https://vvanat.fr/blog/carte-spot-surf-corralejo/",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://thesurfatlas.com/surfing-in-canary-islands/fuerteventura-surf/",
        "https://www.openstreetmap.org/",
        "https://commons.wikimedia.org/wiki/File:Surfer_(8239465594).jpg"
      ]
    }
  },
  "fv-bristol": {
    "peaks": [
      {
        "id": "main",
        "name": "Bristol / Shooting Gallery",
        "description": "A fast, tubing left over volcanic reef, with a shorter right. Steep and tricky at low tide, smoother as the tide fills in.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "left and right",
        "level": "advanced",
        "goodWhen": "Mid to high tide on a NW–N swell of about 1–2.5 m, with S–SE (offshore) wind."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        10,
        11,
        12
      ],
      "seasonNote": "Best in autumn and winter; can get waves year-round but summer is often flat.",
      "boards": [
        "bodyboard (popular here)"
      ],
      "access": {
        "paddleOut": "Several easy entry points along the rocks; a short paddle to the line-up.",
        "paddleIn": "On big days, come in at the end of the wave where there is a small bay.",
        "easier": "Mid to high tide in small to medium swell.",
        "harder": "Low tide (steep, shallow take-off) and big swells, when strong currents run."
      },
      "warnings": [
        "very shallow lava reef",
        "strong currents on big days",
        "locals and crowds when it's on",
        "fast, steep take-off at low tide"
      ],
      "parking": "Park close by at the western edge of Corralejo, near the wind turbines where the North Shore dirt track starts.",
      "facilities": [
        "no services at the break",
        "cafés, shops and surf shops in Corralejo, a short drive or walk east"
      ],
      "photos": [
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Corralejo_2023-09-06-2.jpg/1280px-Corralejo_2023-09-06-2.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Corralejo_2023-09-06-2.jpg",
          "author": "Alexey Komarov",
          "license": "CC BY-SA 4.0",
          "caption": "Whitewater over the lava reef at Bristol, looking across to the Corralejo seafront."
        },
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/Corralejo_2023-09-06-1.jpg/1280px-Corralejo_2023-09-06-1.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Corralejo_2023-09-06-1.jpg",
          "author": "Alexey Komarov",
          "license": "CC BY-SA 4.0",
          "caption": "Lava coast just west of Bristol, with the wind turbines and Corralejo behind."
        }
      ],
      "sources": [
        "https://www.fuerteventuraplayas.com/en/?p=8039",
        "https://www.hellocanaryislands.com/windsurfing/fuerteventura/surf-in-bristol-shooting-gallery/",
        "https://www.hellocanaryislands.com/bodyboarding/fuerteventura/bodyboarding-at-bristol-shooting-gallery/",
        "https://www.surf-forecast.com/breaks/Shooting-Gallery",
        "https://www.puresurfcamps.com/en/blog/fuerteventura-surf-guide/",
        "https://vvanat.fr/blog/carte-spot-surf-corralejo/",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://thesurfatlas.com/surfing-in-canary-islands/fuerteventura-surf/",
        "https://www.openstreetmap.org/",
        "https://commons.wikimedia.org/wiki/File:Corralejo_2023-09-06-2.jpg",
        "https://commons.wikimedia.org/wiki/File:Corralejo_2023-09-06-1.jpg"
      ]
    }
  },
  "fv-mejillones": {
    "peaks": [
      {
        "id": "main",
        "name": "Mejillones",
        "description": "One of the island's heavy big-wave reefs: hollow, fast and powerful, with long rides on its best days. Only wakes up on large winter swells.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "left and right",
        "level": "expert",
        "goodWhen": "Big NW swell (roughly 2 m+) with light S–SE wind; most guides say it handles any tide."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        11,
        12
      ],
      "seasonNote": "Needs large NW winter swells; rarely breaks otherwise and is flat in summer.",
      "boards": [
        "gun / big-wave board"
      ],
      "access": {
        "harder": "Big swells: rips and undertow, and it looks much smaller from shore than it is."
      },
      "warnings": [
        "experts only – big, powerful reef wave",
        "sea urchins",
        "rips and undertow",
        "sharp rocks",
        "waves look smaller from the beach"
      ],
      "parking": "Small parking area by Playa del Mejillón (Popcorn Beach) off the North Shore dirt track; under 5 minutes' walk.",
      "facilities": [
        "no facilities – bring water",
        "nearest cafés and surf shops in Corralejo, about 5 km east"
      ],
      "photos": [
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/Punta_Gorda_desde_el_Mejillon.jpg/1280px-Punta_Gorda_desde_el_Mejillon.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Punta_Gorda_desde_el_Mejillon.jpg",
          "author": "Josi",
          "license": "CC BY-SA 4.0",
          "caption": "Sign at Playa del Mejillón (Popcorn Beach) with the reef coast and surf behind."
        },
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/Fuerteventura_-_Punta_Lala_beach_%2825314990523%29.jpg/1280px-Fuerteventura_-_Punta_Lala_beach_%2825314990523%29.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Fuerteventura_-_Punta_Lala_beach_(25314990523).jpg",
          "author": "Paul Stephenson",
          "license": "CC BY 2.0",
          "caption": "The white 'popcorn' beach next to the reef, with waves breaking offshore."
        }
      ],
      "sources": [
        "https://www.fuerteventuraplayas.com/en/?p=7874",
        "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/mejillones/index.html",
        "https://www.surf-forecast.com/breaks/Mejillones",
        "https://www.openstreetmap.org/",
        "https://commons.wikimedia.org/wiki/File:Punta_Gorda_desde_el_Mejillon.jpg",
        "https://commons.wikimedia.org/wiki/File:Fuerteventura_-_Punta_Lala_beach_(25314990523).jpg"
      ]
    }
  },
  "fv-generoso": {
    "peaks": [
      {
        "id": "main",
        "name": "Generoso",
        "description": "A smooth but punchy left over lava reef. Some guides rate it for all levels, but the rocky access and currents make it more demanding.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "left",
        "level": "intermediate",
        "goodWhen": "High tide on a NW–N swell of about 1–3 m, with S–SW (offshore) wind."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        11,
        12
      ],
      "seasonNote": "Autumn and winter; mostly flat in summer.",
      "access": {
        "paddleOut": "No beach: climb down the rocky bank, paddle out from the right, then move across to the line-up on the left.",
        "paddleIn": "Back over the rocks the same way; jumping off the point is possible but risky.",
        "easier": "High tide, with more water over the reef.",
        "harder": "Low tide (shallow reef) and bigger swells with current."
      },
      "warnings": [
        "rocky entry and exit",
        "currents",
        "shallow reef – check the depth",
        "sea urchins"
      ],
      "parking": "Follow the North Shore dirt track past the power station/wind turbines and park in the natural lot above the shore. Don't leave valuables – break-ins reported.",
      "facilities": [
        "no facilities",
        "nearest cafés and shops in Corralejo, about 3 km"
      ],
      "photos": [
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Lobos_Island_seen_from_Fuerteventura_2023-09-06-1.jpg/1280px-Lobos_Island_seen_from_Fuerteventura_2023-09-06-1.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Lobos_Island_seen_from_Fuerteventura_2023-09-06-1.jpg",
          "author": "Alexey Komarov",
          "license": "CC BY-SA 4.0",
          "caption": "Lava reef and surf on the coast around Generoso, with Isla de Lobos behind."
        },
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Rocas_de_Punta_Gorda.jpg/1280px-Rocas_de_Punta_Gorda.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Rocas_de_Punta_Gorda.jpg",
          "author": "Josi",
          "license": "CC BY-SA 4.0",
          "caption": "Rocky foreshore at Punta Gorda, in the Generoso area, looking out toward Lanzarote."
        }
      ],
      "sources": [
        "https://www.fuerteventuraplayas.com/en/spot/generoso-surf-spot/",
        "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/la_hennerosa/index.html",
        "https://www.surf-forecast.com/breaks/Genarosa",
        "https://www.verplayas.com/?p=27023",
        "https://vvanat.fr/blog/carte-spot-surf-corralejo/",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://www.openstreetmap.org/",
        "https://commons.wikimedia.org/wiki/File:Lobos_Island_seen_from_Fuerteventura_2023-09-06-1.jpg",
        "https://commons.wikimedia.org/wiki/File:Rocas_de_Punta_Gorda.jpg"
      ]
    }
  },
  "fv-suicides": {
    "peaks": [
      {
        "id": "main",
        "name": "Main reef",
        "description": "Fast, hollow and powerful over sharp lava, breaking close to rocks. Mostly rights (surf-forecast), with a left section too (Wannasurf). Rides are short, about 50–150 m.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "right and left",
        "level": "expert",
        "goodWhen": "Mid to high tide on a NW–NNW swell with S–SE (offshore) wind."
      },
      {
        "id": "inside-left",
        "name": "Inside left",
        "description": "The less risky of the two sections, though still shallow lava with rocks close by.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "left",
        "level": "advanced",
        "goodWhen": "Mid to high tide on a NW swell with S–SE wind."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        11,
        12
      ],
      "seasonNote": "Winter NW swells; mostly flat in summer.",
      "boards": [
        "shortboard",
        "step-up on bigger days",
        "bodyboard (popular with locals)"
      ],
      "access": {
        "paddleOut": "From the lava shelf straight onto the reef; on bigger swells even getting into the water is hard.",
        "paddleIn": "Wait for a lull and come in where you went out: rocks sit close to both sections.",
        "easier": "Mid to high tide, with more water over the reef.",
        "harder": "Low tide and big swells."
      },
      "warnings": [
        "experts only",
        "sharp, shallow lava reef",
        "rocks close to both sections",
        "rips and undertow",
        "respect the locals, bodyboarders included"
      ],
      "parking": "Take the North Shore dirt track west from Corralejo to the lava field by the coast, then under 5 minutes on foot. Don't leave valuables in the car.",
      "facilities": [
        "no facilities",
        "nearest cafés and shops in Corralejo, about 3–4 km"
      ],
      "sources": [
        "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/suicidios/index.html",
        "https://www.surf-forecast.com/breaks/Suicides_2",
        "https://www.surf-forecast.com/regions/Fuerteventura",
        "https://www.openstreetmap.org/"
      ]
    }
  },
  "fv-la-caleta": {
    "peaks": [
      {
        "id": "main",
        "name": "La Caleta",
        "description": "A reef in a small bay with quick lefts and a surfable right peak. Softer and slower at high tide, and surf schools use it.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "left and right",
        "level": "intermediate",
        "goodWhen": "Mid to high rising tide on a NW–N swell of about 1.5–3 m, with S–SE wind."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        11,
        12
      ],
      "seasonNote": "Most consistent from November to March; one of the more reliable North Shore reefs.",
      "boards": [
        "shortboard",
        "mid-length",
        "longboard"
      ],
      "access": {
        "easier": "Mid to high tide, ideally on the push.",
        "harder": "Low tide and bigger swells, when rips run across the reef."
      },
      "warnings": [
        "rips",
        "rocks and flat reef",
        "crowded, with surf schools"
      ],
      "parking": "Reached by the North Shore dirt track a few minutes east of Majanicho; park above the bay. One guide recommends a 4x4.",
      "facilities": [
        "no facilities",
        "nearest cafés and surf shops in Corralejo"
      ],
      "sources": [
        "https://www.fuerteventuraplayas.com/en/?p=7880",
        "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/Caletta/index.html",
        "https://www.mondo.surf/surf-spot/caleta/guide/1525",
        "https://vvanat.fr/blog/carte-spot-surf-corralejo/",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://thesurfatlas.com/surfing-in-canary-islands/fuerteventura-surf/",
        "https://www.openstreetmap.org/"
      ]
    }
  },
  "fv-majanicho": {
    "peaks": [
      {
        "id": "inside-a",
        "name": "Inside A-frame",
        "description": "Gentle A-frame in the middle of the bay that only wakes up on large swells. A good big-board backup on stormy days.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "left and right",
        "level": "intermediate",
        "goodWhen": "Mid to high tide when a big N–NW swell (overhead+ outside) makes the open north-shore spots too big; light S–SE wind."
      },
      {
        "id": "inside-right",
        "name": "Inside right",
        "description": "Short, fairly quick right over shallow volcanic reef off the point by the village. Rides are short but currents are mild.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "right",
        "level": "intermediate",
        "goodWhen": "Rising tide with a NW swell up to about head high and no wind."
      },
      {
        "id": "outside",
        "name": "Outside",
        "description": "Longer right at the entrance of the bay, popular with longboarders and SUPs. Gets noticeably bigger and more current-prone as the swell builds.",
        "breakType": "point",
        "bottom": "reef",
        "direction": "right",
        "level": "intermediate",
        "goodWhen": "Works on most tides with a N–NW–W swell from waist to just over head high and E–SE wind."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        10,
        11,
        12
      ],
      "seasonNote": "Best October–March when N–NW groundswells arrive; summer is usually small and windy.",
      "boards": [
        "Longboard or mid-length for the outside and A-frame",
        "Shortboard or fish for the inside right",
        "SUP on the outside"
      ],
      "access": {
        "paddleOut": "Walk out from the village; use the channel beside the right. The outside at the bay entrance is a 10+ min paddle.",
        "paddleIn": "Come back over the reef carefully – booties help.",
        "easier": "Small to medium swell, rising tide and little wind; currents inside the bay are usually weak.",
        "harder": "Above ~1.5 m the outside gets bigger and currents strengthen; the incoming water pushes you back on the paddle out."
      },
      "warnings": [
        "sea urchins",
        "reef walk in and out",
        "large rock under the A-frame (visible at low tide)",
        "currents on bigger days",
        "crowded with locals on good days",
        "kiters and windsurfers on east-wind days",
        "no lifeguards"
      ],
      "parking": "Paved road north from Lajares to the village, with free parking near the sea and along the coast east of the houses. The coastal dirt track from Corralejo is rough.",
      "facilities": [
        "No surf shop or lifeguard",
        "A few holiday cabins in the hamlet",
        "Café Bar El Perdido ~1.5 km west towards El Hierro (OSM)",
        "Shops and surf schools in Corralejo (~15–20 min) or Lajares"
      ],
      "photos": [
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Majanicho_2023-09-06.jpg/1280px-Majanicho_2023-09-06.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Majanicho_2023-09-06.jpg",
          "author": "Alexey Komarov",
          "license": "CC BY-SA 4.0",
          "caption": "Majanicho hamlet and its reef-lined bay"
        },
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/El_Majanicho.jpg/1280px-El_Majanicho.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:El_Majanicho.jpg",
          "author": "Josi",
          "license": "CC BY-SA 4.0",
          "caption": "Majanicho bay at low tide with the exposed volcanic reef"
        }
      ],
      "sources": [
        "https://www.fuerteventuraplayas.com/en/spot/majanicho-inside/",
        "https://www.fuerteventuraplayas.com/en/spot/majanicho-outside/",
        "http://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/majanicho/",
        "https://thesurfatlas.com/surfing-in-canary-islands/majanicho/",
        "https://vvanat.fr/blog/carte-spot-surf-corralejo/",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://www.surf-forecast.com/breaks/Majanicho",
        "https://www.puresurfcamps.com/en/blog/fuerteventura-surf-guide/",
        "https://www.openstreetmap.org/"
      ]
    }
  },
  "fv-el-hierro": {
    "peaks": [
      {
        "id": "derecha",
        "name": "Derecha de los Alemanes",
        "description": "Right-hander with fast and softer sections that can barrel. Needs more swell than the left to work well.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "right",
        "level": "advanced",
        "goodWhen": "Best at low tide (surfable on all tides) in a medium N–NW swell of about 1–3 m with S–SE wind."
      },
      {
        "id": "izquierda",
        "name": "La Izquierda",
        "description": "Long, fast and powerful left over volcanic reef with tube sections on the bigger winter swells. The main wave here and very popular.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "left",
        "level": "advanced",
        "goodWhen": "All tides with a N–NW swell from about 1 m up, and S–SE wind."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        10,
        11,
        12
      ],
      "seasonNote": "Winter groundswell season (roughly Oct–Mar, often best around December); summer is mostly flat.",
      "boards": [
        "Shortboard"
      ],
      "access": {
        "paddleOut": "Enter at the small tidal pool in the bay (locals use the rocky ridge just right of it). Aim for the middle of the bay – the current drags you left into a small cove.",
        "paddleIn": "Let the whitewater carry you in on the east side of the bay; avoid the cove on the left, which fills with rotting seaweed.",
        "easier": "Medium swell with light S–SE wind.",
        "harder": "Bigger swells strengthen the current; N or NW wind makes the right mushy."
      },
      "warnings": [
        "sea urchins – wear booties",
        "shallow volcanic reef",
        "currents and rips",
        "crowds and localism on good days",
        "right can close out"
      ],
      "parking": "Drive to Majanicho, then 3–4 min west on the unpaved coast track; cars can be left close to the break. A hire car is essentially needed.",
      "facilities": [
        "Nothing at the break, no lifeguard",
        "Café Bar El Perdido a short walk inland (OSM; check hours)",
        "Shops and surf schools in Corralejo, Lajares or El Cotillo"
      ],
      "sources": [
        "https://www.fuerteventuraplayas.com/en/spot/derecha-de-los-alemanes/",
        "https://www.fuerteventuraplayas.com/en/spot/izquiera-del-hierro/",
        "http://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/derecha_de_los_alemanes/",
        "http://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/hierro_left/",
        "https://www.hellocanaryislands.com/surfing/fuerteventura/surfing-at-el-hierro/",
        "https://thesurfatlas.com/?p=4307",
        "https://vvanat.fr/blog/carte-spot-surf-corralejo/",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://www.surf-forecast.com/breaks/Heirro_Derechadelos-Alemanes",
        "https://www.openstreetmap.org/"
      ]
    }
  },
  "fv-the-bubble": {
    "peaks": [
      {
        "id": "main",
        "name": "The Bubble",
        "description": "Hollow, fast A-frame with sucking barrels both ways over very shallow volcanic reef. Short rides, high consequences.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "left and right",
        "level": "expert",
        "goodWhen": "Mid to high tide with a solid N–NW swell (bigger than El Hierro needs) and light S–SE offshore wind."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        10,
        11,
        12
      ],
      "seasonNote": "Winter only in practice – needs a solid N–NW groundswell; summer is mostly flat.",
      "boards": [
        "Shortboard"
      ],
      "access": {
        "easier": "Mid tide with a moderate swell and light E–SE wind.",
        "harder": "Low tide and big swells: very shallow reef, strong currents and wipeouts onto rock."
      },
      "warnings": [
        "very shallow volcanic reef",
        "heavy wipeouts",
        "strong currents",
        "crowded with tight-knit locals, especially weekends"
      ],
      "parking": "On the unpaved north-shore track just west of El Hierro / Majanicho; no formal car park.",
      "facilities": [
        "No facilities or lifeguard",
        "Café Bar El Perdido near El Hierro (OSM)",
        "Shops in Corralejo, Lajares or El Cotillo"
      ],
      "sources": [
        "http://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/the_bubble/",
        "https://www.surf-forecast.com/breaks/The-Bubble",
        "https://vvanat.fr/blog/carte-spot-surf-corralejo/",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://www.puresurfcamps.com/en/blog/fuerteventura-surf-guide/",
        "https://thesurfatlas.com/surfing-in-canary-islands/fuerteventura-surf/",
        "https://surfnerd.com/surf-forecast/the-bubble-hierro-right"
      ]
    }
  },
  "fv-punta-blanca": {
    "peaks": [
      {
        "id": "outside",
        "name": "Outside reef",
        "description": "Fairly soft reef A-frame well offshore; the lefts are shorter and fade into a paddling channel. Gets powerful on larger swells.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "left and right",
        "level": "intermediate",
        "goodWhen": "Any tide with a W–NW–N swell and E, SE or S offshore wind."
      },
      {
        "id": "inside",
        "name": "Inside reform",
        "description": "Smaller waves reforming over shallower reef nearer the shore – a practice zone for improvers.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "left and right",
        "level": "all",
        "goodWhen": "When outside waves reform closer in on smaller to medium swells; shallow reef, so watch the tide."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        10,
        11,
        12
      ],
      "seasonNote": "Best in the Oct–Mar swell season; the sheltered cove can still offer small waves at other times.",
      "boards": [
        "Shortboard or fish",
        "Mid-length on smaller days"
      ],
      "access": {
        "paddleOut": "Waves break far from shore, so expect a long paddle. The rip on the left side can take you to the line-up.",
        "easier": "Small to medium swell with E–SE offshore wind.",
        "harder": "Bigger swells – the rip on the left gets very strong."
      },
      "warnings": [
        "long paddle",
        "strong rip",
        "rocky, stony bottom",
        "sea urchins"
      ],
      "parking": "Reached by a rough dirt track west of Majanicho (about 15 min), passing El Hierro and The Bubble; park on the track near the point.",
      "facilities": [
        "No facilities or lifeguard",
        "Nearest cafés and shops in El Cotillo"
      ],
      "sources": [
        "https://www.fuerteventuraplayas.com/en/spot/punta-blanca/",
        "http://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/punta_blanca/",
        "https://thesurfatlas.com/surfing-in-canary-islands/fuerteventura-surf/",
        "https://vvanat.fr/blog/carte-spot-surf-corralejo/",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://nominatim.openstreetmap.org/"
      ]
    }
  },
  "fv-lobos": {
    "peaks": [
      {
        "id": "top",
        "name": "Top of the point",
        "description": "Fairly easy take-off into a long open wall – the start of a right that can link for several hundred metres.",
        "breakType": "point",
        "bottom": "reef",
        "direction": "right",
        "level": "advanced",
        "goodWhen": "NW swell from about 1 m up, low to mid tide (most guides), light E–SE offshore wind."
      },
      {
        "id": "inside",
        "name": "Inside section",
        "description": "Fast, hollow tube sections close to the cliff over very shallow reef; the last section may close out.",
        "breakType": "point",
        "bottom": "reef",
        "direction": "right",
        "level": "expert",
        "goodWhen": "Same NW swell and E–SE wind; more water (mid tide) helps over the shallow reef."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        10,
        11,
        12
      ],
      "seasonNote": "Needs a solid NW groundswell, mostly October–March; summer is usually flat.",
      "boards": [
        "Shortboard",
        "Step-up for bigger days"
      ],
      "access": {
        "paddleOut": "From the Lobos jetty walk 20–60 min (sources differ) to the NW side under Montaña La Caldera, then paddle out off the rocks – booties essential.",
        "paddleIn": "Long walk/paddle back up the point after each ride; exit over the volcanic reef.",
        "easier": "Head-high, clean NW swell with E–SE offshore wind.",
        "harder": "Big swells and low tide on the shallow inside; help is far away, and missing the last boat strands you."
      },
      "warnings": [
        "free LobosPass permit required",
        "last ferry back",
        "shallow inside section near the cliff",
        "sea urchins",
        "strong currents",
        "crowds and localism",
        "remote – no help nearby"
      ],
      "parking": "No car access on Lobos. Ferries (2 operators, ~15–20 min) leave Corralejo harbour from about 10:00; last return roughly 17:00 in winter, 18:00 in summer. Surfboards allowed depending on the operator.",
      "facilities": [
        "Free LobosPass permit from the Cabildo: morning or afternoon slot, max ~4 h, limited places – book online a few days ahead",
        "Visitor centre and toilets at the jetty",
        "Small restaurant at El Puertito (book ahead)",
        "No shops – bring water, food and sunscreen",
        "No lifeguard"
      ],
      "photos": [
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Islote_de_Lobos%2C_paisaje_volc%C3%A1nico%2C_Caldera_de_Lobos_Visible%2C_Coralejo_en_el_fondo.jpg/1280px-Islote_de_Lobos%2C_paisaje_volc%C3%A1nico%2C_Caldera_de_Lobos_Visible%2C_Coralejo_en_el_fondo.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Islote_de_Lobos,_paisaje_volc%C3%A1nico,_Caldera_de_Lobos_Visible,_Coralejo_en_el_fondo.jpg",
          "author": "Tamara Kulikova",
          "license": "CC BY-SA 4.0",
          "caption": "Lobos coastline with Montaña La Caldera, whose base the point wraps around; Fuerteventura behind"
        }
      ],
      "sources": [
        "http://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/los_lobos/",
        "https://www.fuerteventuraplayas.com/en/spot/lobos-island-surf-spot/",
        "https://www.visitfuerteventura.com/en/surfing/fuerteventura/surfing-at-los-lobos/",
        "https://www.worldbeachguide.com/spain/surf/los-lobos.htm",
        "https://thesurfatlas.com/surfing-in-canary-islands/corralejo-surf/",
        "https://www.surf-forecast.com/breaks/Los-Lobos",
        "https://vvanat.fr/blog/carte-spot-surf-corralejo/",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://www.puresurfcamps.com/en/blog/fuerteventura-surf-guide/",
        "https://www.ferryhopper.com/es/ferries/spain/isla-de-lobos",
        "https://www.barcelo.com/guia-turismo/en/spain/fuerteventura/things-to-do/island-of-lobos/",
        "https://www.openstreetmap.org/"
      ]
    }
  },
  "fv-flag-beach": {
    "peaks": [
      {
        "id": "main",
        "name": "Flag Beach",
        "description": "Long, mellow beach break with shifting peaks over sand and patches of reef. A go-to for Corralejo surf schools when the wind allows.",
        "breakType": "beach",
        "bottom": "mixed",
        "direction": "left and right",
        "level": "beginner",
        "goodWhen": "A solid N–NW swell of about 1–2 m, mid to high rising tide, and light or westerly wind."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        10,
        11,
        12
      ],
      "seasonNote": "Needs a big N–NW winter swell to wrap in; in the windy summer months it is mostly a kite and windsurf beach.",
      "boards": [
        "Soft-top or foam board for learning",
        "Longboard or mid-length"
      ],
      "access": {
        "paddleOut": "Easy entry straight off the sand.",
        "paddleIn": "Straight back to the beach; watch for rocks at low tide.",
        "easier": "Mid to high, rising tide with small swell and light wind.",
        "harder": "Low tide exposes volcanic rocks; winter shore break can make entry tricky; strong trade winds chop it up."
      },
      "warnings": [
        "volcanic rocks at low tide – booties advised",
        "kitesurfers and windsurfers",
        "often wind-blown",
        "no surfing in the bathing area in front of the hotels"
      ],
      "parking": "Free car park and roadside parking off the FV-1 next to the dunes, just south of Corralejo; can fill up in peak season.",
      "facilities": [
        "Kite/windsurf centres with board hire",
        "Surf schools in nearby Corralejo use the beach",
        "Snack bar behind the dunes",
        "Lifeguard reported by one guide – don't rely on it",
        "Corralejo town ~2 km"
      ],
      "photos": [
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Flag_Beach_%28Kite_Beach%29_Corralejo_Fuerteventura_%2834053382055%29.jpg/1280px-Flag_Beach_%28Kite_Beach%29_Corralejo_Fuerteventura_%2834053382055%29.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Flag_Beach_(Kite_Beach)_Corralejo_Fuerteventura_(34053382055).jpg",
          "author": "Thomas Tolkien",
          "license": "CC BY 2.0",
          "caption": "Small waves and kiters at Flag Beach"
        },
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/Kite_surfing_on_flag_beach_%282855443579%29.jpg/1280px-Kite_surfing_on_flag_beach_%282855443579%29.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Kite_surfing_on_flag_beach_(2855443579).jpg",
          "author": "Andy Mitchell",
          "license": "CC BY-SA 2.0",
          "caption": "Kiters off Flag Beach, with dune scrub in the foreground"
        }
      ],
      "sources": [
        "https://surfnerd.com/surf-forecast/flag-beach",
        "https://www.fuerteventuraplayas.com/en/spot/flag-beach-kite-beach/",
        "https://thesurfatlas.com/surfing-in-canary-islands/corralejo-surf/",
        "https://thesurfatlas.com/?p=20116",
        "https://www.hellocanaryislands.com/windsurfing/fuerteventura/windsurfing-at-flag-beach-in-corralejo/",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://www.openstreetmap.org/"
      ]
    }
  },
  "fv-esquinzo": {
    "peaks": [
      {
        "id": "main",
        "name": "Esquinzo",
        "description": "Punchy, exposed beach break in a cliff-lined bay with shifting peaks over sand and rock, often favouring lefts. Fast walls when small; powerful and closey when big, so best for experienced surfers.",
        "breakType": "beach",
        "bottom": "mixed",
        "direction": "left and right",
        "level": "intermediate",
        "goodWhen": "W to NW swell with light E–SE (offshore) wind; mid tide is a safe bet, as sources disagree on the best tide."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        10,
        11,
        12
      ],
      "seasonNote": "Best on autumn and winter W–NW swells; summer is often flat.",
      "boards": [
        "shortboard",
        "step-up on bigger days",
        "longboard on small clean days"
      ],
      "access": {
        "paddleOut": "Paddle out beside the big rock in the middle of the bay to skip most of the whitewater.",
        "easier": "Small, clean days with light offshore (easterly) wind.",
        "harder": "Big swells: heavy paddle-out, strong currents and close-outs."
      },
      "warnings": [
        "strong rips and currents",
        "close-outs on big days",
        "rocks and boulders on the beach",
        "steep cliff path",
        "crowded with surf schools at weekends"
      ],
      "parking": "Drive the rough dirt track south from El Cotillo (or in from Tindaya) and park on the clifftop plateau; a 4x4 or sturdy car is advised. Lock up: the car is out of sight from the beach.",
      "facilities": [
        "no facilities or lifeguard",
        "steep path down from the cliffs",
        "nearest cafés, shops and surf rentals in El Cotillo (about 6 km)"
      ],
      "photos": [
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/Playa_de_Esquinzo_-_panoramio.jpg/1280px-Playa_de_Esquinzo_-_panoramio.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Playa_de_Esquinzo_-_panoramio.jpg",
          "author": "Jarek Prokop",
          "license": "CC BY 3.0",
          "caption": "Playa de Esquinzo seen from the clifftop, with its sand and boulder beach"
        },
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Playa_de_Esquinzo_-_view_from_the_northern_cliff_-_panoramio.jpg/1280px-Playa_de_Esquinzo_-_view_from_the_northern_cliff_-_panoramio.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Playa_de_Esquinzo_-_view_from_the_northern_cliff_-_panoramio.jpg",
          "author": "Jarek Prokop",
          "license": "CC BY 3.0",
          "caption": "Viewpoint and sign above the bay, on the northern cliff"
        }
      ],
      "sources": [
        "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/playa_de_esquinzo/",
        "https://www.fuerteventuraplayas.com/en/spot/esquinzo-surf-spot/",
        "https://www.fuerteventuraplayas.com/en/?p=5309",
        "https://thesurfatlas.com/surfing-in-canary-islands/el-cotillo-surf/",
        "https://thesurfatlas.com/surfing-in-canary-islands/el-cotillo-beaches/",
        "https://www.surf-forecast.com/breaks/Playade-Esquinzo_1",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://www.openstreetmap.org/#map=16/28.6348/-14.0270"
      ]
    }
  },
  "fv-cotillo-piedra-playa": {
    "peaks": [
      {
        "id": "castillo",
        "name": "Playa del Castillo (north end)",
        "description": "More sheltered northern end near the castle where the headland acts a bit like a point, mostly giving rights. Gentle summer waves for schools; hollow or board-snapping close-outs on big days.",
        "breakType": "beach",
        "bottom": "sand",
        "direction": "right",
        "level": "all",
        "goodWhen": "Large N–W groundswell; the headland softens strong northerlies, so it is the pick when other peaks are blown out."
      },
      {
        "id": "piedra-peaks",
        "name": "Piedra Playa peaks (south)",
        "description": "More exposed southern stretch with shifting A-frame peaks over sand and patches of rock, usually a foot or two bigger than the north end. Punchy and hollow in winter, softer walls in summer.",
        "breakType": "beach",
        "bottom": "mixed",
        "direction": "left and right",
        "level": "intermediate",
        "goodWhen": "Mid to high tide on a W–NW swell with easterly (offshore) wind."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        4,
        9,
        10,
        11,
        12
      ],
      "seasonNote": "Works all year; autumn–winter brings size and power, summer is small and mellow for learners.",
      "boards": [
        "shortboard",
        "step-up for winter swells",
        "longboard or mid-length in summer",
        "soft-top for learners on small days"
      ],
      "access": {
        "paddleOut": "Rips help you out, but leave them early: they pull north toward the harbour.",
        "paddleIn": "Watch the incoming tide and rip, which can push you toward the rocks.",
        "easier": "Small swell (around 2–3 ft) at mid tide with light easterly wind.",
        "harder": "Big winter swells, when it closes out with heavy shore break."
      },
      "warnings": [
        "strong rips toward the harbour",
        "close-outs on big swells",
        "heavy shore break",
        "rocks underfoot in places",
        "beach drops quickly into deep water"
      ],
      "parking": "Follow the dirt road along the cliff tops just south of town, park above the beach and walk down a steep gravel path. Lock your car.",
      "facilities": [
        "no bars or sunbeds on the beach",
        "lifeguards in summer (about July–October)",
        "cafés, restaurants and surf shops in El Cotillo village (about 1 km)"
      ],
      "photos": [
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Cotillo_-_panoramio_-_brunobarbato.jpg/1280px-Cotillo_-_panoramio_-_brunobarbato.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Cotillo_-_panoramio_-_brunobarbato.jpg",
          "author": "brunobarbato",
          "license": "CC BY 3.0",
          "caption": "Surfers in the line-up on the beach south of El Cotillo"
        },
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Surfer_Strand_El_Cotillo_-_panoramio.jpg/1280px-Surfer_Strand_El_Cotillo_-_panoramio.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Surfer_Strand_El_Cotillo_-_panoramio.jpg",
          "author": "Stephan Czarnowski",
          "license": "CC BY-SA 3.0",
          "caption": "A wave pitching on El Cotillo's surf beach"
        }
      ],
      "sources": [
        "https://thesurfatlas.com/surfing-in-canary-islands/el-cotillo-surf/",
        "https://thesurfatlas.com/surfing-in-canary-islands/el-cotillo-beaches/",
        "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/cotillo_beach/",
        "https://www.fuerteventuraplayas.com/en/?p=7511",
        "https://www.guidetocanaryislands.com/piedra-playa-fuerteventura/",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://www.windsurf.co.uk/featured/boss-beach/4/",
        "https://www.openstreetmap.org/way/146783326"
      ]
    }
  },
  "fv-cotillo-spew-pits": {
    "peaks": [
      {
        "id": "main",
        "name": "Spew Pits",
        "description": "Heavy, hollow and fast slabby reef over sharp rock with short, powerful rides. A tube spot for chargers and bodyboarders; not a place to learn.",
        "breakType": "reef",
        "bottom": "reef",
        "direction": "left and right",
        "level": "expert",
        "goodWhen": "Big NW–NNW groundswell (from about 4–5 ft, holds 10 ft+) with easterly offshore wind."
      }
    ],
    "guide": {
      "season": [
        1,
        2,
        3,
        11,
        12
      ],
      "seasonNote": "Only wakes up on big midwinter NW swells; flat most of summer.",
      "boards": [
        "step-up shortboard",
        "bodyboard"
      ],
      "access": {
        "paddleOut": "Brutal paddle-out, since it only works when the swell is big.",
        "harder": "Any big day: shallow reef, strong rips and heavy sets."
      },
      "warnings": [
        "experts only",
        "shallow, sharp reef",
        "breaks boards",
        "huge rips",
        "helmet and booties advised"
      ],
      "parking": "No reliable parking info found; sources place the reef either just off El Cotillo harbour or north of town by the lagoons.",
      "facilities": [
        "no facilities at the break",
        "fish restaurants, cafés and surf shops in El Cotillo"
      ],
      "sources": [
        "https://thesurfatlas.com/surfing-in-canary-islands/el-cotillo-surf/",
        "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/spew_pits/index.html",
        "https://www.surf-forecast.com/breaks/Spew-Pits",
        "https://www.worldbeachguide.com/spain/surf/spew-pits.htm",
        "https://www.windsurf.co.uk/featured/boss-beach/4/"
      ]
    }
  },
  "fv-playa-los-matos": {
    "peaks": [
      {
        "id": "main",
        "name": "Playa los Matos",
        "description": "Open beach break in front of the dunes with shifting sandbar peaks, lefts and rights. Gentle on small days.",
        "breakType": "beach",
        "bottom": "sand",
        "direction": "left and right",
        "level": "all",
        "goodWhen": "Any tide on a N–NE swell with light W–SW (offshore) wind, ideally early before the NE trades."
      }
    ],
    "guide": {
      "season": [
        4,
        5,
        6,
        7,
        8,
        9
      ],
      "seasonNote": "Like the other dune beaches: mainly spring–summer N–NE swell; winter needs a big N–NW swell to wrap in.",
      "boards": [
        "soft-top",
        "longboard or mid-length",
        "fish on punchier days"
      ],
      "access": {
        "paddleOut": "Straight out from the sand between sets; there is no reef to cross.",
        "paddleIn": "Ride a wave in to the beach; watch the drift along the shore.",
        "easier": "Small days and mornings, before the trade wind gets up.",
        "harder": "Big N swells (heavy shorebreak, strong drift) and windy afternoons."
      },
      "warnings": [
        "shorebreak on bigger swells",
        "currents and drift along the beach",
        "NE trade winds blow it out in the afternoon"
      ],
      "parking": "Roadside parking along the FV-1 dune road; never drive onto the dunes.",
      "facilities": [
        "no cafés or toilets on the sand",
        "Corralejo town about 4–5 km north"
      ],
      "sources": [
        "https://www.surfline.com/surf-report/playa-los-matos/640b893a4878eb50bf195f71",
        "https://thesurfatlas.com/surfing-in-canary-islands/corralejo-surf/",
        "https://www.spain.info/es/playa/grandes-playas-corralejo/",
        "https://www.openstreetmap.org/"
      ]
    }
  },
  "fv-corralejo-beach": {
    "peaks": [
      {
        "id": "main",
        "name": "Corralejo Beach",
        "description": "The long Grandes Playas south of town: shifting sand peaks, lefts and rights. Friendly on small days; a heavy shorebreak when a big N swell wraps in.",
        "breakType": "beach",
        "bottom": "sand",
        "direction": "left and right",
        "level": "all",
        "goodWhen": "Any tide on a N–NE swell with light W–SW (offshore) wind, ideally early before the NE trades."
      }
    ],
    "guide": {
      "season": [
        4,
        5,
        6,
        7,
        8,
        9
      ],
      "seasonNote": "Like the other dune beaches: mainly spring–summer N–NE swell; winter needs a big N–NW swell to wrap in.",
      "boards": [
        "soft-top",
        "longboard or mid-length",
        "fish on punchier days"
      ],
      "access": {
        "paddleOut": "Straight out from the sand between sets; there is no reef to cross.",
        "paddleIn": "Ride a wave in to the beach; watch the drift along the shore.",
        "easier": "Small days and mornings, before the trade wind gets up.",
        "harder": "Big N swells (heavy shorebreak, strong drift) and windy afternoons."
      },
      "warnings": [
        "shorebreak on bigger swells",
        "currents and drift along the beach",
        "no lifeguard on most of the beach",
        "NE trade winds blow it out in the afternoon"
      ],
      "parking": "Parking along the FV-1 dune road; never drive onto the dunes.",
      "facilities": [
        "showers at the beach entrance",
        "sunbed and parasol hire at Bajo Negro, in front of the hotels",
        "Corralejo town about 4–5 km north"
      ],
      "sources": [
        "https://www.surfline.com/surf-report/corralejo-beach/584204204e65fad6a77096a4",
        "https://hellocanaryislands.com/beaches/fuerteventura/corralejo-beach",
        "https://thesurfatlas.com/surfing-in-canary-islands/corralejo-beaches/",
        "https://www.openstreetmap.org/"
      ]
    }
  },
  "fv-glass-beach": {
    "peaks": [
      {
        "id": "main",
        "name": "El Burro",
        "description": "Reef peak at the end of the dune beaches, breaking over rock hidden under sand with a longer left and a shorter right. Friendly on small days, but steeper and hollower as the swell grows.",
        "breakType": "reef",
        "bottom": "mixed",
        "direction": "left and right",
        "level": "all",
        "goodWhen": "Mid tide (hollower lower down) on a N–NE swell with light W–NW winds, ideally early before the wind gets up."
      }
    ],
    "guide": {
      "season": [
        4,
        5,
        6,
        7,
        8,
        9
      ],
      "seasonNote": "Mainly a spring–summer spot when N–NE swell reaches the east coast.",
      "boards": [
        "shortboard",
        "fish or hybrid on small days"
      ],
      "access": {
        "paddleOut": "Go out from the sand; the current can be strong, so pace yourself.",
        "paddleIn": "Come back in on the sandy part rather than over the urchin-covered rocks.",
        "easier": "Mornings before the wind, at mid tide.",
        "harder": "Windy afternoons with windsurfers and kiters out; lower tides over shallow reef."
      },
      "warnings": [
        "sea urchins",
        "rocky reef under the sand",
        "strong current",
        "windsurfers and kiters in afternoons",
        "crowded at weekends",
        "booties recommended"
      ],
      "parking": "Free roadside parking along the FV-1a through the dunes, just south of the big Corralejo hotels; short walk to the sand.",
      "facilities": [
        "lifeguard listed",
        "stone windbreak shelters on the beach",
        "Corralejo town with cafés, surf shops and rentals about 5 km north"
      ],
      "photos": [
        {
          "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Solo_onde_%28Only_waves%29._-_panoramio.jpg/1280px-Solo_onde_%28Only_waves%29._-_panoramio.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Solo_onde_(Only_waves)._-_panoramio.jpg",
          "author": "Lorenzo MICHIELLI",
          "license": "CC BY-SA 3.0",
          "caption": "Waves and reef on the dune coast by El Burro, with Lobos and Lanzarote behind"
        }
      ],
      "sources": [
        "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/el_burro/",
        "https://thesurfatlas.com/surfing-in-canary-islands/corralejo-surf/",
        "https://www.fuerteventuraplayas.com/en/?p=7674",
        "https://www.fuerteventuraplayas.com/en/?p=4675",
        "https://surfnerd.com/surf-forecast/el-burro",
        "https://www.surf-forecast.com/breaks/El-Burro",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://web.kite-and-windsurfing-guide.com/spots/kiteboarding-windsurfing-sup/glass-beach-fuerteventura-islas-canarias.html",
        "https://www.openstreetmap.org/way/180138174"
      ]
    }
  },
  "fv-playa-del-moro": {
    "peaks": [
      {
        "id": "main",
        "name": "Playa del Moro",
        "description": "Dune-backed beach break with several short peaks, lefts and rights, mostly gentle enough for surf schools. On a solid north swell it can turn into punchy A-frames.",
        "breakType": "beach",
        "bottom": "sand",
        "direction": "left and right",
        "level": "all",
        "goodWhen": "Low to mid tide on a N–NE swell with W to NW winds."
      }
    ],
    "guide": {
      "season": [
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "seasonNote": "Late spring to early autumn on NE windswell; winter needs a big N–NW swell.",
      "boards": [
        "soft-top",
        "longboard or mini-mal",
        "fish on punchier days"
      ],
      "access": {
        "easier": "Small summer days at low to mid tide."
      },
      "warnings": [
        "rocks underfoot in places",
        "currents",
        "busy with surf schools",
        "inconsistent, often weak waves"
      ],
      "parking": "Small roadside car park off the FV-1 dune road south of Corralejo, then a short sandy path to the beach. Never drive onto the dunes.",
      "facilities": [
        "lifeguard listed (check on arrival)",
        "no cafés, toilets or shade",
        "Corralejo town with shops and surf rentals about 7 km north"
      ],
      "photos": [
        {
          "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Playa_-_panoramio_-_mroszewski_%282%29.jpg",
          "pageUrl": "https://commons.wikimedia.org/wiki/File:Playa_-_panoramio_-_mroszewski_(2).jpg",
          "author": "mroszewski",
          "license": "CC BY-SA 3.0",
          "caption": "Dune coast and the FV-1a road beside Playa del Moro"
        }
      ],
      "sources": [
        "https://www.fuerteventuraplayas.com/en/?p=7841",
        "https://www.fuerteventuraplayas.com/en/?p=4662",
        "https://www.surfmarket.org/ca/platges/europa/canarias/fuerteventura/moro",
        "https://en.wannasurf.com/spot/Europe/Canary/Fuerte_Ventura/moro_/index.html",
        "https://thesurfatlas.com/surfing-in-canary-islands/corralejo-surf/",
        "https://thesurfatlas.com/surfing-in-canary-islands/corralejo-beaches/",
        "https://www.beachatlas.com/corralejo-beaches-2026-guide",
        "https://planetsurfcamps.co.uk/surf-camps-canary-islands/surf-camp-fuerteventura/surfspots-fuerteventura",
        "https://www.openstreetmap.org/way/146787100"
      ]
    }
  }
};
