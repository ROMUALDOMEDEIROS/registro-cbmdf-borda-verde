
import { TRAINING_CONFIG, ValidationResult } from './types';

export const getBrasiliaDate = (): Date => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TRAINING_CONFIG.TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const map: { [key: string]: number } = {};
  parts.forEach(({ type, value }) => {
    if (type !== 'literal') map[type] = parseInt(value, 10);
  });

  // Reconstruct date object in the target timezone context
  return new Date(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const validatePresence = (lat: number, lng: number): ValidationResult => {
  const brDate = getBrasiliaDate();
  const day = brDate.getDay();
  const hour = brDate.getHours();
  
  // Check day and hour
  if (!TRAINING_CONFIG.ALLOWED_DAYS.includes(day) || hour < TRAINING_CONFIG.START_HOUR || hour >= TRAINING_CONFIG.END_HOUR) {
    return { 
      allowed: false, 
      reason: "Registro não permitido fora dos dias e horários de treino (Terça, Quinta e Domingo das 06h às 12h)." 
    };
  }

  const isSunday = day === 0;
  const distance = calculateDistance(lat, lng, TRAINING_CONFIG.CENTER.lat, TRAINING_CONFIG.CENTER.lng);

  if (!isSunday && distance > TRAINING_CONFIG.RADIUS_METERS) {
    return { 
      allowed: false, 
      reason: `Você está fora do raio permitido (${Math.round(distance)}m do ponto central). O limite é de ${TRAINING_CONFIG.RADIUS_METERS}m.`,
      details: { distance, isSunday }
    };
  }

  return { allowed: true, details: { distance, isSunday } };
};

export const getDayName = (dayIndex: number): string => {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[dayIndex];
};

export const formatFullDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR');
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};
