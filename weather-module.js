function windCompass(degrees){
  if(degrees===null||degrees===undefined||Number.isNaN(Number(degrees)))return null;
  const labels=['N','NO','O','ZO','Z','ZW','W','NW'];
  return labels[Math.round((((Number(degrees)%360)+360)%360)/45)%8];
}
function localDay(d){const z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;}
async function fetchWindForDateTime(latitude,longitude,observedAt){
  const now=new Date();
  const ageMs=now-observedAt;
  const isCurrent=ageMs<6*60*60*1000;
  const variables='wind_speed_10m,wind_direction_10m,temperature_2m,relative_humidity_2m,pressure_msl,precipitation,cloud_cover';
  let url;
  if(isCurrent){
    const q=new URLSearchParams({latitude:String(latitude),longitude:String(longitude),current:variables,wind_speed_unit:'kmh',precipitation_unit:'mm',timezone:'auto'});
    url='https://api.open-meteo.com/v1/forecast?'+q.toString();
  }else{
    const day=localDay(observedAt);
    const q=new URLSearchParams({latitude:String(latitude),longitude:String(longitude),start_date:day,end_date:day,hourly:variables,wind_speed_unit:'kmh',precipitation_unit:'mm',timezone:'auto'});
    url=(ageMs<=5*86400000?'https://api.open-meteo.com/v1/forecast?':'https://archive-api.open-meteo.com/v1/archive?')+q.toString();
  }
  const response=await fetch(url);
  if(!response.ok)throw new Error('Weergegevens konden niet worden opgehaald');
  const data=await response.json();
  let speed,deg,time,temperature,humidity,pressure,precipitation,cloudCover;
  if(isCurrent){
    const c=data.current||{};
    speed=c.wind_speed_10m??null;deg=c.wind_direction_10m??null;time=c.time||null;
    temperature=c.temperature_2m??null;humidity=c.relative_humidity_2m??null;pressure=c.pressure_msl??null;
    precipitation=c.precipitation??null;cloudCover=c.cloud_cover??null;
  }else{
    const times=data.hourly?.time||[];
    if(!times.length)throw new Error('Geen historische weergegevens beschikbaar');
    let bestIndex=0,bestDiff=Infinity;
    times.forEach((value,index)=>{const diff=Math.abs(new Date(value).getTime()-observedAt.getTime());if(diff<bestDiff){bestDiff=diff;bestIndex=index;}});
    const h=data.hourly||{};
    speed=h.wind_speed_10m?.[bestIndex]??null;deg=h.wind_direction_10m?.[bestIndex]??null;time=times[bestIndex]||null;
    temperature=h.temperature_2m?.[bestIndex]??null;humidity=h.relative_humidity_2m?.[bestIndex]??null;pressure=h.pressure_msl?.[bestIndex]??null;
    precipitation=h.precipitation?.[bestIndex]??null;cloudCover=h.cloud_cover?.[bestIndex]??null;
  }
  return {
    windSpeedKmh:speed,windDirectionDeg:deg,windDirectionCompass:windCompass(deg),
    temperatureC:temperature,relativeHumidityPct:humidity,pressureMslHpa:pressure,
    precipitationMm:precipitation,cloudCoverPct:cloudCover,
    weatherObservedAt:time,weatherSource:'Open-Meteo'
  };
}
async function fetchWindForLocation(latitude,longitude){return fetchWindForDateTime(latitude,longitude,new Date());}
