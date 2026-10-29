// GeurMonitor v0.4 - Open-Meteo wind enrichment
function windCompass(degrees) {
  if (degrees === null || degrees === undefined || Number.isNaN(Number(degrees))) return null;
  const labels = ['N','NO','O','ZO','Z','ZW','W','NW'];
  return labels[Math.round((Number(degrees) % 360) / 45) % 8];
}

async function fetchWindForLocation(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'wind_speed_10m,wind_direction_10m',
    wind_speed_unit: 'kmh',
    timezone: 'auto'
  });
  const response = await fetch('https://api.open-meteo.com/v1/forecast?' + params.toString());
  if (!response.ok) throw new Error('Windgegevens konden niet worden opgehaald');
  const data = await response.json();
  const current = data.current || {};
  return {
    windSpeedKmh: current.wind_speed_10m ?? null,
    windDirectionDeg: current.wind_direction_10m ?? null,
    windDirectionCompass: windCompass(current.wind_direction_10m),
    weatherObservedAt: current.time || null,
    weatherSource: 'Open-Meteo'
  };
}
