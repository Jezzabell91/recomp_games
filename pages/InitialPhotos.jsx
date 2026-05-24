import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';
import { theme, ACCENT } from '../lib/theme';
import { resizeAndUpload, signedUrl, removeIgnore } from '../lib/upload';

import Page from '../components/ui/Page';
import AppBar from '../components/ui/AppBar';
import StepDots from '../components/ui/StepDots';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const POSES = ['front', 'side', 'back'];
const POSE_HINTS = {
  front: 'Face the camera, arms relaxed at sides',
  side:  'Side-on, arms relaxed',
  back:  'Back to the camera, arms relaxed',
};

function poseFromSearch(sp) {
  const raw = (sp.get('pose') || 'front').toLowerCase();
  return POSES.includes(raw) ? raw : 'front';
}

export default function InitialPhotos() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const pose = poseFromSearch(sp);
  const stepIndex = POSES.indexOf(pose);

  const [uploadedPoses, setUploadedPoses] = useState(null); // Set<pose> | null while loading
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [thumbs, setThumbs] = useState({}); // { pose: signedUrl }

  const userId = session?.user?.id;

  // Load existing initial_photos rows for this user. Drives the Done view
  // and the "already done" pose skip-ahead.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from('initial_photos')
        .select('pose, storage_path')
        .eq('user_id', userId);
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setUploadedPoses(new Set());
        return;
      }
      const set = new Set((data || []).map((r) => r.pose));
      setUploadedPoses(set);

      const paths = (data || []).map((r) => r.storage_path);
      if (paths.length) {
        const { data: signed } = await supabase.storage
          .from('photos')
          .createSignedUrls(paths, 60 * 60 * 24);
        if (cancelled || !signed) return;
        const map = {};
        (data || []).forEach((r, i) => {
          const s = signed[i];
          if (s && s.signedUrl) map[r.pose] = s.signedUrl;
        });
        setThumbs(map);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const allDone = uploadedPoses && uploadedPoses.size >= POSES.length;

  // ── Upload handler ────────────────────────────────────────
  async function handleFile(file) {
    if (!file || !userId) return;
    setError(null);
    setBusy(true);

    const path = `${userId}/initial/${pose}.jpg`;
    const { error: upErr } = await resizeAndUpload(file, path);
    if (upErr) {
      setError(`Upload failed: ${upErr.message || 'unknown error'}`);
      setBusy(false);
      return;
    }

    const { error: insErr } = await supabase
      .from('initial_photos')
      .upsert(
        { user_id: userId, pose, storage_path: path },
        { onConflict: 'user_id,pose' },
      );

    if (insErr) {
      await removeIgnore(path);
      setError(`Save failed: ${insErr.message}`);
      setBusy(false);
      return;
    }

    const next = new Set(uploadedPoses || []);
    next.add(pose);
    setUploadedPoses(next);

    const { url } = await signedUrl(path);
    if (url) setThumbs((m) => ({ ...m, [pose]: url }));

    setBusy(false);
    advance();
  }

  function advance() {
    const nextIdx = stepIndex + 1;
    if (nextIdx >= POSES.length) return; // Done view rendered by allDone branch
    setSp({ pose: POSES[nextIdx] });
  }

  function back() {
    if (stepIndex === 0) {
      navigate('/app');
      return;
    }
    setSp({ pose: POSES[stepIndex - 1] });
  }

  // Loading state — keep the page chrome to avoid layout shift
  if (uploadedPoses === null) {
    return (
      <Page appBar={<AppBar userName={profile?.display_name} avatarSrc={profile?.avatar_url} />}>
        <div style={{ padding: '40px 0', textAlign: 'center', color: theme.textSec }}>
          Loading…
        </div>
      </Page>
    );
  }

  // ── Done view ─────────────────────────────────────────────
  if (allDone) {
    return (
      <Page appBar={<AppBar userName={profile?.display_name} avatarSrc={profile?.avatar_url} />}>
        <DoneView thumbs={thumbs} onBack={() => navigate('/app')} />
      </Page>
    );
  }

  // ── Step view ────────────────────────────────────────────
  return (
    <Page appBar={<AppBar userName={profile?.display_name} avatarSrc={profile?.avatar_url} />}>
      <div style={{ padding: '20px 0 32px' }}>
        <div style={{ marginBottom: 28 }}>
          <StepDots step={stepIndex} total={POSES.length} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>📸</div>
          <h1 style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 22, margin: 0 }}>
            {capitalise(pose)} Photo
          </h1>
          <div style={{ fontFamily: theme.bd, fontSize: 13, color: theme.textSec, marginTop: 6 }}>
            {POSE_HINTS[pose]}
          </div>
        </div>

        <PoseGuide pose={pose} existingUrl={thumbs[pose]} />

        <div style={{ textAlign: 'center', fontSize: 11, color: theme.textMut, margin: '10px 0 16px' }}>
          Viewable by other participants
        </div>

        {error && (
          <div
            style={{
              background: '#EF535018',
              border: '1px solid #EF535055',
              color: '#EF5350',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 13,
              marginBottom: 12,
              fontFamily: theme.bd,
            }}
          >
            {error}
          </div>
        )}

        <CapturePicker disabled={busy} onPick={handleFile}>
          {busy ? 'Uploading…' : (uploadedPoses.has(pose) ? '🔁 Retake Photo' : '📷 Take Photo')}
        </CapturePicker>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={back}
            disabled={busy}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.textMut,
              fontFamily: theme.hd,
              fontWeight: 500,
              fontSize: 13,
              cursor: busy ? 'not-allowed' : 'pointer',
              padding: '8px 4px',
            }}
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={busy || stepIndex === POSES.length - 1}
            style={{
              background: 'transparent',
              border: 'none',
              color: stepIndex === POSES.length - 1 ? theme.textMut : ACCENT,
              fontFamily: theme.hd,
              fontWeight: 500,
              fontSize: 13,
              cursor: busy || stepIndex === POSES.length - 1 ? 'not-allowed' : 'pointer',
              padding: '8px 4px',
            }}
          >
            Skip for now — come back anytime
          </button>
        </div>
      </div>
    </Page>
  );
}

// ── Pose-guide box (with optional existing-photo overlay) ──
function PoseGuide({ pose, existingUrl }) {
  return (
    <div
      style={{
        margin: '0 auto',
        maxWidth: 200,
        aspectRatio: '3 / 4',
        border: `2px dashed ${ACCENT}70`,
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: theme.surface,
      }}
    >
      {existingUrl ? (
        <img
          src={existingUrl}
          alt={`${pose} photo`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            fontFamily: theme.hd,
            fontWeight: 600,
            color: ACCENT + 'C0',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            fontSize: 13,
          }}
        >
          {pose}
        </div>
      )}
    </div>
  );
}

// ── Hidden file input wrapped in a primary-button label ───
function CapturePicker({ children, disabled, onPick }) {
  const inputRef = React.useRef(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          // Reset value so the same file can be re-picked after an error.
          e.target.value = '';
          if (f) onPick(f);
        }}
      />
      <Button full disabled={disabled} onClick={() => inputRef.current && inputRef.current.click()}>
        {children}
      </Button>
    </>
  );
}

// ── Done view ─────────────────────────────────────────────
function DoneView({ thumbs, onBack }) {
  return (
    <div style={{ padding: '40px 0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 10 }}>💪</div>
      <h1 style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 26, margin: '0 0 8px' }}>
        Starting photos saved!
      </h1>
      <div style={{ fontFamily: theme.bd, fontSize: 14, color: theme.textSec, marginBottom: 24 }}>
        You can retake these anytime before the challenge starts.
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
        {POSES.map((p) => (
          <div key={p} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 80,
                height: 100,
                background: theme.surfaceBright,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
              {thumbs[p] ? (
                <img src={thumbs[p]} alt={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 22, color: theme.textMut }}>📷</span>
              )}
            </div>
            <div
              style={{
                fontFamily: theme.hd,
                fontWeight: 500,
                fontSize: 11,
                color: theme.textMut,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {p}
            </div>
          </div>
        ))}
      </div>

      <Button full onClick={onBack}>
        Back to Home
      </Button>
    </div>
  );
}

function capitalise(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
