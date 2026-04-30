export type ScheduleEventType = 'Gym' | 'Online' | 'Consultation';
export type ScheduleEventStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type CallSessionStatus = 'Active' | 'Ended' | 'Missed';

export interface ScheduleEvent {
  id: string;
  trainerId: string;
  trainerName?: string;
  studentId?: string;
  studentName?: string;
  startAt: string;
  durationMinutes: number;
  type: ScheduleEventType;
  title: string;
  location?: string;
  status: ScheduleEventStatus;
  programId?: string;
  comment?: string;
  isCancelled: boolean;
  createdAt: string;
}

export interface CreateScheduleEventRequest {
  studentId?: string;
  startAt: string;
  durationMinutes: number;
  type: ScheduleEventType;
  title: string;
  location?: string;
  status?: ScheduleEventStatus;
  programId?: string;
  comment?: string;
}

export interface RescheduleEventRequest {
  startAt: string;
  durationMinutes: number;
}

export interface UpdateScheduleEventRequest {
  studentId?: string;
  startAt: string;
  durationMinutes: number;
  type: ScheduleEventType;
  title: string;
  location?: string;
  status?: ScheduleEventStatus;
  programId?: string;
  comment?: string;
}

export interface GetEventsQuery {
  from?: string;
  to?: string;
}

export interface ScheduleStats {
  totalEvents: number;
  completedEvents: number;
  upcomingEvents: number;
  cancelledEvents: number;
  totalMinutes: number;
  eventsByType: Record<string, number>;
  dayStats: DayStats[];
}

export interface DayStats {
  date: string;
  eventCount: number;
  totalMinutes: number;
}

export interface StartCallResponse {
  callUrl: string;
  roomId: string;
  sessionId: string;
}
