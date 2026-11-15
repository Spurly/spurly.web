import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import sequenceController from '../controller/sequence.js';
import { JOURNEY_POLL_MS, SEQUENCE_EVENTS } from '../constants/constants.js';
import { hasMovers } from '../journeyModel.js';

/**
 * The Journey view's data: where every lead is (flow-state), the one lead whose drawer is open, the sender filter, and
 * the retry actions. Polls while anyone is still moving through the tree, not only while the sequence is `running`:
 * a paused sequence's positions are still true, and a lead can finish a wait on its own.
 */
export function useSequenceJourney({ id, enabled = true, version = '' }) {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const toast = useToast();
  const mountedRef = useRef(true);
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [senderId, setSenderId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(() => { sequenceController.getFlowState(eventEmitter, id); }, [eventEmitter, id]);
  const loadDetail = useCallback((enrollmentId) => { sequenceController.getEnrollment(eventEmitter, id, enrollmentId); }, [eventEmitter, id]);

  const openLead = useCallback((enrollmentId) => {
    setOpenId(enrollmentId);
    setDetail(null);
    if (enrollmentId) loadDetail(enrollmentId);
  }, [loadDetail]);

  const retryLead = useCallback((enrollmentId) => {
    setRetrying(true);
    sequenceController.retryEnrollment(eventEmitter, id, enrollmentId);
  }, [eventEmitter, id]);

  const retryAll = useCallback((options) => {
    setRetrying(true);
    sequenceController.retryFailed(eventEmitter, id, options);
  }, [eventEmitter, id]);

  useEffect(() => {
    function onFlow(next) {
      if (!mountedRef.current) return;
      setFlow(next);
      setLoading(false);
    }
    function onFlowFailure(error) {
      if (!mountedRef.current) return;
      toast.error(getToastError(error, 'Could not load the journey'));
      setLoading(false);
    }
    function onDetail(next) { if (mountedRef.current) setDetail(next); }
    function onDetailFailure(error) {
      if (!mountedRef.current) return;
      toast.error(getToastError(error, 'Could not load that lead'));
    }
    function onRetried(result) {
      if (!mountedRef.current) return;
      setRetrying(false);
      const n = result?.retried ?? 0;
      if (n > 0) toast.success(n === 1 ? 'Back in the queue' : `${n} leads back in the queue`);
      else toast.error('Nothing could be retried. They may have been sent already, or their step was removed.');
      load();
      setOpenId((cur) => { if (cur) loadDetail(cur); return cur; });
    }
    function onRetryFailure(error) {
      if (!mountedRef.current) return;
      setRetrying(false);
      toast.error(getToastError(error, 'Could not retry'));
    }
    eventEmitter.on(SEQUENCE_EVENTS.GET_FLOW_STATE_SUCCESS, onFlow);
    eventEmitter.on(SEQUENCE_EVENTS.GET_FLOW_STATE_FAILURE, onFlowFailure);
    eventEmitter.on(SEQUENCE_EVENTS.GET_ENROLLMENT_SUCCESS, onDetail);
    eventEmitter.on(SEQUENCE_EVENTS.GET_ENROLLMENT_FAILURE, onDetailFailure);
    eventEmitter.on(SEQUENCE_EVENTS.RETRY_ENROLLMENT_SUCCESS, onRetried);
    eventEmitter.on(SEQUENCE_EVENTS.RETRY_ENROLLMENT_FAILURE, onRetryFailure);
    eventEmitter.on(SEQUENCE_EVENTS.RETRY_FAILED_SUCCESS, onRetried);
    eventEmitter.on(SEQUENCE_EVENTS.RETRY_FAILED_FAILURE, onRetryFailure);
    return () => {
      eventEmitter.off(SEQUENCE_EVENTS.GET_FLOW_STATE_SUCCESS, onFlow);
      eventEmitter.off(SEQUENCE_EVENTS.GET_FLOW_STATE_FAILURE, onFlowFailure);
      eventEmitter.off(SEQUENCE_EVENTS.GET_ENROLLMENT_SUCCESS, onDetail);
      eventEmitter.off(SEQUENCE_EVENTS.GET_ENROLLMENT_FAILURE, onDetailFailure);
      eventEmitter.off(SEQUENCE_EVENTS.RETRY_ENROLLMENT_SUCCESS, onRetried);
      eventEmitter.off(SEQUENCE_EVENTS.RETRY_ENROLLMENT_FAILURE, onRetryFailure);
      eventEmitter.off(SEQUENCE_EVENTS.RETRY_FAILED_SUCCESS, onRetried);
      eventEmitter.off(SEQUENCE_EVENTS.RETRY_FAILED_FAILURE, onRetryFailure);
    };
  }, [eventEmitter, load, loadDetail, toast]);

  // `version` changes when the plan is edited, so the new step shows up without waiting for the next poll.
  useEffect(() => { if (enabled) load(); }, [enabled, load, version]);

  const moving = hasMovers(flow);
  useEffect(() => {
    if (!enabled || !moving) return undefined;
    const t = setInterval(() => {
      load();
      if (openId) loadDetail(openId);
    }, JOURNEY_POLL_MS);
    return () => clearInterval(t);
  }, [enabled, moving, load, loadDetail, openId]);

  return { flow, loading, senderId, setSenderId, openId, openLead, detail, retrying, retryLead, retryAll, reload: load };
}
