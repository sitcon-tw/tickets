"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { authAPI, eventsAPI } from '@/lib/api/endpoints';
import { TicketFormField } from '@/lib/types/api';

interface FormParams {
  selectedTicketId: string | null;
  invitationCode: string | null;
  referralCode: string | null;
  eventName: string;
  ticketName: string;
}

export function useFormInit(noTicketAlertText: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<TicketFormField[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [params, setParams] = useState<FormParams>({
    selectedTicketId: null,
    invitationCode: null,
    referralCode: null,
    eventName: '',
    ticketName: ''
  });

  // Parse URL parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const ticketIdParam = urlParams.get('ticket') || sessionStorage.getItem('selectedTicketId');
    const inviteParam = urlParams.get('invite') || sessionStorage.getItem('invitationCode');
    const refParam = urlParams.get('ref') || sessionStorage.getItem('referralCode');
    const eventNameParam = sessionStorage.getItem('selectedEventName') || urlParams.get('eventName');
    const ticketNameParam = sessionStorage.getItem('selectedTicketName') || urlParams.get('ticketType');

    setParams({
      selectedTicketId: ticketIdParam,
      invitationCode: inviteParam,
      referralCode: refParam,
      eventName: eventNameParam || '',
      ticketName: ticketNameParam || ''
    });
  }, []);

  // Check authentication
  const checkAuth = useCallback(async () => {
    try {
      const session = await authAPI.getSession();
      if (!session || !session.user) {
        router.push('/login/');
        return false;
      }

      if (session.user.email) {
        setUserEmail(session.user.email);
      }

      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login/');
      return false;
    }
  }, [router]);

  // Load form fields
  const loadFormFields = useCallback(async () => {
    if (!params.selectedTicketId) {
      alert(noTicketAlertText);
      router.push('/');
      return;
    }

    try {
      const eventsData = await eventsAPI.getAll();

      if (!eventsData.success || !eventsData.data.length) {
        throw new Error('No active events found');
      }

      const fetchedEventId = eventsData.data[0].id;
      setEventId(fetchedEventId);

      const ticketsData = await eventsAPI.getTickets(fetchedEventId);

      if (!ticketsData.success) {
        throw new Error('Failed to load tickets');
      }

      const ticket = ticketsData.data.find((t: { id: string }) => t.id === params.selectedTicketId);
      if (!ticket) {
        throw new Error('Selected ticket not found');
      }

      setFormFields(ticket.formFields || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load form fields:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    }
  }, [params.selectedTicketId, router, noTicketAlertText]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) return;

      await loadFormFields();
    };

    init();
  }, [checkAuth, loadFormFields]);

  return {
    loading,
    error,
    formFields,
    eventId,
    userEmail,
    ...params
  };
}
