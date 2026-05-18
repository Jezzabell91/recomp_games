import { useState, useEffect, useRef } from "react";

const STAR = "★";
const FIRE = "🔥";
const TROPHY = "🏆";
const LIGHTNING = "⚡";
const FLEXED = "💪";
const CAMERA = "📸";
const CALENDAR = "📅";

// ── Animated entrance hook ──
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function RevealSection({ children, delay = 0, className = "" }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ── Floating stars background ──
function FloatingStars() {
  const stars = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 10 + Math.random() * 18,
    delay: Math.random() * 6,
    duration: 4 + Math.random() * 5,
    opacity: 0.08 + Math.random() * 0.12,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {stars.map(s => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: s.size,
            opacity: s.opacity,
            color: "#FFD700",
            animation: `floatStar ${s.duration}s ease-in-out ${s.delay}s infinite alternate`,
          }}
        >
          {STAR}
        </div>
      ))}
    </div>
  );
}

// ── Card component ──
function Card({ children, accent = "#FFD700", glow = false, style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.08)",
      border: `1.5px solid ${accent}66`,
      borderRadius: 20, padding: "28px 24px",
      position: "relative", overflow: "hidden",
      boxShadow: glow ? `0 0 40px ${accent}22, 0 8px 32px rgba(0,0,0,0.4)` : "0 4px 20px rgba(0,0,0,0.3)",
      ...style,
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        opacity: 0.9,
      }} />
      {children}
    </div>
  );
}

// ── Points bar ──
function PointsBar({ label, max, total, color, icon }) {
  const pct = Math.round((max / total) * 100);
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: "'Fredoka', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.95)", fontWeight: 500 }}>
        <span>{icon} {label}</span>
        <span style={{ color }}><strong>{max} pts</strong> <span style={{ opacity: 0.7 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 5, background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          width: visible ? `${pct}%` : "0%",
          transition: "width 1.2s cubic-bezier(0.22,1,0.36,1) 0.2s",
          boxShadow: `0 0 8px ${color}88`,
        }} />
      </div>
    </div>
  );
}

// ── Steal Token visual ──
function StealToken({ index }) {
  return (
    <div style={{
      width: 72, height: 72, borderRadius: "50%",
      background: "linear-gradient(135deg, #FF4444, #CC0000)",
      border: "3px solid #FF8888",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 28, fontFamily: "'Fredoka', sans-serif", fontWeight: 700,
      color: "#fff", boxShadow: "0 4px 20px rgba(255,50,50,0.5), inset 0 -2px 4px rgba(0,0,0,0.2)",
      position: "relative",
    }}>
      {LIGHTNING}
      <span style={{
        position: "absolute", bottom: -6, fontSize: 10, background: "#1a0a2e",
        border: "1.5px solid #FF6666", borderRadius: 8, padding: "1px 6px", color: "#FFAAAA",
        fontWeight: 600,
      }}>
        #{index}
      </span>
    </div>
  );
}

// ── Bonus Star card ──
function BonusStar({ emoji, title, desc }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "linear-gradient(135deg, rgba(255,215,0,0.22), rgba(255,165,0,0.12))"
          : "rgba(255,255,255,0.08)",
        border: "1.5px solid rgba(255,215,0,0.45)",
        borderRadius: 16, padding: "20px 18px",
        transition: "all 0.3s ease", cursor: "default",
        transform: hovered ? "translateY(-4px) scale(1.02)" : "none",
        boxShadow: hovered ? "0 8px 30px rgba(255,215,0,0.25)" : "0 2px 8px rgba(0,0,0,0.2)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 6 }}>{emoji}</div>
      <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 15, color: "#FFD700", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{desc}</div>
      <div style={{ marginTop: 8, fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 18, color: "#FFA500" }}>+20 pts</div>
    </div>
  );
}

// ── Timeline step ──
function TimelineStep({ phase, dates, desc, icon, color, isLast }) {
  return (
    <div style={{ display: "flex", gap: 16, minHeight: 80 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: `linear-gradient(135deg, ${color}, ${color}aa)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
          boxShadow: `0 0 20px ${color}66`,
        }}>
          {icon}
        </div>
        {!isLast && <div style={{ width: 2, flex: 1, background: `linear-gradient(${color}88, transparent)`, marginTop: 4 }} />}
      </div>
      <div style={{ paddingBottom: 24 }}>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 15, color }}>{phase}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4, fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>{dates}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Monthly challenge card ──
function ChallengeCard({ num, example, tests, color }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}22, ${color}08)`,
      border: `1.5px dashed ${color}88`,
      borderRadius: 14, padding: 18, textAlign: "center",
      position: "relative",
    }}>
      <div style={{
        position: "absolute", top: 8, right: 8,
        fontSize: 9, fontFamily: "'Fredoka', sans-serif", fontWeight: 600,
        color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.12)",
        padding: "2px 7px", borderRadius: 6, letterSpacing: 0.5,
        textTransform: "uppercase",
      }}>example</div>
      <div style={{
        fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 28, color,
        lineHeight: 1, textShadow: `0 0 12px ${color}66`,
      }}>#{num}</div>
      <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500, fontSize: 13, color: "rgba(255,255,255,0.9)", margin: "8px 0 4px", fontStyle: "italic" }}>e.g. {example}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}>Tests: {tests}</div>
    </div>
  );
}

// ── Podium display ──
function Podium() {
  const places = [
    { place: "2nd", pts: 18, height: 70, color: "#E0E0E0" },
    { place: "1st", pts: 25, height: 100, color: "#FFD700" },
    { place: "3rd", pts: 10, height: 50, color: "#E8945A" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 6, margin: "16px 0" }}>
      {places.map(p => (
        <div key={p.place} style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 11, color: p.color, marginBottom: 4, fontWeight: 600 }}>
            {p.place}
          </div>
          <div style={{
            width: 60, height: p.height, borderRadius: "8px 8px 0 0",
            background: `linear-gradient(0deg, ${p.color}66, ${p.color}33)`,
            border: `1.5px solid ${p.color}99`, borderBottom: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 14, color: p.color,
            textShadow: `0 0 8px ${p.color}88`,
          }}>
            +{p.pts}
          </div>
        </div>
      ))}
    </div>
  );
}


// ═══════════════ MAIN ═══════════════
export default function RecompGames() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg, #0d0620 0%, #1a0a2e 30%, #12082a 60%, #0a0418 100%)",
      color: "#fff",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes floatStar {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-20px) rotate(15deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes heroGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        * { box-sizing: border-box; scrollbar-width: thin; scrollbar-color: #FFD70044 transparent; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #FFD70033; border-radius: 3px; }
      `}</style>

      <FloatingStars />

      {/* ── HERO ── */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "60px 20px 24px" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -55%)",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,215,0,0.18) 0%, transparent 70%)",
          animation: "heroGlow 4s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          fontSize: 48, marginBottom: 8, filter: "drop-shadow(0 0 16px rgba(255,215,0,0.6))",
          animation: "pulse 3s ease-in-out infinite",
        }}>{STAR}</div>
        <h1 style={{
          fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "clamp(28px, 6vw, 42px)",
          margin: "0 0 4px",
          background: "linear-gradient(135deg, #FFD700, #FFA500, #FF6347, #FFD700)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          animation: "shimmer 4s linear infinite",
          filter: "drop-shadow(0 0 20px rgba(255,215,0,0.3))",
        }}>
          THE RECOMP GAMES
        </h1>
        <div style={{
          fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 18,
          color: "rgba(255,255,255,0.8)", letterSpacing: 4,
        }}>2026</div>
        <div style={{
          marginTop: 16, display: "inline-flex", gap: 20,
          fontSize: 14, color: "rgba(255,255,255,0.85)", fontFamily: "'Fredoka', sans-serif", fontWeight: 500,
        }}>
          <span>1 June – 1 December</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>26 Weeks</span>
        </div>
        <p style={{
          maxWidth: 480, margin: "16px auto 0", fontSize: 15,
          color: "rgba(255,255,255,0.85)", lineHeight: 1.7,
        }}>
          A body recomposition challenge with Mario Party mechanics. Rewards fat loss, muscle gain, consistency, and competitive spirit.
        </p>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* OVERVIEW */}
        <section style={{ marginBottom: 48 }}>
          <RevealSection>
            <Card accent="#FFD700" glow>
              <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 22, margin: "0 0 6px", color: "#FFD700" }}>How Points Work</h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", margin: "0 0 20px", lineHeight: 1.6 }}>
                Most people will be close on weekly points. The monthly challenges, body comp points, and Bonus Stars create the real separation. Stars are revealed at the very end, just like Mario Party.
              </p>
              <PointsBar label="Weekly Check-Ins" max={130} total={520} color="#4FC3F7" icon="✅" />
              <PointsBar label="Monthly Challenges" max={100} total={520} color="#66BB6A" icon={FLEXED} />
              <PointsBar label="Bonus Stars" max={100} total={520} color="#FFD700" icon={STAR} />
              <PointsBar label="Body Comp Points" max={88} total={520} color="#26C6DA" icon="🔬" />
              <PointsBar label="Push-Up Challenge" max={57} total={520} color="#FF7043" icon={FIRE} />
              <PointsBar label="Points Steals" max={30} total={520} color="#EF5350" icon={LIGHTNING} />
              <PointsBar label="Midpoint Photos" max={15} total={520} color="#AB47BC" icon={CAMERA} />
            </Card>
          </RevealSection>
        </section>

        {/* TIMELINE */}
        <section style={{ marginBottom: 48 }}>
          <RevealSection>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 22, margin: "0 0 20px", color: "#4FC3F7" }}>{CALENDAR} Your Timeline</h2>
            <TimelineStep phase="Baseline" dates="June 1–7" icon="📋" color="#AB47BC"
              desc="DEXA or InBody scan. Record body fat %, fat mass, lean mass. Weigh in. Take front + side progress photos (same pose you can repeat later)." />
            <TimelineStep phase="Push-Up Challenge" dates="June 3–26" icon={FIRE} color="#FF7043"
              desc="3,307 push-ups in 24 days alongside The Push-Up Challenge Australia. Sets the tone and creates the first leaderboard." />
            <TimelineStep phase="The Grind" dates="June 28 – Nov 14 (20 wks)" icon={FLEXED} color="#66BB6A"
              desc="Weekly check-ins every Monday. Four monthly fitness challenges announced one month before each deadline. Points Steals available anytime." />
            <TimelineStep phase="Midpoint Photos" dates="September" icon={CAMERA} color="#AB47BC"
              desc="Front and side progress photos in the group chat. Same pose and lighting as baseline. Worth 15 points." />
            <TimelineStep phase="The Finale" dates="Nov 15 – Dec 1" icon={TROPHY} color="#FFD700" isLast
              desc="Final scan on December 1 (same protocol, same machine). Bonus Stars revealed. Champion crowned." />
          </RevealSection>
        </section>

        {/* WEEKLY CHECK-IN */}
        <section style={{ marginBottom: 48 }}>
          <RevealSection>
            <Card accent="#4FC3F7">
              <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 22, margin: "0 0 4px", color: "#4FC3F7" }}>✅ Weekly Check-In</h2>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 13, color: "#82D9FF", marginBottom: 12 }}>
                5 points per week · All or nothing · 26 weeks = 130 pts max
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 1.7, margin: "0 0 16px" }}>
                Submit any time on Monday in the group chat. Takes 60 seconds.
              </p>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
              }}>
                <div style={{
                  padding: 16, borderRadius: 12,
                  background: "rgba(79,195,247,0.18)", border: "1.5px solid rgba(79,195,247,0.45)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>⚖️</div>
                  <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14, color: "#fff" }}>Your Weight</div>
                </div>
                <div style={{
                  padding: 16, borderRadius: 12,
                  background: "rgba(79,195,247,0.18)", border: "1.5px solid rgba(79,195,247,0.45)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>💬</div>
                  <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14, color: "#fff" }}>One Sentence</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>How'd your week go?</div>
                </div>
              </div>
              <div style={{
                marginTop: 14, padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,83,80,0.18)", border: "1.5px solid rgba(239,83,80,0.4)",
                fontSize: 13, color: "#FF8A85", textAlign: "center",
                fontFamily: "'Fredoka', sans-serif", fontWeight: 600,
              }}>
                Miss it and you miss the points. No exceptions.
              </div>
            </Card>
          </RevealSection>
        </section>

        {/* PUSH-UP CHALLENGE */}
        <section style={{ marginBottom: 48 }}>
          <RevealSection>
            <Card accent="#FF7043">
              <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 22, margin: "0 0 4px", color: "#FF7043" }}>{FIRE} Push-Up Challenge</h2>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 13, color: "#FFA989", marginBottom: 12 }}>
                June 3–26 · 3,307 push-ups in 24 days
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: "0 0 16px" }}>
                Alongside The Push-Up Challenge Australia.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "All 3,307", pts: 33, color: "#FFD700", pct: 100 },
                  { label: "75%+ (2,480+)", pts: 15, color: "#E0E0E0", pct: 75 },
                  { label: "50%+ (1,654+)", pts: 10, color: "#E8945A", pct: 50 },
                ].map(t => (
                  <div key={t.label} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                    borderRadius: 10, background: `${t.color}1f`, border: `1.5px solid ${t.color}55`,
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${t.color}88, ${t.color}44)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 11, color: "#fff",
                      border: `1.5px solid ${t.color}`,
                    }}>{t.pct}%</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14, color: "#fff" }}>{t.label}</div>
                    </div>
                    <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 18, color: t.color, textShadow: `0 0 8px ${t.color}66` }}>+{t.pts}</div>
                  </div>
                ))}
                <div style={{
                  padding: "10px 14px", borderRadius: 10,
                  background: "rgba(255,112,67,0.15)", border: "1.5px solid rgba(255,112,67,0.35)",
                  fontSize: 13, color: "rgba(255,255,255,0.9)", textAlign: "center",
                }}>
                  Plus <strong style={{ color: "#FFB088" }}>+1 point</strong> for every day you complete 100% of that day's target
                </div>
              </div>
            </Card>
          </RevealSection>
        </section>

        {/* MONTHLY CHALLENGES */}
        <section style={{ marginBottom: 48 }}>
          <RevealSection>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 22, margin: "0 0 4px", color: "#66BB6A" }}>{FLEXED} Monthly Fitness Challenges</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", margin: "0 0 16px", lineHeight: 1.6 }}>
              Four challenges across the competition, each testing a different type of fitness. Announced one month before each deadline so you can train for it. The same person is unlikely to win all four. That's by design.
            </p>
            <div style={{
              marginBottom: 12, padding: "10px 14px", borderRadius: 10,
              background: "rgba(102,187,106,0.18)", border: "1.5px solid rgba(102,187,106,0.45)",
              fontSize: 13, color: "#A5E0A8", textAlign: "center",
              fontFamily: "'Fredoka', sans-serif", fontWeight: 600,
            }}>
              Actual challenges are TBD. These are examples of the kind of thing to expect.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <ChallengeCard num={1} example="Most steps in a week" tests="Daily endurance" color="#4FC3F7" />
              <ChallengeCard num={2} example="Longest single run" tests="Cardio" color="#66BB6A" />
              <ChallengeCard num={3} example="Heaviest deadlift (% BW)" tests="Relative strength" color="#FF7043" />
              <ChallengeCard num={4} example="Max push-ups in one set" tests="Muscular endurance" color="#AB47BC" />
            </div>
            <Card accent="#66BB6A">
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 15, color: "#A5E0A8", marginBottom: 10, textAlign: "center" }}>Podium Points</div>
              <Podium />
              <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
                Everyone else who at least attempted earns <strong style={{ color: "#A5E0A8" }}>+5 participation points</strong>
              </div>
            </Card>
          </RevealSection>
        </section>

        {/* POINTS STEAL */}
        <section style={{ marginBottom: 48 }}>
          <RevealSection>
            <Card accent="#EF5350" glow>
              <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 22, margin: "0 0 12px", color: "#EF5350" }}>{LIGHTNING} Points Steal</h2>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 18 }}>
                <StealToken index={1} />
                <StealToken index={2} />
                <StealToken index={3} />
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 1.7, margin: "0 0 14px", textAlign: "center" }}>
                You get <strong style={{ color: "#FF8A85" }}>3 tokens</strong> for the entire challenge. Name your target and the challenge. Winner takes <strong style={{ color: "#FF8A85" }}>10 points</strong> from the loser.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: "🎯", text: "Any physical, measurable challenge: push-up max, plank hold, 100m sprint, wall sit" },
                  { icon: "⏰", text: "Must happen within 72 hours. Filmed or witnessed." },
                  { icon: "🚫", text: "Cannot be refused. Cannot target someone challenged in the past 2 weeks." },
                  { icon: "🧠", text: "Use early on someone vulnerable, or save for a tactical strike near the end." },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "rgba(255,255,255,0.88)", lineHeight: 1.6 }}>
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
                    <span>{r.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </RevealSection>
        </section>

        {/* BODY COMP POINTS */}
        <section style={{ marginBottom: 48 }}>
          <RevealSection>
            <Card accent="#26C6DA" glow>
              <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 22, margin: "0 0 4px", color: "#26C6DA" }}>🔬 Body Comp Points</h2>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 13, color: "#7EDDEC", marginBottom: 14 }}>
                Earned by everyone based on your scan results
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 1.7, margin: "0 0 18px" }}>
                Your baseline scan (June) and final scan (December) are compared. Everyone who improves their body composition earns points on a sliding scale. You don't need to win a category to be rewarded.
              </p>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <div style={{
                  flex: 1, padding: "16px 14px", borderRadius: 14,
                  background: "rgba(255,112,67,0.18)", border: "1.5px solid rgba(255,112,67,0.45)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🔥</div>
                  <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 18, color: "#FFB088", textShadow: "0 0 8px rgba(255,112,67,0.5)" }}>+1 pt</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>per 125g fat lost</div>
                </div>
                <div style={{
                  flex: 1, padding: "16px 14px", borderRadius: 14,
                  background: "rgba(102,187,106,0.18)", border: "1.5px solid rgba(102,187,106,0.45)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>💪</div>
                  <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 18, color: "#A5E0A8", textShadow: "0 0 8px rgba(102,187,106,0.5)" }}>+1 pt</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>per 50g muscle gained</div>
                </div>
              </div>
              <div style={{
                padding: "14px 16px", borderRadius: 12,
                background: "rgba(38,198,218,0.15)", border: "1.5px solid rgba(38,198,218,0.35)",
              }}>
                <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14, color: "#7EDDEC", marginBottom: 8 }}>Example</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 1.7 }}>
                  Lose 3kg of fat = <strong style={{ color: "#FFB088" }}>24 pts</strong><br/>
                  Gain 2kg of muscle = <strong style={{ color: "#A5E0A8" }}>40 pts</strong><br/>
                  <span style={{ color: "#7EDDEC", fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}>Total: 64 body comp points</span>
                </div>
              </div>
              <div style={{
                marginTop: 12, fontSize: 13, color: "rgba(255,255,255,0.75)",
                textAlign: "center", lineHeight: 1.6,
              }}>
                A strong recomp will earn roughly 60 to 100 points from scans alone. The Bonus Stars then reward the top performers on top of this.
              </div>
            </Card>
          </RevealSection>
        </section>

        {/* BONUS STARS */}
        <section style={{ marginBottom: 48 }}>
          <RevealSection>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 22, margin: "0 0 4px", color: "#FFD700" }}>⭐ Bonus Stars</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", margin: "0 0 16px", lineHeight: 1.6 }}>
              Announced at the finale, right before the Champion is declared. Nobody knows who's won them until they're read out. 100 points dropping onto the leaderboard at the very end.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <BonusStar emoji="🔥" title="Best Fat Loss" desc="Most fat mass (kg) lost, baseline to final" />
              <BonusStar emoji="💪" title="Best Muscle Gain" desc="Most lean mass (kg) gained, baseline to final" />
              <BonusStar emoji="⚡" title="Best Recomp" desc="Highest combined body comp points (fat lost + muscle gained)" />
              <BonusStar emoji="📅" title="Most Consistent" desc="Highest weekly check-in points across 26 weeks" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              <BonusStar emoji="🏆" title="Most Competitive" desc="Most podium finishes across monthly challenges, steals, and push-up milestones" />
            </div>
            <div style={{
              marginTop: 14, padding: "10px 14px", borderRadius: 10,
              background: "rgba(255,215,0,0.15)", border: "1.5px solid rgba(255,215,0,0.3)",
              fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 1.6,
            }}>
              Ties split the points (10 each). Enough to swing a podium finish, but not enough to go from last to first.
            </div>
          </RevealSection>
        </section>

        {/* AWARDS */}
        <section style={{ marginBottom: 48 }}>
          <RevealSection>
            <Card accent="#FFD700" glow>
              <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 22, margin: "0 0 16px", color: "#FFD700", textAlign: "center" }}>{TROPHY} Awards</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { title: "Overall Champion", desc: "Highest total points. Picks the group activity.", icon: "👑", color: "#FFD700", highlight: true },
                  { title: "Best Fat Loss", desc: "Most fat mass lost", icon: "🔥", color: "#FF7043" },
                  { title: "Best Muscle Gain", desc: "Most lean mass gained", icon: "💪", color: "#66BB6A" },
                  { title: "Best Recomp", desc: "Best combined recomp score", icon: "⚡", color: "#AB47BC" },
                  { title: "Most Consistent", desc: "Highest weekly points total", icon: "📅", color: "#4FC3F7" },
                  { title: "Most Competitive", desc: "Most podium finishes and challenge wins", icon: "🎯", color: "#EF5350" },
                ].map((a, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                    borderRadius: 12,
                    background: a.highlight ? "linear-gradient(135deg, rgba(255,215,0,0.25), rgba(255,165,0,0.12))" : "rgba(255,255,255,0.08)",
                    border: `1.5px solid ${a.color}${a.highlight ? "88" : "55"}`,
                    boxShadow: a.highlight ? `0 4px 16px ${a.color}33` : "none",
                  }}>
                    <div style={{ fontSize: 24, flexShrink: 0 }}>{a.icon}</div>
                    <div>
                      <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 15, color: a.color }}>{a.title}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </RevealSection>
        </section>

        {/* QUICK REFERENCE */}
        <RevealSection>
          <div style={{
            padding: "22px 20px", borderRadius: 16,
            background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.06))",
            border: "1.5px solid rgba(255,215,0,0.35)",
            boxShadow: "0 4px 20px rgba(255,215,0,0.1)",
          }}>
            <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 18, margin: "0 0 4px", color: "#FFD700", textAlign: "center" }}>
              Quick Reference
            </h3>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", textAlign: "center", marginBottom: 14 }}>
              Maximum points available from each source
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { icon: "✅", when: "Every Monday", what: "Weekly check-in (weight + one sentence)", calc: "5 pts × 26 wks", max: 130 },
                { icon: FLEXED, when: "Monthly", what: "Fitness challenges (4 total)", calc: "25 pts × 4 (1st place)", max: 100 },
                { icon: STAR, when: "The Finale", what: "Bonus Stars (revealed at the end)", calc: "20 pts × 5 stars", max: 100 },
                { icon: "🔬", when: "Final scan", what: "Body comp points", calc: "+1 per 125g fat lost, +1 per 50g muscle", max: "~80" },
                { icon: FIRE, when: "June 3–26", what: "Push-Up Challenge", calc: "33 + daily bonuses", max: 57 },
                { icon: LIGHTNING, when: "Anytime", what: "Points Steal (3 tokens)", calc: "±10 pts each", max: 30 },
                { icon: CAMERA, when: "September", what: "Midpoint progress photos", calc: "", max: 15 },
              ].map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 0",
                  borderBottom: i < 6 ? "1px solid rgba(255,255,255,0.12)" : "none",
                }}>
                  <span style={{ fontSize: 18, width: 28, textAlign: "center", flexShrink: 0 }}>{r.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.95)", fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}>{r.what}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                      {r.when}{r.calc ? ` · ${r.calc}` : ""}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 18,
                    color: "#FFD700", flexShrink: 0, textAlign: "right", minWidth: 44,
                    textShadow: "0 0 8px rgba(255,215,0,0.4)",
                  }}>{r.max}</div>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

      </div>
    </div>
  );
}
