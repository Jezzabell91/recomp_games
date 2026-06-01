import React, { useState } from 'react';
import { theme, ACCENT } from '../lib/theme';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Banner from '../components/ui/Banner';
import StepDots from '../components/ui/StepDots';
import AppBar from '../components/ui/AppBar';
import BottomNav from '../components/ui/BottomNav';
import WeightSparkline from '../components/ui/WeightSparkline';
import Page from '../components/ui/Page';
import ReactionPills from '../components/ui/ReactionPills';
import WeightBadge from '../components/ui/WeightBadge';

const SAMPLE_HISTORY = [
  { week: 8, weight: 87.0 },
  { week: 9, weight: 86.4 },
  { week: 10, weight: 85.8 },
  { week: 11, weight: 85.2 },
  { week: 12, weight: 84.5 },
];

const PARTICIPANT_COLORS = [
  ['Aidan', '#4FC3F7'],
  ['Andrew', '#EF5350'],
  ['Brenton', '#66BB6A'],
  ['Davis', '#FF7043'],
  ['Jason', '#AB47BC'],
  ['Jeremy', '#FFD700'],
  ['Jimmy', '#26C6DA'],
  ['Joe', '#FFA500'],
  ['Justin', '#EC407A'],
  ['Vishal', '#2E7D32'],
];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          fontFamily: theme.hd,
          fontWeight: 600,
          fontSize: 12,
          color: theme.textMut,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  );
}

export default function Kit() {
  const [reactions, setReactions] = useState({ '🔥': 3, '💪': 1 });
  const [mine, setMine] = useState(new Set(['🔥']));

  function toggle(emoji) {
    const next = new Set(mine);
    const counts = { ...reactions };
    if (next.has(emoji)) {
      next.delete(emoji);
      counts[emoji] = Math.max(0, (counts[emoji] || 0) - 1);
    } else {
      next.add(emoji);
      counts[emoji] = (counts[emoji] || 0) + 1;
    }
    setMine(next);
    setReactions(counts);
  }

  return (
    <Page
      appBar={<AppBar userName="Jeremy" avatarColor={ACCENT} />}
      bottomNav={<BottomNav active="" />}
    >
      <div style={{ paddingTop: 8, paddingBottom: 24 }}>
        <h1
          style={{
            fontFamily: theme.hd,
            fontWeight: 700,
            fontSize: 26,
            margin: '0 0 4px',
            color: theme.text,
          }}
        >
          UI Kit
        </h1>
        <div
          style={{
            fontFamily: theme.hd,
            fontWeight: 500,
            fontSize: 13,
            color: theme.textSec,
            marginBottom: 20,
          }}
        >
          Phase 1 preview · dark theme · Fredoka + DM Sans
        </div>

        <Section title="Avatar">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {PARTICIPANT_COLORS.map(([name, color]) => (
              <Avatar key={name} name={name} color={color} size={40} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Avatar name="Jeremy" color={ACCENT} size={24} />
            <Avatar name="Jeremy" color={ACCENT} size={36} />
            <Avatar name="Jeremy" color={ACCENT} size={56} />
            <Avatar name="Jeremy" color={ACCENT} size={72} />
          </div>
        </Section>

        <Section title="Button">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button small>Small primary</Button>
            <Button variant="secondary" small>
              Small secondary
            </Button>
            <Button disabled>Disabled</Button>
          </div>
          <Button full>Full width</Button>
        </Section>

        <Section title="Card">
          <Card>
            <div style={{ fontFamily: theme.hd, fontWeight: 600 }}>Plain card</div>
            <div style={{ color: theme.textSec, marginTop: 6, fontSize: 13 }}>
              No accent, no glow. Just the base surface.
            </div>
          </Card>
          <Card accent={ACCENT}>
            <div style={{ fontFamily: theme.hd, fontWeight: 600 }}>Accent card</div>
            <div style={{ color: theme.textSec, marginTop: 6, fontSize: 13 }}>
              Top-edge accent line, accent-tinted border.
            </div>
          </Card>
          <Card accent={theme.positive} glow>
            <div style={{ fontFamily: theme.hd, fontWeight: 600, color: theme.positive }}>
              Accent + glow card
            </div>
            <div style={{ color: theme.textSec, marginTop: 6, fontSize: 13 }}>
              Used for the confirmed check-in.
            </div>
          </Card>
        </Section>

        <Section title="Banner">
          <Banner accent="#FFA500" icon="📸" onClick={() => {}}>
            Add your starting photos →
          </Banner>
          <Banner accent={theme.textSec} icon="⏰">
            Late check-in · submit today for +3 pts
          </Banner>
        </Section>

        <Section title="StepDots">
          <StepDots step={0} total={2} />
          <StepDots step={1} total={2} />
          <StepDots step={1} total={3} />
        </Section>

        <Section title="WeightBadge">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <WeightBadge change={-0.7} />
            <WeightBadge change={-1.2} />
            <WeightBadge change={0.4} />
            <WeightBadge change={0} />
          </div>
        </Section>

        <Section title="ReactionPills">
          <ReactionPills reactions={reactions} myReactions={mine} onToggle={toggle} />
          <div style={{ fontSize: 12, color: theme.textMut }}>
            Tap a pill to toggle; tap + to open the 3-emoji picker.
          </div>
        </Section>

        <Section title="WeightSparkline">
          <WeightSparkline
            history={SAMPLE_HISTORY}
            start={89.2}
            current={84.5}
            color={ACCENT}
          />
          <WeightSparkline
            history={SAMPLE_HISTORY.map((h) => ({ ...h, weight: h.weight + 2 }))}
            start={86.0}
            current={86.5}
            color="#26C6DA"
          />
        </Section>
      </div>
    </Page>
  );
}
