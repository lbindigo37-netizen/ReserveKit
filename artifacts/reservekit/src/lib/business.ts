import {
  Scissors,
  Stethoscope,
  PawPrint,
  Sparkles,
  Dumbbell,
  BriefcaseBusiness,
  HeartPulse,
  type LucideIcon,
} from 'lucide-react';

export type BusinessTypeConfig = {
  bookingLabel: string;
  bookingPlural: string;
  specialist: string;
  specialistPlural: string;
  appointment: string;
  icon: LucideIcon;
};

/**
 * Drives white-label terminology and iconography from the business `type`
 * stored on the backend (see `/business`). Changing the type in Settings
 * updates every one of these surfaces without further configuration, which
 * is the "WHITE LABEL TEMPLATE" requirement in PROJECT.md.
 */
export const businessTypes = [
  'Salon',
  'Clinic',
  'Pet Grooming',
  'Photography Studio',
  'Sports Court',
  'Coworking Space',
  'Massage Spa',
] as const;

export const businessTypeConfig: Record<string, BusinessTypeConfig> = {
  Salon: { bookingLabel: 'Book a stylist', bookingPlural: 'Bookings', specialist: 'Stylist', specialistPlural: 'Stylists', appointment: 'appointment', icon: Scissors },
  Clinic: { bookingLabel: 'Book a doctor', bookingPlural: 'Appointments', specialist: 'Doctor', specialistPlural: 'Doctors', appointment: 'appointment', icon: Stethoscope },
  'Pet Grooming': { bookingLabel: 'Book a groomer', bookingPlural: 'Bookings', specialist: 'Groomer', specialistPlural: 'Groomers', appointment: 'appointment', icon: PawPrint },
  'Photography Studio': { bookingLabel: 'Reserve a session', bookingPlural: 'Sessions', specialist: 'Photographer', specialistPlural: 'Photographers', appointment: 'session', icon: Sparkles },
  'Sports Court': { bookingLabel: 'Reserve a court', bookingPlural: 'Reservations', specialist: 'Coach', specialistPlural: 'Coaches', appointment: 'reservation', icon: Dumbbell },
  'Coworking Space': { bookingLabel: 'Reserve a workspace', bookingPlural: 'Reservations', specialist: 'Host', specialistPlural: 'Hosts', appointment: 'reservation', icon: BriefcaseBusiness },
  'Massage Spa': { bookingLabel: 'Book a treatment', bookingPlural: 'Appointments', specialist: 'Therapist', specialistPlural: 'Therapists', appointment: 'treatment', icon: HeartPulse },
};

export function getBusinessTypeConfig(type: string): BusinessTypeConfig {
  return businessTypeConfig[type] ?? businessTypeConfig.Salon;
}
