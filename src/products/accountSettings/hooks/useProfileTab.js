import { useState, useEffect } from 'react';
import { useAuth } from 'src/core/auth/hooks/useAuth';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { AUTH_EVENTS } from 'src/core/auth/constants/constants.js';

/**
 * State for the Profile tab: name/company editing against the auth
 * context's own updateProfile. Moved out of the tab component unchanged.
 */
export function useProfileTab() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [saving, setSaving] = useState(false);

  // `user` arrives asynchronously (AuthContext refetches on mount), so seed the
  // fields once it lands rather than at first render.
  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setCompanyName(user.companyName || '');
  }, [user]);

  const dirty =
    !!user && (name !== (user.name || '') || companyName !== (user.companyName || ''));

  const handleSave = (e) => {
    e.preventDefault();
    if (!dirty || saving) return;

    setSaving(true);
    const emitter = updateProfile({ name: name.trim(), companyName: companyName.trim() });
    emitter.once(AUTH_EVENTS.UPDATE_PROFILE_SUCCESS, () => {
      setSaving(false);
      toast.success('Profile saved');
    });
    emitter.once(AUTH_EVENTS.UPDATE_PROFILE_FAILURE, (err) => {
      setSaving(false);
      toast.error(getToastError(err, "Couldn't save your profile"));
    });
  };

  return { user, name, setName, companyName, setCompanyName, saving, dirty, handleSave };
}
