'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { NotificationPreferences } from './use-notifications';

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .single();

    if (!error && data) {
      setPreferences(data as NotificationPreferences);
    } else if (error?.code === 'PGRST116') {
      // No row exists — create default
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: newPrefs } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();
        if (newPrefs) {
          setPreferences(newPrefs as NotificationPreferences);
        }
      }
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPreferences();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update a specific preference field
  const updatePreference = useCallback(async (
    key: keyof Omit<NotificationPreferences, 'id' | 'user_id'>,
    value: boolean
  ) => {
    if (!supabase || !preferences) return;

    setSaving(true);

    // Optimistic update
    setPreferences((prev) => prev ? { ...prev, [key]: value } : prev);

    const { error } = await supabase
      .from('notification_preferences')
      .update({ [key]: value })
      .eq('id', preferences.id);

    if (error) {
      // Revert on error
      setPreferences((prev) => prev ? { ...prev, [key]: !value } : prev);
      console.error('Error updating preference:', error);
    }

    setSaving(false);
  }, [supabase, preferences]);

  // Batch update multiple preferences
  const updatePreferences = useCallback(async (
    updates: Partial<Omit<NotificationPreferences, 'id' | 'user_id'>>
  ) => {
    if (!supabase || !preferences) return;

    setSaving(true);

    const oldPrefs = { ...preferences };
    setPreferences((prev) => prev ? { ...prev, ...updates } : prev);

    const { error } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('id', preferences.id);

    if (error) {
      setPreferences(oldPrefs);
      console.error('Error updating preferences:', error);
    }

    setSaving(false);
  }, [supabase, preferences]);

  return {
    preferences,
    loading,
    saving,
    updatePreference,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
