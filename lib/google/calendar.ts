import { google } from 'googleapis';
import { decrypt } from './encryption';
import { createOAuthClient } from './oauth';

export async function createGoogleCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventDetails: {
    summary: string;
    description?: string;
    startTime: string;
    endTime: string;
    timeZone: string;
    attendees?: { email: string }[];
  },
) {
  try {
    // Decrypt tokens
    const decryptedAccessToken = decrypt(accessToken);
    const decryptedRefreshToken = decrypt(refreshToken);

    const auth = createOAuthClient(decryptedAccessToken, decryptedRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.startTime,
        timeZone: eventDetails.timeZone,
      },
      end: {
        dateTime: eventDetails.endTime,
        timeZone: eventDetails.timeZone,
      },
      attendees: eventDetails.attendees || [],
      conferenceData: {
        createRequest: {
          requestId: `calma-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
    });

    return {
      eventId: response.data.id,
      meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri || null,
    };
  } catch (error) {
    console.error('Failed to create Google Calendar event:', error);
    throw error;
  }
}

export async function getCalendarEvents(
  accessToken: string,
  refreshToken: string,
  timeMin: string,
  timeMax: string,
) {
  try {
    const decryptedAccessToken = decrypt(accessToken);
    const decryptedRefreshToken = decrypt(refreshToken);

    const auth = createOAuthClient(decryptedAccessToken, decryptedRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    throw error;
  }
}

export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
) {
  try {
    const decryptedAccessToken = decrypt(accessToken);
    const decryptedRefreshToken = decrypt(refreshToken);

    const auth = createOAuthClient(decryptedAccessToken, decryptedRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    return true;
  } catch (error) {
    console.error('Failed to delete calendar event:', error);
    throw error;
  }
}

export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  eventDetails: {
    summary?: string;
    description?: string;
    startTime: string;
    endTime: string;
    timeZone: string;
    attendees?: { email: string }[];
  },
) {
  try {
    const decryptedAccessToken = decrypt(accessToken);
    const decryptedRefreshToken = decrypt(refreshToken);

    const auth = createOAuthClient(decryptedAccessToken, decryptedRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    // First get the existing event to preserve fields we don't want to change
    const existingEvent = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    const event = {
      summary: eventDetails.summary || existingEvent.data.summary,
      description:
        eventDetails.description !== undefined
          ? eventDetails.description
          : existingEvent.data.description,
      start: {
        dateTime: eventDetails.startTime,
        timeZone: eventDetails.timeZone,
      },
      end: {
        dateTime: eventDetails.endTime,
        timeZone: eventDetails.timeZone,
      },
      attendees: eventDetails.attendees || existingEvent.data.attendees,
      conferenceData: existingEvent.data.conferenceData,
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: event,
      conferenceDataVersion: 1,
    });

    return {
      eventId: response.data.id,
      meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri || null,
    };
  } catch (error) {
    console.error('Failed to update Google Calendar event:', error);
    throw error;
  }
}
