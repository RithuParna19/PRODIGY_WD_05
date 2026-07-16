/**
 * AeroSky Weather Dashboard - Core Logic
 * Clean, structured, and commented for internship submission.
 */

// ============================================================================
// 1. CONFIGURATION & STATE
// ============================================================================

const CONFIG = {
    // OpenWeatherMap API Key. 
    // Please replace with your valid key. If left blank or invalid, 
    // the application automatically activates the Open-Meteo fallback geocoder and API
    // so that the weather dashboard is 100% functional out-of-the-box!
    OPENWEATHER_API_KEY: '81180b4d4554b732fbccdc13b9bd7e54',
    
    // Default fallback city on first launch
    DEFAULT_CITY: 'New York',
    
    // Units ('metric' for Celsius)
    UNITS: 'metric'
};

const STATE = {
    currentCity: '',
    latitude: null,
    longitude: null,
    weatherData: null,
    hourlyData: [],
    dailyData: [],
    theme: 'dark', // 'dark' or 'light'
    activeEffect: 'default' // 'sunny', 'cloudy', 'rainy', 'snowy', 'night', 'default'
};

// DOM Cache
const DOM = {
    searchForm: document.getElementById('search-form'),
    searchInput: document.getElementById('search-input'),
    btnLocation: document.getElementById('btn-location'),
    btnTheme: document.getElementById('btn-theme'),
    loadingOverlay: document.getElementById('loading-overlay'),
    errorToast: document.getElementById('error-toast'),
    errorTitle: document.getElementById('error-title'),
    errorDesc: document.getElementById('error-desc'),
    btnCloseToast: document.getElementById('btn-close-toast'),
    
    // Current Weather
    cityName: document.getElementById('city-name'),
    currentDateTime: document.getElementById('current-date-time'),
    weatherConditionBadge: document.getElementById('weather-condition-badge'),
    weatherMainIconContainer: document.getElementById('weather-main-icon-container'),
    tempValue: document.getElementById('temp-value'),
    weatherDescription: document.getElementById('weather-description'),
    feelsLikeValue: document.getElementById('feels-like-value'),
    
    // Metrics
    humidityValue: document.getElementById('humidity-value'),
    windValue: document.getElementById('wind-value'),
    windDirection: document.getElementById('wind-direction'),
    pressureValue: document.getElementById('pressure-value'),
    visibilityValue: document.getElementById('visibility-value'),
    uvValue: document.getElementById('uv-value'),
    uvLevel: document.getElementById('uv-level'),
    uvIndicator: document.getElementById('uv-indicator'),
    cloudsValue: document.getElementById('clouds-value'),
    
    // Solar
    sunriseTime: document.getElementById('sunrise-time'),
    sunsetTime: document.getElementById('sunset-time'),
    sunNode: document.getElementById('sun-node'),
    sunPathActive: document.getElementById('sun-path-active'),
    
    // Lists
    hourlyForecastContainer: document.getElementById('hourly-forecast-container'),
    dailyForecastContainer: document.getElementById('daily-forecast-container')
};

// ============================================================================
// 2. CANVAS WEATHER BACKGROUND ANIMATIONS
// ============================================================================

class CanvasWeatherBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.animationFrameId = null;
        this.particles = [];
        this.clouds = [];
        this.stars = [];
        this.glowPhase = 0;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Initialize background stars once for night effect
        this.initStars();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.initClouds(); // Re-initialize clouds to canvas width
    }
    
    initStars() {
        this.stars = [];
        const numStars = 100;
        for (let i = 0; i < numStars; i++) {
            this.stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * (window.innerHeight * 0.7), // keep stars in top 70% of screen
                size: Math.random() * 1.5 + 0.5,
                alpha: Math.random(),
                speed: Math.random() * 0.02 + 0.005,
                direction: Math.random() > 0.5 ? 1 : -1
            });
        }
    }
    
    initClouds() {
        this.clouds = [];
        const numClouds = 6;
        for (let i = 0; i < numClouds; i++) {
            this.clouds.push({
                x: Math.random() * (this.canvas.width + 400) - 200,
                y: Math.random() * (this.canvas.height * 0.35) + 50,
                radiusX: Math.random() * 80 + 60,
                radiusY: Math.random() * 35 + 20,
                speed: Math.random() * 0.15 + 0.05,
                opacity: Math.random() * 0.12 + 0.04
            });
        }
    }
    
    setEffect(effect) {
        if (STATE.activeEffect === effect && this.particles.length > 0) return;
        STATE.activeEffect = effect;
        this.particles = [];
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        if (effect === 'rainy') {
            const numRain = 85;
            for (let i = 0; i < numRain; i++) {
                this.particles.push({
                    x: Math.random() * w,
                    y: Math.random() * -h,
                    length: Math.random() * 20 + 15,
                    speed: Math.random() * 10 + 15,
                    opacity: Math.random() * 0.25 + 0.1
                });
            }
        } else if (effect === 'snowy') {
            const numSnow = 60;
            for (let i = 0; i < numSnow; i++) {
                this.particles.push({
                    x: Math.random() * w,
                    y: Math.random() * -h,
                    size: Math.random() * 3 + 1,
                    speed: Math.random() * 1 + 0.5,
                    drift: Math.random() * 1 - 0.5,
                    angle: Math.random() * Math.PI * 2
                });
            }
        } else if (effect === 'sunny') {
            // Sunny floating golden flares
            const numFlares = 15;
            for (let i = 0; i < numFlares; i++) {
                this.particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    size: Math.random() * 8 + 4,
                    speed: Math.random() * 0.3 + 0.1,
                    opacity: Math.random() * 0.15 + 0.05
                });
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const mode = STATE.theme;
        const effect = STATE.activeEffect;
        
        // 2. Night - Twinkling Stars
        if (effect === 'night' || (mode === 'dark' && effect !== 'sunny')) {
            this.ctx.fillStyle = '#ffffff';
            this.stars.forEach(star => {
                // Twinkle effect
                star.alpha += star.speed * star.direction;
                if (star.alpha > 1) {
                    star.alpha = 1;
                    star.direction = -1;
                } else if (star.alpha < 0.1) {
                    star.alpha = 0.1;
                    star.direction = 1;
                }
                
                this.ctx.globalAlpha = star.alpha;
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.globalAlpha = 1.0;
        }
        
        // 3. Sunny Pulsating Sun Glow (Top left ambient light glow)
        if (effect === 'sunny') {
            this.glowPhase += 0.005;
            const pulse = Math.sin(this.glowPhase) * 15 + 120;
            
            const gradient = this.ctx.createRadialGradient(
                this.canvas.width * 0.85, 80, 20,
                this.canvas.width * 0.85, 80, pulse * 2.5
            );
            
            if (mode === 'dark') {
                gradient.addColorStop(0, 'rgba(251, 191, 36, 0.12)');
                gradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.03)');
                gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(253, 224, 71, 0.35)');
                gradient.addColorStop(0.5, 'rgba(253, 224, 71, 0.08)');
                gradient.addColorStop(1, 'rgba(253, 224, 71, 0)');
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(this.canvas.width * 0.85, 80, pulse * 2.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw floating warm golden flares
            this.ctx.fillStyle = mode === 'dark' ? '#fbbf24' : '#f59e0b';
            this.particles.forEach(p => {
                p.y -= p.speed;
                if (p.y < -20) p.y = this.canvas.height + 20;
                
                this.ctx.globalAlpha = p.opacity;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.globalAlpha = 1.0;
        }
        
        // 4. Rainy Effect - falling rain drops
        if (effect === 'rainy') {
            this.ctx.strokeStyle = mode === 'dark' ? 'rgba(156, 163, 175, 0.4)' : 'rgba(59, 130, 246, 0.3)';
            this.ctx.lineWidth = 1.5;
            this.ctx.lineCap = 'round';
            
            this.particles.forEach(p => {
                this.ctx.globalAlpha = p.opacity;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                // Draw slightly angled down-left
                this.ctx.lineTo(p.x - 2, p.y + p.length);
                this.ctx.stroke();
                
                p.y += p.speed;
                p.x -= 0.2; // slight wind push left
                
                if (p.y > this.canvas.height) {
                    p.y = -20;
                    p.x = Math.random() * this.canvas.width;
                }
            });
            this.ctx.globalAlpha = 1.0;
        }
        
        // 5. Snowy Effect - drifting flakes
        if (effect === 'snowy') {
            this.ctx.fillStyle = mode === 'dark' ? 'rgba(255, 255, 255, 0.75)' : 'rgba(147, 197, 253, 0.65)';
            this.particles.forEach(p => {
                p.y += p.speed;
                p.angle += 0.01;
                p.x += Math.sin(p.angle) * 0.3 + p.drift * 0.1;
                
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                
                if (p.y > this.canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * this.canvas.width;
                }
            });
        }
        
        // 6. Cloudy/Mist - Drifting horizontal soft fog ellipses
        if (effect === 'cloudy' || effect === 'rainy' || effect === 'snowy') {
            this.ctx.fillStyle = mode === 'dark' ? 'rgba(255, 255, 255, 1)' : 'rgba(219, 234, 254, 1)';
            this.clouds.forEach(c => {
                this.ctx.globalAlpha = c.opacity;
                this.ctx.beginPath();
                this.ctx.ellipse(c.x, c.y, c.radiusX, c.radiusY, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                c.x += c.speed;
                if (c.x - c.radiusX > this.canvas.width) {
                    c.x = -c.radiusX - 50;
                    c.y = Math.random() * (this.canvas.height * 0.35) + 50;
                }
            });
            this.ctx.globalAlpha = 1.0;
        }
        
        this.animationFrameId = requestAnimationFrame(() => this.draw());
    }
    
    start() {
        if (!this.animationFrameId) {
            this.draw();
        }
    }
}

// Instantiate canvas background global handle
let backgroundAnimator;

// ============================================================================
// 3. API DATA FETCHERS & FALLBACK SERVICE (ADAPTER)
// ============================================================================

/**
 * Clean data model mapped from both APIs.
 */
class MeteorologicalReport {
    constructor({ city, country, lat, lon, temp, feelsLike, condition, description, iconCode, humidity, windSpeed, windDeg, pressure, visibility, clouds, sunriseLocal, sunsetLocal, timezoneOffset }) {
        this.city = city;
        this.country = country;
        this.lat = lat;
        this.lon = lon;
        this.temp = temp;
        this.feelsLike = feelsLike;
        this.condition = condition; // e.g., 'Clear', 'Clouds', 'Rain', 'Snow', 'Drizzle'
        this.description = description;
        this.iconCode = iconCode; // standard OWM icon code, mapped from Open-Meteo inside fallback
        this.humidity = humidity;
        this.windSpeed = windSpeed;
        this.windDeg = windDeg;
        this.pressure = pressure;
        this.visibility = visibility; // in km
        this.clouds = clouds;
        this.sunriseLocal = sunriseLocal; // Local Unix Timestamp (seconds)
        this.sunsetLocal = sunsetLocal; // Local Unix Timestamp (seconds)
        this.timezoneOffset = timezoneOffset; // seconds from UTC
    }
}

/**
 * Check if the OpenWeatherMap API key is dummy/placeholder.
 */
function isOwmKeyPlaceholder() {
    const key = CONFIG.OPENWEATHER_API_KEY.trim();
    return !key || key.startsWith('YOUR_') || key.length < 20;
}

/**
 * Core coordinate geocoding service.
 */
async function geocodeCity(cityName) {
    // 1. Try Geocoding via OpenWeatherMap if key is valid
    if (!isOwmKeyPlaceholder()) {
        try {
            const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${CONFIG.OPENWEATHER_API_KEY}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    return {
                        name: data[0].name,
                        country: data[0].country,
                        lat: data[0].lat,
                        lon: data[0].lon
                    };
                }
            }
        } catch (e) {
            console.warn("OWM Geocoder lookup failed, switching to fallback", e);
        }
    }
    
    // 2. Keyless Fallback Geocoder (Open-Meteo Search)
    const fallbackUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
    const response = await fetch(fallbackUrl);
    if (!response.ok) {
        throw new Error("Unable to locate specified geographic region.");
    }
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
        throw new Error("City not found. Please verify spelling.");
    }
    return {
        name: data.results[0].name,
        country: data.results[0].country_code || '',
        lat: data.results[0].latitude,
        lon: data.results[0].longitude
    };
}

/**
 * Fetch Current Weather & Forecasts.
 */
async function fetchWeatherData(lat, lon, cityName, countryCode) {
    let report = null;
    let hourlyForecast = [];
    let dailyForecast = [];
    let uvIndex = 0.0;
    
    // 1. Try to fetch standard OpenWeatherMap Data if key is valid
    if (!isOwmKeyPlaceholder()) {
        try {
            const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${CONFIG.UNITS}&appid=${CONFIG.OPENWEATHER_API_KEY}`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${CONFIG.UNITS}&appid=${CONFIG.OPENWEATHER_API_KEY}`;
            
            const [currentRes, forecastRes] = await Promise.all([
                fetch(currentUrl),
                fetch(forecastUrl)
            ]);
            
            if (currentRes.ok && forecastRes.ok) {
                const currentData = await currentRes.json();
                const forecastData = await forecastRes.json();
                
                report = new MeteorologicalReport({
                    city: currentData.name || cityName,
                    country: currentData.sys.country || countryCode,
                    lat: lat,
                    lon: lon,
                    temp: Math.round(currentData.main.temp),
                    feelsLike: Math.round(currentData.main.feels_like),
                    condition: currentData.weather[0].main,
                    description: currentData.weather[0].description,
                    iconCode: currentData.weather[0].icon,
                    humidity: currentData.main.humidity,
                    windSpeed: currentData.wind.speed,
                    windDeg: currentData.wind.deg,
                    pressure: currentData.main.pressure,
                    visibility: currentData.visibility ? (currentData.visibility / 1000).toFixed(1) : 10,
                    clouds: currentData.clouds.all,
                    sunriseLocal: currentData.sys.sunrise + currentData.timezone,
                    sunsetLocal: currentData.sys.sunset + currentData.timezone,
                    timezoneOffset: currentData.timezone
                });
                
                // Map hourly forecast (next 8 readings represent 24 hours at 3h intervals)
                hourlyForecast = forecastData.list.slice(0, 8).map(item => ({
                    time: formatLocalTime(item.dt + report.timezoneOffset, true),
                    tempVal: Math.round(item.main.temp),
                    iconCode: item.weather[0].icon,
                    wind: `${Math.round(item.wind.speed)} m/s`
                }));
                
                // Map daily forecast. Since OWM returns 40 intervals, we select one reading around midday (e.g. 12:00:00) per day.
                const daysMap = {};
                forecastData.list.forEach(item => {
                    const localDateString = new Date((item.dt + report.timezoneOffset) * 1000).toISOString().split('T')[0];
                    if (!daysMap[localDateString]) {
                        daysMap[localDateString] = [];
                    }
                    daysMap[localDateString].push(item);
                });
                
                // Construct daily values
                Object.keys(daysMap).slice(0, 7).forEach(dateStr => {
                    const items = daysMap[dateStr];
                    // Pick the midday item or center item
                    const repItem = items.find(item => item.dt_txt && item.dt_txt.includes("12:00:00")) || items[Math.floor(items.length / 2)];
                    
                    // Get min and max temperatures for this date
                    let minTemp = Infinity;
                    let maxTemp = -Infinity;
                    items.forEach(item => {
                        if (item.main.temp_min < minTemp) minTemp = item.main.temp_min;
                        if (item.main.temp_max > maxTemp) maxTemp = item.main.temp_max;
                    });
                    
                    dailyForecast.push({
                        day: formatLocalDayName(repItem.dt + report.timezoneOffset, report.timezoneOffset),
                        tempMin: Math.round(minTemp),
                        tempMax: Math.round(maxTemp),
                        iconCode: repItem.weather[0].icon,
                        description: repItem.weather[0].description
                    });
                });
            }
        } catch (e) {
            console.error("Failed fetching from OpenWeatherMap API, falling back to Open-Meteo", e);
        }
    }
    
    // 2. Fetch supplemental or fallback data from Open-Meteo
    // We ALWAYS use Open-Meteo to obtain the UV Index, or as the full engine fallback if OpenWeatherMap key failed.
    try {
        const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,visibility&hourly=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=7`;
        const res = await fetch(omUrl);
        if (!res.ok) throw new Error("Supplemental meteorological retrieval failed.");
        const omData = await res.json();
        
        // Grab UV index (max UV for today)
        uvIndex = omData.daily && omData.daily.uv_index_max ? omData.daily.uv_index_max[0] : 0.0;
        
        // If OpenWeatherMap did not populate the report (either dummy key, expired, or network block), 
        // fall back completely to Open-Meteo data structure!
        if (!report) {
            const current = omData.current;
            const wmoCode = current.weather_code;
            const isDay = current.is_day === 1;
            const conditionMapped = mapWmoToCondition(wmoCode);
            const iconCodeMapped = mapWmoToOwmIcon(wmoCode, isDay);
            
            // Format Sunrise/Sunset local timestamps (treating Open-Meteo's strings as Z dates shifts them directly to correct local offsets)
            const sunriseUnix = new Date(omData.daily.sunrise[0] + "Z").getTime() / 1000;
            const sunsetUnix = new Date(omData.daily.sunset[0] + "Z").getTime() / 1000;
            const offsetSec = omData.utc_offset_seconds || 0;
            
            report = new MeteorologicalReport({
                city: cityName,
                country: countryCode,
                lat: lat,
                lon: lon,
                temp: Math.round(current.temperature_2m),
                feelsLike: Math.round(current.apparent_temperature),
                condition: conditionMapped.title,
                description: conditionMapped.desc,
                iconCode: iconCodeMapped,
                humidity: current.relative_humidity_2m,
                windSpeed: (current.wind_speed_10m / 3.6).toFixed(1), // convert km/h to m/s
                windDeg: current.wind_direction_10m,
                pressure: Math.round(current.pressure_msl),
                visibility: current.visibility ? (current.visibility / 1000).toFixed(1) : 10,
                clouds: current.cloud_cover,
                sunriseLocal: sunriseUnix,
                sunsetLocal: sunsetUnix,
                timezoneOffset: offsetSec
            });
            
            // Map hourly forecast from Open-Meteo (next 24 hours)
            // Grab next 8 samples (every 3 hours to mimic OWM resolution)
            hourlyForecast = [];
            const offsetIdx = new Date().getHours();
            for (let i = 0; i < 8; i++) {
                const idx = offsetIdx + (i * 3);
                if (idx < omData.hourly.time.length) {
                    const hourlyLocalUnix = new Date(omData.hourly.time[idx] + "Z").getTime() / 1000;
                    const hWmo = omData.hourly.weather_code[idx];
                    hourlyForecast.push({
                        time: formatLocalTime(hourlyLocalUnix, true),
                        tempVal: Math.round(omData.hourly.temperature_2m[idx]),
                        iconCode: mapWmoToOwmIcon(hWmo, true),
                        wind: `${Math.round(omData.hourly.wind_speed_10m[idx] / 3.6)} m/s`
                    });
                }
            }
            
            // Map daily forecast from Open-Meteo (full 7 days)
            dailyForecast = [];
            for (let i = 0; i < 7; i++) {
                const dayLocalUnix = new Date(omData.daily.time[i] + "Z").getTime() / 1000;
                const dWmo = omData.daily.weather_code[i];
                const dCond = mapWmoToCondition(dWmo);
                
                dailyForecast.push({
                    day: formatLocalDayName(dayLocalUnix, offsetSec),
                    tempMin: Math.round(omData.daily.temperature_2m_min[i]),
                    tempMax: Math.round(omData.daily.temperature_2m_max[i]),
                    iconCode: mapWmoToOwmIcon(dWmo, true),
                    description: dCond.desc
                });
            }
        }
    } catch (e) {
        if (!report) {
            throw new Error("Unable to retrieve meteorological reports. Please check your internet connection.");
        }
        console.warn("Failed retrieving UV index and supplementary metrics", e);
    }
    
    return { report, hourlyForecast, dailyForecast, uvIndex };
}

// ============================================================================
// 4. METEOROLOGICAL HELPERS & TRANSLATORS (TIMEZONE SECURE)
// ============================================================================

/**
 * Formats a pre-shifted local UNIX timestamp into string using UTC timeZone in options
 * to avoid client local timezone offsets.
 */
function formatLocalTime(localUnixTimestamp, timeOnly = false) {
    const localDate = new Date(localUnixTimestamp * 1000);
    
    if (timeOnly) {
        return localDate.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true, timeZone: 'UTC' });
    }
    
    const options = { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true,
        timeZone: 'UTC'
    };
    return localDate.toLocaleDateString('en-US', options).replace(',', ' •');
}

/**
 * Custom day name formatter that calculates if daily item is "Today" inside target city's timezone.
 */
function formatLocalDayName(itemLocalUnixTimestamp, timezoneOffsetSeconds) {
    const localDate = new Date(itemLocalUnixTimestamp * 1000);
    
    // City's current local date string (UTC formatted date of client adjusted to city timezone)
    const clientUtcSec = Math.floor(Date.now() / 1000);
    const cityLocalSec = clientUtcSec + timezoneOffsetSeconds;
    const cityTodayStr = new Date(cityLocalSec * 1000).toLocaleDateString('en-US', { timeZone: 'UTC' });
    
    const itemDayStr = localDate.toLocaleDateString('en-US', { timeZone: 'UTC' });
    if (cityTodayStr === itemDayStr) {
        return "Today";
    }
    
    return localDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
}

/**
 * Map WMO weather codes to OWM icons.
 */
function mapWmoToOwmIcon(code, isDay = true) {
    const s = isDay ? 'd' : 'n';
    if (code === 0) return '01' + s; // clear
    if (code === 1 || code === 2) return '02' + s; // partly cloudy
    if (code === 3) return '04' + s; // overcast
    if (code === 45 || code === 48) return '50' + s; // fog
    if (code >= 51 && code <= 55) return '09d'; // drizzle
    if (code >= 61 && code <= 65) return '10' + s; // rain
    if (code >= 71 && code <= 77) return '13d'; // snow
    if (code >= 80 && code <= 82) return '09d'; // shower rain
    if (code >= 85 && code <= 86) return '13d'; // snow showers
    if (code >= 95 && code <= 99) return '11d'; // thunderstorm
    return '03d';
}

/**
 * Map WMO codes to text weather conditions.
 */
function mapWmoToCondition(code) {
    if (code === 0) return { title: 'Clear', desc: 'clear sky' };
    if (code === 1) return { title: 'Partly Cloudy', desc: 'mainly clear' };
    if (code === 2) return { title: 'Partly Cloudy', desc: 'partly cloudy' };
    if (code === 3) return { title: 'Cloudy', desc: 'overcast' };
    if (code === 45 || code === 48) return { title: 'Fog', desc: 'foggy conditions' };
    if (code >= 51 && code <= 55) return { title: 'Drizzle', desc: 'light rain drizzle' };
    if (code >= 61 && code <= 65) return { title: 'Rain', desc: 'continuous rain' };
    if (code >= 71 && code <= 77) return { title: 'Snow', desc: 'snowfall' };
    if (code >= 80 && code <= 82) return { title: 'Showers', desc: 'passing showers' };
    if (code >= 85 && code <= 86) return { title: 'Snow Showers', desc: 'heavy snow showers' };
    if (code >= 95 && code <= 99) return { title: 'Thunderstorm', desc: 'unstable thunderstorm' };
    return { title: 'Overcast', desc: 'cloudy skies' };
}

/**
 * Map OWM Icon Codes to Lucide icons.
 */
function getLucideIconName(owmCode) {
    const map = {
        '01d': 'sun',
        '01n': 'moon',
        '02d': 'cloud-sun',
        '02n': 'cloud-moon',
        '03d': 'cloud',
        '03n': 'cloud',
        '04d': 'cloud-drizzle', 
        '04n': 'cloud-drizzle',
        '09d': 'cloud-rain',
        '09n': 'cloud-rain',
        '10d': 'cloud-lightning', 
        '10n': 'cloud-lightning',
        '11d': 'cloud-lightning',
        '11n': 'cloud-lightning',
        '13d': 'snowflake',
        '13n': 'snowflake',
        '50d': 'wind', 
        '50n': 'wind'
    };
    return map[owmCode] || 'cloud';
}

/**
 * Translates current weather state into canvas animations.
 */
function getCanvasEffectName(owmCode) {
    if (!owmCode) return 'default';
    const mainCode = owmCode.substring(0, 2);
    const cycle = owmCode.charAt(2);
    
    if (mainCode === '01') {
        return cycle === 'd' ? 'sunny' : 'night';
    }
    if (mainCode === '02' || mainCode === '03' || mainCode === '04' || mainCode === '50') {
        return cycle === 'd' ? 'cloudy' : 'night';
    }
    if (mainCode === '09' || mainCode === '10' || mainCode === '11') {
        return 'rainy';
    }
    if (mainCode === '13') {
        return 'snowy';
    }
    return 'default';
}

// ============================================================================
// 5. UI RENDER ENGINE
// ============================================================================

/**
 * Updates all DOM elements with fetched weather data.
 */
function renderDashboard(weatherReport, hourlyForecast, dailyForecast, uvIndex) {
    const report = weatherReport;
    
    // Current City and Date Time (adjusted by shifting standard client clock to target city offset)
    const clientUtcSec = Math.floor(Date.now() / 1000);
    const cityLocalSec = clientUtcSec + report.timezoneOffset;
    DOM.cityName.textContent = `${report.city}${report.country ? ', ' + report.country : ''}`;
    DOM.currentDateTime.textContent = formatLocalTime(cityLocalSec);
    DOM.weatherConditionBadge.textContent = report.condition;
    
    // Main Temp
    DOM.tempValue.textContent = report.temp;
    DOM.weatherDescription.textContent = report.description;
    DOM.feelsLikeValue.textContent = report.feelsLike;
    
    // Replace big icon
    const mainIconName = getLucideIconName(report.iconCode);
    DOM.weatherMainIconContainer.innerHTML = `<i data-lucide="${mainIconName}" class="main-weather-icon animated"></i>`;
    
    // Background Effect
    const canvasEffect = getCanvasEffectName(report.iconCode);
    backgroundAnimator.setEffect(canvasEffect);
    
    // Metrics Grid
    DOM.humidityValue.textContent = report.humidity;
    DOM.windValue.textContent = report.windSpeed;
    DOM.pressureValue.textContent = report.pressure;
    DOM.visibilityValue.textContent = report.visibility;
    DOM.cloudsValue.textContent = report.clouds;
    
    // Wind Angle Rotation
    DOM.windDirection.innerHTML = `<i data-lucide="navigation-2" class="wind-arrow" style="transform: rotate(${report.windDeg}deg);"></i> ${getWindDirectionText(report.windDeg)}`;
    
    // UV Index card rendering
    DOM.uvValue.textContent = uvIndex.toFixed(1);
    const uvInfo = getUvLevelInfo(uvIndex);
    DOM.uvLevel.textContent = uvInfo.label;
    
    // Override color classes or styling for UV indicator
    DOM.uvLevel.className = `metric-badge`;
    DOM.uvLevel.style.color = uvInfo.color;
    DOM.uvLevel.style.backgroundColor = uvInfo.bgColor;
    DOM.uvIndicator.style.left = `${Math.min((uvIndex / 12) * 100, 100)}%`;
    
    // Solar Arc Rendering
    renderSolarCycle(report.sunriseLocal, report.sunsetLocal, report.timezoneOffset);
    
    // Render Hourly Forecast
    renderHourlyForecast(hourlyForecast);
    
    // Render 7-Day Forecast
    renderDailyForecast(dailyForecast);
    
    // Re-trigger Lucide Icons compilation
    lucide.createIcons();
}

/**
 * Solar curve path calculator using local shifted timestamps.
 */
function renderSolarCycle(sunriseLocal, sunsetLocal, timezoneOffset) {
    const sunriseStr = formatLocalTime(sunriseLocal).split(' •')[1] || formatLocalTime(sunriseLocal);
    const sunsetStr = formatLocalTime(sunsetLocal).split(' •')[1] || formatLocalTime(sunsetLocal);
    
    DOM.sunriseTime.textContent = sunriseStr.trim();
    DOM.sunsetTime.textContent = sunsetStr.trim();
    
    const clientUtcSec = Math.floor(Date.now() / 1000);
    const cityLocalSec = clientUtcSec + timezoneOffset;
    
    const totalDaylight = sunsetLocal - sunriseLocal;
    
    if (cityLocalSec > sunriseLocal && cityLocalSec < sunsetLocal) {
        // Sun is active in sky
        const elapsed = cityLocalSec - sunriseLocal;
        const progress = elapsed / totalDaylight;
        
        // Calculate curve point coordinate
        // Arc goes from 10,90 to 190,90. Center is 100,90. Radius is 90.
        const angle = Math.PI - (progress * Math.PI);
        const cx = 100 + 90 * Math.cos(angle);
        const cy = 90 - 90 * Math.sin(angle);
        
        DOM.sunNode.style.display = 'block';
        DOM.sunNode.setAttribute('cx', cx);
        DOM.sunNode.setAttribute('cy', cy);
        
        // Set stroke active path dash-offset. Total length ~ 283
        const pathLength = 283;
        DOM.sunPathActive.style.strokeDashoffset = pathLength * (1 - progress);
    } else {
        // Sun set
        DOM.sunNode.style.display = 'none';
        DOM.sunPathActive.style.strokeDashoffset = 283; 
    }
}

/**
 * Render scrollable hourly list cards.
 */
function renderHourlyForecast(hourlyData) {
    DOM.hourlyForecastContainer.innerHTML = '';
    
    if (!hourlyData || hourlyData.length === 0) {
        DOM.hourlyForecastContainer.innerHTML = `<p class="empty-msg">Hourly data not available.</p>`;
        return;
    }
    
    hourlyData.forEach(item => {
        const iconName = getLucideIconName(item.iconCode);
        const card = document.createElement('div');
        card.className = 'hourly-item-card';
        card.innerHTML = `
            <span class="time">${item.time}</span>
            <i data-lucide="${iconName}"></i>
            <span class="temp">${item.tempVal}°</span>
            <span class="wind">${item.wind}</span>
        `;
        DOM.hourlyForecastContainer.appendChild(card);
    });
}

/**
 * Render vertical daily list rows.
 */
function renderDailyForecast(dailyData) {
    DOM.dailyForecastContainer.innerHTML = '';
    
    if (!dailyData || dailyData.length === 0) {
        DOM.dailyForecastContainer.innerHTML = `<p class="empty-msg">Forecast data not available.</p>`;
        return;
    }
    
    dailyData.forEach(item => {
        const iconName = getLucideIconName(item.iconCode);
        const row = document.createElement('div');
        row.className = 'daily-item-row';
        row.innerHTML = `
            <span class="day-name">${item.day}</span>
            <div class="weather-desc-wrapper">
                <i data-lucide="${iconName}"></i>
                <span class="desc">${item.description}</span>
            </div>
            <div class="temp-range">
                <span class="max">${item.tempMax}°</span>
                <span class="min">${item.tempMin}°</span>
            </div>
        `;
        DOM.dailyForecastContainer.appendChild(row);
    });
}

// ============================================================================
// 6. GENERAL UTILS & AUXILIARY CONTROLLERS
// ============================================================================

/**
 * Get textual wind heading.
 */
function getWindDirectionText(deg) {
    if (deg === undefined) return 'Calm';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
}

/**
 * UV Level thresholds mappings.
 */
function getUvLevelInfo(uv) {
    if (uv <= 2.9) {
        return { label: 'Low', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' };
    } else if (uv <= 5.9) {
        return { label: 'Mod', color: '#fbbf24', bgColor: 'rgba(251, 191, 38, 0.15)' };
    } else if (uv <= 7.9) {
        return { label: 'High', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' };
    } else if (uv <= 10.9) {
        return { label: 'V. High', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' };
    } else {
        return { label: 'Extreme', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)' };
    }
}

/**
 * Overlay Loader Controls.
 */
function showLoader() {
    DOM.loadingOverlay.classList.remove('hidden');
}

function hideLoader() {
    DOM.loadingOverlay.classList.add('hidden');
}

/**
 * Error Toast Alert display.
 */
function showError(title, message) {
    DOM.errorTitle.textContent = title;
    DOM.errorDesc.textContent = message;
    DOM.errorToast.classList.remove('hidden');
    
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
        dismissError();
    }, 6000);
}

function dismissError() {
    DOM.errorToast.classList.add('hidden');
}

// ============================================================================
// 7. CORE FLOW CONTROLLER (SEARCH & CURRENT LOCATION)
// ============================================================================

/**
 * Queries coordinates and triggers rendering steps.
 */
async function searchWeather(cityName) {
    showLoader();
    dismissError();
    
    try {
        const coords = await geocodeCity(cityName);
        const data = await fetchWeatherData(coords.lat, coords.lon, coords.name, coords.country);
        
        STATE.currentCity = coords.name;
        STATE.latitude = coords.lat;
        STATE.longitude = coords.lon;
        
        // Render UI
        renderDashboard(data.report, data.hourlyForecast, data.dailyForecast, data.uvIndex);
        
        // Cache City searched
        localStorage.setItem('last_searched_city', coords.name);
    } catch (e) {
        console.error(e);
        showError("Search Failed", e.message || "An unexpected error occurred while fetching reports.");
    } finally {
        hideLoader();
    }
}

/**
 * Queries location coordinate hooks via Browser Geolocation API.
 */
async function locateUser() {
    if (!navigator.geolocation) {
        showError("Location Access", "Your web browser does not support Geolocation APIs.");
        return;
    }
    
    showLoader();
    dismissError();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            try {
                // Reverse-geocode coordinates using OpenWeatherMap key if available, otherwise reverse lookup or display coords name.
                let cityName = `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
                let countryCode = '';
                
                if (!isOwmKeyPlaceholder()) {
                    try {
                        const revUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${CONFIG.OPENWEATHER_API_KEY}`;
                        const res = await fetch(revUrl);
                        if (res.ok) {
                            const data = await res.json();
                            if (data && data.length > 0) {
                                cityName = data[0].name;
                                countryCode = data[0].country;
                            }
                        }
                    } catch(err) {
                        console.warn("Reverse lookup failed, continuing with direct coordinates display", err);
                    }
                }
                
                const data = await fetchWeatherData(lat, lon, cityName, countryCode);
                renderDashboard(data.report, data.hourlyForecast, data.dailyForecast, data.uvIndex);
                
                // Cache state
                STATE.currentCity = cityName;
                STATE.latitude = lat;
                STATE.longitude = lon;
                localStorage.setItem('last_searched_city', cityName);
                
            } catch (e) {
                console.error(e);
                showError("Meteorological Error", e.message || "Unable to parse current coordinates weather.");
            } finally {
                hideLoader();
            }
        },
        (error) => {
            hideLoader();
            let msg = "Geolocation query denied or timed out.";
            if (error.code === error.PERMISSION_DENIED) {
                msg = "Location permission denied. Please check site permissions in your browser bar.";
            }
            showError("Location Denied", msg);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
}

// ============================================================================
// 8. THEME STATE PERSISTENCE
// ============================================================================

function initTheme() {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        STATE.theme = 'light';
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        STATE.theme = 'dark';
    }
}

function toggleTheme() {
    if (STATE.theme === 'dark') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        STATE.theme = 'light';
        localStorage.setItem('app_theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        STATE.theme = 'dark';
        localStorage.setItem('app_theme', 'dark');
    }
}

// ============================================================================
// 9. EVENT REGISTRATION & BOOTSTRAP
// ============================================================================

function bootstrap() {
    // 1. Initialize Theme settings
    initTheme();
    
    // 2. Initialize Canvas Background loops
    backgroundAnimator = new CanvasWeatherBackground('weather-canvas');
    backgroundAnimator.start();
    
    // 3. Register Event Listeners
    DOM.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const city = DOM.searchInput.value.trim();
        if (city) {
            searchWeather(city);
            DOM.searchInput.value = '';
            DOM.searchInput.blur();
        }
    });
    
    DOM.btnLocation.addEventListener('click', locateUser);
    DOM.btnTheme.addEventListener('click', toggleTheme);
    DOM.btnCloseToast.addEventListener('click', dismissError);
    
    // 4. Initial Weather Load: Try last searched city, fallback to default config city
    const lastCity = localStorage.getItem('last_searched_city') || CONFIG.DEFAULT_CITY;
    searchWeather(lastCity);
}

// Run app
document.addEventListener('DOMContentLoaded', bootstrap);
