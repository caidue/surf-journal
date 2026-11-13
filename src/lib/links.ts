/**
 * Links out to the same spot in other services (ids in Spot.externalIds). Only links: the app
 * never copies their forecasts or guides.
 */
export const surflineUrl = (slugAndId: string) => `https://www.surfline.com/surf-report/${slugAndId}`;
export const surfForecastUrl = (slug: string) => `https://www.surf-forecast.com/breaks/${encodeURIComponent(slug)}`;
