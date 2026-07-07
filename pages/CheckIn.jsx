import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';
import { theme, ACCENT } from '../lib/theme';
import {
  currentWeekStart,
  isMondayInBrisbane,
  pointsForToday,
  weekNumber,
  weekRangeLabel,
} from '../lib/dates';
import { resizeAndUpload, signedUrl, removeIgnore } from '../lib/upload';

import Page from '../components/ui/Page';
import AppBar from '../components/ui/AppBar';
import StepDots from '../components/ui/StepDots';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const NOTE_LIMIT = 280;

export default function CheckIn() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const userId = session?.user?.id;
  const stepParam = sp.get('step') === '2' ? 2 : 1;

  // ── Component-level state ────────────────────────────
  const [guardChecked, setGuardChecked] = useState(false);
  const [lastWeek, setLastWeek] = useState(null); // { weight_kg, week_start } | null
  const [scaleFile, setScaleFile] = useState(null); // File kept in memory across steps
  const [scalePreview, setScalePreview] = useState(null);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // Synchronous re-entrancy latch. `submitting` is React state, so it doesn't
  // flip until the next render — a fast double-tap can re-enter submit() before
  // the button disables. This closes that window immediately. See submit().
  const submitLockRef = useRef(false);
  const [result, setResult] = useState(null); // { row, awardedValue, scaleUrl, partial }

  // Note: weekStartAtMount is for *display only* (banner copy, week labels).
  // The submit handler re-reads currentWeekStart() inside itself — see the
  // comment on submit() for why this matters at Sun→Mon rollover.
  const weekStartAtMount = useMemo(() => currentWeekStart(), []);
  const lateAtMount = !isMondayInBrisbane();
  const todaysPoints = useMemo(() => pointsForToday(), []);

  // ── Guard at mount: already checked in this week? bounce to /app ──
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', userId)
        .eq('week_start', weekStartAtMount)
        .maybeSingle();
      if (cancelled) return;
      if (err) {
        // Don't bounce on read error — let the user try the form. The unique
        // constraint will catch a true double-submit at insert time.
        console.warn('checkin guard read failed:', err.message);
      } else if (data) {
        navigate('/app', { replace: true });
        return;
      }
      setGuardChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, weekStartAtMount, navigate]);

  // ── Last-week comparison: most recent prior check-in for this user ──
  // Skipped weeks would null out a "literal previous week" query, so we
  // sort and take the latest. Hidden entirely if no prior row exists.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from('check_ins')
        .select('weight_kg, week_start')
        .eq('user_id', userId)
        .lt('week_start', weekStartAtMount)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (!err && data) setLastWeek(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, weekStartAtMount]);

  // ── Step 1 → Step 2 navigation gated on having a scale photo ──
  function goStep(n) {
    setError(null);
    setSp({ step: String(n) });
  }

  function handleScalePick(file) {
    if (!file) return;
    setError(null);
    setScaleFile(file);
    if (scalePreview) URL.revokeObjectURL(scalePreview);
    setScalePreview(URL.createObjectURL(file));
  }

  // Clean up preview URL on unmount
  useEffect(() => () => {
    if (scalePreview) URL.revokeObjectURL(scalePreview);
  }, [scalePreview]);

  // ── The submit sequence (see PLAN.md Phase 2 → CheckIn → submit) ──
  async function submit() {
    if (!userId || !scaleFile) return;
    const weightNum = Number(weight);
    if (!Number.isFinite(weightNum) || weightNum <= 0) return;
    if (note.trim().length === 0) return;

    // Re-entrancy latch (see submitLockRef). A second concurrent submit would
    // re-upload to the same deterministic path and then hit the unique
    // constraint on insert — the cleanup path below must never run against a
    // path a committed row already owns.
    if (submitLockRef.current) return;
    submitLockRef.current = true;

    setError(null);
    setSubmitting(true);

    try {
      // CRITICAL: re-read currentWeekStart() *inside* the handler. A user lingering
      // on the form across Sun 23:59 → Mon 00:01 Brisbane would otherwise insert
      // against the previous Monday, the trigger would no-op, AND they'd be locked
      // out of this Monday's check-in. weekStartAtMount is for display only.
      const weekStart = currentWeekStart();
      const path = `${userId}/checkin/${weekStart}/scale.jpg`;

      const { error: upErr } = await resizeAndUpload(scaleFile, path);
      if (upErr) {
        setError(`Upload failed: ${upErr.message || 'unknown error'}`);
        return;
      }

      const { data: inserted, error: insErr } = await supabase
        .from('check_ins')
        .insert({
          user_id: userId,
          week_start: weekStart,
          scale_photo_path: path,
          weight_kg: weightNum,
          note: note.trim(),
        })
        .select('id, week_start, weight_kg, note, scale_photo_path, submitted_at')
        .single();

      if (insErr || !inserted) {
        // A unique-constraint violation (Postgres 23505) means a check-in for
        // this (user, week) already exists — and it references this exact
        // deterministic path, whose photo our upsert just overwrote. Deleting
        // the object here would destroy that existing check-in's scale photo,
        // so skip cleanup. For any other failure the upload is a true orphan
        // (no row points at it) and removing it is correct.
        if (insErr?.code === '23505') {
          setError("You've already checked in this week.");
        } else {
          await removeIgnore(path);
          setError(`Save failed: ${insErr ? insErr.message : 'no row returned'}`);
        }
        return;
      }

      // Re-read the row joined to its weekly_checkin points row. The trigger is
      // the source of truth for how many points were awarded — never infer from
      // the client clock, because the per-day 30-min grace lives in the trigger
      // and the UI must reflect what the trigger actually did. Key off the
      // server-stamped inserted.week_start (migration 0019 derives it from the
      // commit instant), which can differ from our pre-submit `weekStart` right
      // at the Sun→Mon rollover — the points row lives under the server's value.
      const { data: pointsRow, error: pErr } = await supabase
        .from('points')
        .select('value')
        .eq('user_id', userId)
        .eq('week_start', inserted.week_start)
        .eq('category', 'weekly_checkin')
        .maybeSingle();

      const { url: scaleUrl } = await signedUrl(path);

      // Re-read failure is non-fatal: the check-in IS recorded. Show the
      // confirmation with partial=true so the user knows points status is unknown.
      if (pErr) {
        console.warn('points re-read failed:', pErr.message);
        setResult({ row: inserted, awardedValue: null, scaleUrl, partial: true });
      } else {
        setResult({
          row: inserted,
          awardedValue: pointsRow ? pointsRow.value : null,
          scaleUrl,
          partial: false,
        });
      }
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  }

  // ── Render branches ──────────────────────────────────
  if (!guardChecked) {
    return (
      <Page appBar={<AppBar userName={profile?.display_name} avatarSrc={profile?.avatar_url} />}>
        <div style={{ padding: '40px 0', textAlign: 'center', color: theme.textSec }}>
          Loading…
        </div>
      </Page>
    );
  }

  if (result) {
    return (
      <Page appBar={<AppBar userName={profile?.display_name} avatarSrc={profile?.avatar_url} />}>
        <ConfirmationView
          result={result}
          weekStart={result.row.week_start}
          onBack={() => navigate('/app')}
        />
      </Page>
    );
  }

  return (
    <Page appBar={<AppBar userName={profile?.display_name} avatarSrc={profile?.avatar_url} />}>
      <div style={{ padding: '20px 0 32px' }}>
        <div style={{ marginBottom: 22 }}>
          <StepDots step={stepParam - 1} total={2} />
        </div>

        {lateAtMount && <LateBanner points={todaysPoints} />}

        {error && (
          <div
            style={{
              background: '#EF535018',
              border: '1px solid #EF535055',
              color: '#EF5350',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 13,
              marginTop: 12,
              fontFamily: theme.bd,
            }}
          >
            {error}
          </div>
        )}

        {stepParam === 1 ? (
          <StepScale
            preview={scalePreview}
            onPick={handleScalePick}
            onNext={() => goStep(2)}
            onCancel={() => navigate('/app')}
          />
        ) : (
          <StepWeightNote
            weight={weight}
            setWeight={setWeight}
            note={note}
            setNote={setNote}
            lastWeek={lastWeek}
            submitting={submitting}
            onBack={() => goStep(1)}
            onSubmit={submit}
            weekStartLabel={weekStartAtMount}
          />
        )}
      </div>
    </Page>
  );
}

// ── Step 1: scale photo capture ───────────────────────
function StepScale({ preview, onPick, onNext, onCancel }) {
  // Two separate <input>s: the camera one carries `capture="environment"` so
  // mobile opens the rear camera directly; the library one omits `capture`
  // so the picker shows the photo roll. A single input with `capture` skips
  // the library entirely on most mobile browsers.
  const cameraInputRef = useRef(null);
  const libraryInputRef = useRef(null);

  function handleChange(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (f) onPick(f);
  }

  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>📸</div>
        <h1 style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 22, margin: 0 }}>
          Scale Photo
        </h1>
        <div style={{ fontFamily: theme.bd, fontSize: 13, color: theme.textSec, marginTop: 6 }}>
          Snap a pic of the scale reading
        </div>
      </div>

      <div
        onClick={() => cameraInputRef.current && cameraInputRef.current.click()}
        role="button"
        tabIndex={0}
        style={{
          margin: '0 auto 18px',
          maxWidth: 260,
          aspectRatio: '4 / 3',
          border: preview ? 'none' : `2px dashed ${theme.textMut}`,
          borderRadius: 18,
          background: theme.surface,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          cursor: 'pointer',
        }}
      >
        {preview ? (
          <img src={preview} alt="scale preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: ACCENT,
                color: theme.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                marginBottom: 10,
              }}
            >
              📷
            </div>
            <div style={{ fontFamily: theme.hd, fontWeight: 500, fontSize: 14, color: theme.text }}>
              Tap to capture
            </div>
          </>
        )}
      </div>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <button
          type="button"
          onClick={() => libraryInputRef.current && libraryInputRef.current.click()}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.textSec,
            fontFamily: theme.hd,
            fontWeight: 500,
            fontSize: 12,
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          or upload from library
        </button>
      </div>

      <Button full disabled={!preview} onClick={onNext}>
        Next →
      </Button>

      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.textMut,
            fontFamily: theme.hd,
            fontWeight: 500,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Step 2: weight + note ─────────────────────────────
function StepWeightNote({ weight, setWeight, note, setNote, lastWeek, submitting, onBack, onSubmit, weekStartLabel }) {
  const weightInputRef = useRef(null);
  const weightNum = Number(weight);
  const validWeight = Number.isFinite(weightNum) && weightNum > 0;
  const validNote = note.trim().length > 0;
  const canSubmit = validWeight && validNote && !submitting;

  const delta = (validWeight && lastWeek)
    ? Number((weightNum - Number(lastWeek.weight_kg)).toFixed(1))
    : null;

  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: theme.hd, fontWeight: 600, fontSize: 15, color: theme.text, marginBottom: 8 }}>
          Your Weight
        </div>
        <Card>
          <div
            onClick={() => weightInputRef.current && weightInputRef.current.focus()}
            style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', cursor: 'text', minHeight: 60 }}
          >
            <span style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 44, color: validWeight ? theme.text : theme.textMut }}>
              {validWeight ? weight : '—'}
            </span>
            <span style={{ fontFamily: theme.hd, fontWeight: 500, fontSize: 18, color: theme.textMut, marginLeft: 6 }}>
              kg
            </span>
          </div>
          <div style={{ width: 60, height: 2, background: ACCENT, margin: '6px auto 0', borderRadius: 1 }} />
          <input
            ref={weightInputRef}
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Tap to enter your weight"
            aria-label="Weight in kilograms"
            style={{
              marginTop: 12,
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              borderBottom: `1px solid ${theme.border}`,
              color: theme.text,
              fontFamily: theme.bd,
              fontSize: 15,
              padding: '8px 0',
              textAlign: 'center',
            }}
          />
        </Card>

        {/* Comparison pill — only when we have both a typed weight AND a prior check-in */}
        {delta != null && (
          <div
            style={{
              marginTop: 10,
              fontFamily: theme.hd,
              fontWeight: 500,
              fontSize: 13,
              color: theme.textSec,
              textAlign: 'center',
            }}
          >
            {delta < 0 ? '↓' : delta > 0 ? '↑' : '·'} {Math.abs(delta).toFixed(1)} kg
            {delta < 0 ? ' less ' : delta > 0 ? ' more ' : ' same as '}
            than last week ({lastWeek.weight_kg})
          </div>
        )}
      </div>

      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: theme.hd, fontWeight: 600, fontSize: 15 }}>How'd your week go?</span>
          <span style={{ fontFamily: theme.bd, fontSize: 12, color: theme.textSec }}>One sentence is plenty</span>
        </div>
        <div
          style={{
            background: theme.surface,
            border: `1px solid ${ACCENT}38`,
            borderRadius: 14,
            padding: 12,
            position: 'relative',
          }}
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, NOTE_LIMIT))}
            placeholder="Solid week, hit the gym 4x…"
            rows={4}
            style={{
              width: '100%',
              minHeight: 100,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              color: theme.text,
              fontFamily: theme.bd,
              fontSize: 14,
              lineHeight: 1.5,
              boxSizing: 'border-box',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 10,
              bottom: 8,
              fontFamily: theme.hd,
              fontWeight: 500,
              fontSize: 11,
              color: theme.textMut,
            }}
          >
            {note.length}/{NOTE_LIMIT}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Button variant="secondary" full disabled={submitting} onClick={onBack}>
            ← Back
          </Button>
        </div>
        <div style={{ flex: 2 }}>
          <Button full disabled={!canSubmit} onClick={onSubmit}>
            {submitting ? 'Submitting…' : 'Submit ✓'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Late banner ─────────────────────────────────────────
function LateBanner({ points }) {
  const message = points > 0
    ? `Late check-in · submit today for +${points} pts (5 on Mon, 4 Tue, 3 Wed, 2 Thu, 1 Fri).`
    : "Late check-in · this won't score any points but will still appear in your history and Activity feed.";
  return (
    <div
      style={{
        background: theme.surfaceBright,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
      }}
    >
      <span style={{ fontSize: 18 }}>⏰</span>
      <div style={{ fontFamily: theme.bd, fontSize: 13, color: theme.textSec, lineHeight: 1.45 }}>
        {message}
      </div>
    </div>
  );
}

// ── Confirmation view (two variants) ──────────────────
function ConfirmationView({ result, weekStart, onBack }) {
  const { row, awardedValue, scaleUrl, partial } = result;
  const awarded = awardedValue != null && awardedValue > 0;
  const fullCredit = awardedValue === 5;
  const wk = weekNumber(weekStart);
  const rangeStr = weekRangeLabel(weekStart);

  return (
    <div style={{ padding: '40px 0 24px', textAlign: 'center', position: 'relative' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 240,
          height: 240,
          background: fullCredit ? `${ACCENT}20` : 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 60, marginBottom: 10 }}>{fullCredit ? '🔥' : awarded ? '⏰' : '⏰'}</div>
        <h1 style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 28, margin: '0 0 6px' }}>
          {awarded ? `Locked in! +${awardedValue} pts` : 'Locked in · late check-in'}
        </h1>
        <div style={{ fontFamily: theme.hd, fontWeight: 500, fontSize: 15, color: ACCENT, marginBottom: 6 }}>
          Week {wk} · {rangeStr}
        </div>
        {awarded && !fullCredit && !partial && (
          <div style={{ fontFamily: theme.bd, fontSize: 13, color: theme.textSec, marginBottom: 18, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
            Late check-in · partial credit. Earlier in the week = more pts.
          </div>
        )}
        {!awarded && !partial && (
          <div style={{ fontFamily: theme.bd, fontSize: 13, color: theme.textSec, marginBottom: 18, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
            Didn't score any pts, but your weight + note are saved.
          </div>
        )}
        {partial && (
          <div style={{ fontFamily: theme.bd, fontSize: 12, color: theme.textMut, marginBottom: 18, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
            Couldn't fetch points status — refresh Home in a moment.
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <Card>
            <div style={{ fontFamily: theme.hd, fontWeight: 600, fontSize: 12, color: theme.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, textAlign: 'left' }}>
              Summary
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  background: theme.surfaceBright,
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {scaleUrl ? (
                  <img src={scaleUrl} alt="scale" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: theme.textMut }}>📷</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 20 }}>
                  {Number(row.weight_kg).toFixed(1)} kg
                </div>
                <div
                  style={{
                    fontFamily: theme.bd,
                    fontSize: 13,
                    color: theme.textSec,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {row.note}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div style={{ marginTop: 24 }}>
          <Button full onClick={onBack}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
