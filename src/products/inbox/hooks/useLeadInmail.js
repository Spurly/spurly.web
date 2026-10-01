import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import inboxController from '../controller/inbox.js';
import { INBOX_EVENTS as E, INMAIL_TEXT_MAX } from '../constants/constants.js';

/**
 * InMail to one lead (lead drawer). Costs a credit, so it is its own explicit
 * form. The draft survives a failure; an unconfirmed send is never offered a
 * plain retry (it may have gone out and used a credit).
 */
export function useLeadInmail(leadId) {
  const em = useMemo(() => new EventEmitter(), []);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onSuccess = () => {
      setSending(false); setSent(true); setOpen(false); setText(''); setSubject('');
      toast.success('InMail sent');
    };
    const onFailure = ({ code, error }) => {
      setSending(false);
      if (code === 'SEND_UNCONFIRMED') toast.error('LinkedIn did not confirm that InMail. Check LinkedIn before sending again: it may have gone out.');
      else if (code === 'ALREADY_CONNECTED') toast.error('You are already connected. Send a normal message instead.');
      else toast.error(getToastError(error, 'Could not send that InMail'));
    };
    em.on(E.INMAIL_SUCCESS, onSuccess);
    em.on(E.INMAIL_FAILURE, onFailure);
    return () => { em.off(E.INMAIL_SUCCESS, onSuccess); em.off(E.INMAIL_FAILURE, onFailure); };
  }, [em, toast]);

  const send = useCallback(() => {
    const body = text.trim();
    if (!body || sending || body.length > INMAIL_TEXT_MAX) return;
    setSending(true);
    inboxController.sendInmail(em, leadId, { subject: subject.trim(), text: body });
  }, [em, leadId, text, subject, sending]);

  return { open, setOpen, subject, setSubject, text, setText, sending, sent, send };
}
