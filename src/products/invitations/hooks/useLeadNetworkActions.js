import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from 'src/core/primitives';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import hubInvitationsController from '../controller/invitations.js';
import { INVITATIONS_EVENTS as E } from '../constants/constants.js';
import { errorText } from './useInvitationsPage.js';

/**
 * Follow and endorse for one lead (the lead drawer). Skills load only when the
 * person asks to endorse: it is a LinkedIn profile read, not something to do on
 * every drawer open. Nothing is optimistic.
 */
export function useLeadNetworkActions(leadId) {
  const em = useMemo(() => new EventEmitter(), []);
  const toast = useToast();
  const [following, setFollowing] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [skills, setSkills] = useState({ loading: false, loaded: false, list: [], open: false });
  const [endorsing, setEndorsing] = useState('');
  const [endorsed, setEndorsed] = useState(() => new Set());

  useEffect(() => {
    const handlers = {
      [E.FOLLOW_SUCCESS]: () => { setFollowing(false); setFollowed(true); toast.success('Now following'); },
      [E.FOLLOW_FAILURE]: (error) => { setFollowing(false); toast.error(errorText(error, 'Could not follow this person')); },
      [E.SKILLS_SUCCESS]: (d) => setSkills({ loading: false, loaded: true, list: d.skills ?? [], open: true }),
      [E.SKILLS_FAILURE]: (error) => {
        setSkills((prev) => ({ ...prev, loading: false, open: false }));
        toast.error(errorText(error, 'Could not read this person’s skills'));
      },
      [E.ENDORSE_SUCCESS]: ({ skillName }) => {
        setEndorsing('');
        setEndorsed((prev) => new Set(prev).add(skillName));
        toast.success(`Endorsed ${skillName}`);
      },
      [E.ENDORSE_FAILURE]: (error) => { setEndorsing(''); toast.error(errorText(error, 'Could not endorse this skill')); },
    };
    Object.entries(handlers).forEach(([event, fn]) => em.on(event, fn));
    return () => Object.entries(handlers).forEach(([event, fn]) => em.off(event, fn));
  }, [em, toast]);

  const follow = useCallback(() => {
    setFollowing(true);
    hubInvitationsController.followLead(em, leadId);
  }, [em, leadId]);

  const openEndorse = useCallback(() => {
    if (skills.loaded) { setSkills((prev) => ({ ...prev, open: !prev.open })); return; }
    setSkills((prev) => ({ ...prev, loading: true }));
    hubInvitationsController.getLeadSkills(em, leadId);
  }, [em, leadId, skills.loaded]);

  const endorse = useCallback((skillName) => {
    setEndorsing(skillName);
    hubInvitationsController.endorseLead(em, { leadId, skillName });
  }, [em, leadId]);

  return { follow, following, followed, skills, openEndorse, endorse, endorsing, endorsed };
}
