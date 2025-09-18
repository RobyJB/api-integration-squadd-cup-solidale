export interface GoHighLevelConfig {
  baseUrl: string;
  apiToken: string;
  locationId: string;
  headers: Record<string, string>;
}

export interface GHLApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Calendar Event Types
export interface GHLCalendarEvent {
  id?: string;
  title: string;
  calendarId: string;
  locationId: string;
  contactId?: string;
  groupId?: string;
  appointmentStatus: 'confirmed' | 'cancelled' | 'showed' | 'noshow' | 'invalid';
  assignedUserId?: string;
  startTime: string; // ISO format: "2023-06-15T09:00:00.000Z"
  endTime: string;   // ISO format: "2023-06-15T10:00:00.000Z"
  notes?: string;
  address?: string;
  ignoreDateRange?: boolean;
  toNotify?: boolean;
}

export interface GHLCreateEventRequest {
  title: string;
  calendarId: string;
  locationId: string;
  contactId?: string;
  groupId?: string;
  appointmentStatus: string;
  assignedUserId?: string;
  startTime: string;
  endTime: string;
  notes?: string;
  address?: string;
  ignoreDateRange?: boolean;
  toNotify?: boolean;
}

export interface GHLUpdateEventRequest {
  title?: string;
  calendarId?: string;
  contactId?: string;
  groupId?: string;
  appointmentStatus?: string;
  assignedUserId?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  address?: string;
}

export interface GHLEventResponse {
  id: string;
  title: string;
  calendarId: string;
  locationId: string;
  contactId?: string;
  groupId?: string;
  appointmentStatus: string;
  assignedUserId?: string;
  startTime: string;
  endTime: string;
  notes?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GHLGetEventsRequest {
  locationId: string;
  calendarId?: string;
  startDate?: string; // ISO format
  endDate?: string;   // ISO format
  contactId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

// Contact Types
export interface GHLContact {
  id?: string;
  locationId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  source?: string;
  tags?: string[];
  customFields?: Array<{
    id: string;
    value: string;
  }>;
}

export interface GHLCreateContactRequest {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  source?: string;
  tags?: string[];
  customFields?: Array<{
    id: string;
    value: string;
  }>;
}

// Calendar Types
export interface GHLCalendar {
  id: string;
  name: string;
  description?: string;
  locationId: string;
  groupId?: string;
  isActive: boolean;
  openHours?: Array<{
    daysOfTheWeek: number[];
    hours: Array<{
      openHour: number;
      openMinute: number;
      closeHour: number;
      closeMinute: number;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

// User Types
export interface GHLUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  extension?: string;
  permissions: {
    campaignsEnabled: boolean;
    campaignsReadOnly: boolean;
    contactsEnabled: boolean;
    workflowsEnabled: boolean;
    workflowsReadOnly: boolean;
    triggersEnabled: boolean;
    funnelsEnabled: boolean;
    websitesEnabled: boolean;
    opportunitiesEnabled: boolean;
    dashboardStatsEnabled: boolean;
    bulkRequestsEnabled: boolean;
    appointmentsEnabled: boolean;
    reviewsEnabled: boolean;
    onlineListingsEnabled: boolean;
    phoneCallEnabled: boolean;
    conversationsEnabled: boolean;
    assignedDataOnly: boolean;
    adwordsReportingEnabled: boolean;
    membershipEnabled: boolean;
    facebookAdsReportingEnabled: boolean;
    attributionsReportingEnabled: boolean;
    socialPlanner: boolean;
    bloggingEnabled: boolean;
    invoiceEnabled: boolean;
    affiliateManagerEnabled: boolean;
    contentAiEnabled: boolean;
    refundsEnabled: boolean;
    recordPaymentEnabled: boolean;
    cancelSubscriptionEnabled: boolean;
    paymentsEnabled: boolean;
    communitiesEnabled: boolean;
    exportPaymentsEnabled: boolean;
  };
  roles: {
    type: string;
    role: string;
    locationIds: string[];
  };
  deleted: boolean;
}

// Webhook Types
export interface GHLWebhookEvent {
  type: string;
  id: string;
  locationId: string;
  eventId?: string;
  appointmentId?: string;
  calendarEvent?: GHLEventResponse;
  contact?: GHLContact;
  timestamp: string;
}

// Error Types
export interface GHLErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}