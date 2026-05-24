// Recomp Games — Screen Components

// ── Home Screen ─────────────────────────────────────
function HomeScreen({ accent, dark }) {
  const t = rcTheme(accent, dark);
  const d = RECOMP;
  const you = d.participants.find((p) => p.isYou);
  const yourRank = d.participants.indexOf(you) + 1;

  return (
    <div style={{
      minHeight: '100%', background: t.bgGrad, color: t.text,
      fontFamily: t.bd, display: 'flex', flexDirection: 'column'
    }}>
      <RCAppBar accent={accent} theme={t} />

      <div style={{
        flex: 1, padding: '4px 16px 12px',
        display: 'flex', flexDirection: 'column', gap: 14
      }}>
        {/* Greeting */}
        <div>
          <div style={{
            fontFamily: t.hd, fontWeight: 700, fontSize: 26, marginBottom: 4
          }}>
            Hey, {d.userName} 👋
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: t.hd, fontWeight: 500, fontSize: 13, color: t.textSec
            }}>
              Week {d.currentWeek} of {d.totalWeeks}
            </span>
            <div style={{
              flex: 1, height: 3, borderRadius: 2,
              background: t.sep, maxWidth: 100
            }}>
              <div style={{
                width: `${d.currentWeek / d.totalWeeks * 100}%`,
                height: '100%', borderRadius: 2, background: accent
              }} />
            </div>
          </div>
        </div>

        {/* Check-in status card */}
        <RCCard accent={accent} theme={t} glow>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10
          }}>
            <span style={{ fontSize: 15 }}>⏳</span>
            <span style={{
              fontFamily: t.hd, fontWeight: 600, fontSize: 13, color: accent
            }}>
              Week {d.currentWeek} · {d.weekRange}
            </span>
          </div>
          <div style={{
            fontFamily: t.hd, fontWeight: 600, fontSize: 15, marginBottom: 3
          }}>
            Check-in not submitted
          </div>
          <div style={{ fontSize: 12, color: t.textSec, marginBottom: 12 }}>
            Opens {d.deadline}{' '}
            <span style={{ color: t.textMut }}>{d.deadlineZone}</span>
          </div>
          {/* Countdown */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[
            { v: d.countdown.d, l: 'day' },
            { v: d.countdown.h, l: 'hrs' },
            { v: d.countdown.m, l: 'min' }].
            map((c) =>
            <div key={c.l} style={{
              flex: 1, textAlign: 'center', padding: '6px 0',
              background: t.surfaceBright, borderRadius: 8
            }}>
                <div style={{
                fontFamily: t.hd, fontWeight: 700, fontSize: 20, color: accent
              }}>{c.v}</div>
                <div style={{
                fontSize: 10, color: t.textMut, fontFamily: t.hd, fontWeight: 500
              }}>{c.l}</div>
              </div>
            )}
          </div>
          <RCBtn accent={accent} full>Submit Check-In</RCBtn>
        </RCCard>

        {/* Photos banner */}
        <RCBanner accent="#FFA500" theme={t}>
          Add your starting photos →
        </RCBanner>

        {/* Mini leaderboard */}
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 8
          }}>
            <span style={{ fontFamily: t.hd, fontWeight: 600, fontSize: 15 }}>
              🏆 Leaderboard
            </span>
            <span style={{
              fontSize: 12, color: accent, fontFamily: t.hd, fontWeight: 500
            }}>See all →</span>
          </div>
          {d.participants.slice(0, 3).map((p, i) =>
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
            borderBottom: i < 2 ? `1px solid ${t.sep}` : 'none'
          }}>
              <span style={{
              fontFamily: t.hd, fontWeight: 700, fontSize: 14,
              color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32',
              width: 18, textAlign: 'center'
            }}>{i + 1}</span>
              <RCAvatar name={p.name} color={p.color} size={28} />
              <span style={{
              flex: 1, fontFamily: t.hd, fontWeight: 500, fontSize: 14,
              color: p.isYou ? accent : t.text
            }}>
                {p.name}{p.isYou ? ' (you)' : ''}
              </span>
              <span style={{
              fontFamily: t.hd, fontWeight: 600, fontSize: 14, color: t.textSec
            }}>{p.points}</span>
            </div>
          )}
          <div style={{
            marginTop: 8, padding: '8px 12px',
            background: t.accentDim, border: `1px solid ${t.accentBorder}`,
            borderRadius: 10, fontFamily: t.hd, fontWeight: 600,
            fontSize: 12, color: accent, textAlign: 'center'
          }}>
            You're #{yourRank} with {you.points} points
          </div>
        </div>

        {/* Past check-ins */}
        <div>
          <span style={{ fontFamily: t.hd, fontWeight: 600, fontSize: 15 }}>
            Past Check-Ins
          </span>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8
          }}>
            {d.pastCheckIns.map((ci, i) =>
            <div key={i} style={{
              padding: '10px 12px', background: t.surface,
              border: `1px solid ${t.border}`, borderRadius: 10
            }}>
                <div style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: 3
              }}>
                  <span style={{
                  fontFamily: t.hd, fontWeight: 500, fontSize: 12, color: t.textSec
                }}>Wk {ci.week} · {ci.range}</span>
                  <span style={{
                  fontFamily: t.hd, fontWeight: 600, fontSize: 13, color: accent
                }}>{ci.weight} kg</span>
                </div>
                <div style={{ fontSize: 12, color: t.textSec, lineHeight: 1.4 }}>
                  {ci.note}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <RCBottomNav accent={accent} theme={t} active="home" />
    </div>);

}

// ── Check-In Step 1: Scale Photo ────────────────────
function CheckInStep1({ accent, dark }) {
  const t = rcTheme(accent, dark);
  return (
    <div style={{
      minHeight: '100%', background: t.bg, color: t.text,
      fontFamily: t.bd, display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ padding: '64px 16px 0' }}>
        <RCStepDots step={0} total={2} accent={accent} theme={t} />
        <div style={{ textAlign: 'center', margin: '28px 0 0' }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>📸</div>
          <div style={{ fontFamily: t.hd, fontWeight: 700, fontSize: 22 }}>
            Scale Photo
          </div>
          <div style={{ fontSize: 13, color: t.textSec, marginTop: 4 }}>
            Snap a pic of the scale reading
          </div>
        </div>
      </div>

      {/* Camera area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '0 40px'
      }}>
        <div style={{
          width: '100%', aspectRatio: '4/3', maxWidth: 260,
          border: `2px dashed ${t.textMut}`, borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
          background: t.surface
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: accent + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill={accent}>
              <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z" />
              <path d="M9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9z" />
            </svg>
          </div>
          <span style={{
            fontFamily: t.hd, fontWeight: 500, fontSize: 14, color: t.textSec
          }}>Tap to capture</span>
        </div>
        <span style={{
          fontSize: 12, color: t.textMut, marginTop: 14,
          fontFamily: t.hd, fontWeight: 500
        }}>or upload from library</span>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 20px 44px' }}>
        <RCBtn accent={accent} full>Next →</RCBtn>
      </div>
    </div>);

}

// ── Check-In Step 2: Weight & Note (combined) ─────
function CheckInStep2({ accent, dark }) {
  const t = rcTheme(accent, dark);
  const note = 'Good week — hit the gym 4x and stayed on track with the meal plan.';
  return (
    <div style={{
      minHeight: '100%', background: t.bg, color: t.text,
      fontFamily: t.bd, display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ padding: '64px 16px 0' }}>
        <RCStepDots step={1} total={2} accent={accent} theme={t} />
      </div>

      <div style={{
        flex: 1, padding: '20px 20px 0',
        display: 'flex', flexDirection: 'column', gap: 20
      }}>
        {/* Weight section */}
        <div>
          <div style={{
            fontFamily: t.hd, fontWeight: 600, fontSize: 15, marginBottom: 10
          }}>Your Weight</div>
          <div style={{
            padding: '20px 28px', background: t.surface,
            border: '1px solid ' + t.border,
            borderRadius: 16, textAlign: 'center'
          }}>
            <div style={{
              display: 'flex', alignItems: 'baseline',
              justifyContent: 'center', gap: 4
            }}>
              <span style={{
                fontFamily: t.hd, fontWeight: 700, fontSize: 44, color: t.text
              }}>84.5</span>
              <span style={{
                fontFamily: t.hd, fontWeight: 500, fontSize: 18, color: t.textMut
              }}>kg</span>
            </div>
            <div style={{
              width: 60, height: 2, borderRadius: 1,
              background: accent + '44', margin: '6px auto 0'
            }} />
          </div>
          <div style={{
            marginTop: 10, padding: '8px 14px',
            background: t.surfaceBright,
            border: '1px solid ' + t.border,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span style={{
              fontFamily: t.hd, fontWeight: 600, fontSize: 14, color: t.textSec
            }}>↓</span>
            <span style={{
              fontFamily: t.hd, fontWeight: 500, fontSize: 13, color: t.textSec
            }}>0.7 kg less than last week (85.2)</span>
          </div>
        </div>

        {/* Note section */}
        <div>
          <div style={{
            fontFamily: t.hd, fontWeight: 600, fontSize: 15, marginBottom: 4
          }}>How'd your week go?</div>
          <div style={{
            fontSize: 12, color: t.textSec, marginBottom: 10
          }}>One sentence is plenty</div>
          <div style={{
            padding: 16, background: t.surface,
            border: '1px solid ' + accent + '22',
            borderRadius: 14, minHeight: 100, position: 'relative'
          }}>
            <div style={{
              fontSize: 15, color: t.text, lineHeight: 1.65,
              fontFamily: t.bd
            }}>{note}</div>
            <div style={{
              position: 'absolute', bottom: 12, right: 14,
              fontSize: 11, color: t.textMut, fontFamily: t.hd, fontWeight: 500
            }}>{note.length}/280</div>
          </div>
        </div>
      </div>

      <div style={{
        padding: '16px 20px 44px', display: 'flex', gap: 10
      }}>
        <RCBtn accent={accent} variant="secondary" style={{ flex: 1 }}>
          ← Back
        </RCBtn>
        <RCBtn accent={accent} style={{ flex: 2 }}>
          Submit ✓
        </RCBtn>
      </div>
    </div>);

}

// ── Check-In Confirmation ───────────────────────────
function CheckInConfirm({ accent, dark }) {
  const t = rcTheme(accent, dark);
  return (
    <div style={{
      minHeight: '100%', color: t.text, fontFamily: t.bd,
      background: t.dark ?
      'radial-gradient(ellipse at 50% 30%, #1a102e 0%, #0b0f1a 65%)' :
      'radial-gradient(ellipse at 50% 30%, #f5f0e8 0%, #f2f2f7 65%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 28px 60px', textAlign: 'center',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '18%', left: '50%',
        transform: 'translateX(-50%)',
        width: 240, height: 240, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      <div style={{ fontSize: 60, marginBottom: 20, position: 'relative' }}>
        🔥
      </div>
      <div style={{
        fontFamily: t.hd, fontWeight: 700, fontSize: 28,
        marginBottom: 6, position: 'relative'
      }}>
        Locked in!
      </div>
      <div style={{
        fontFamily: t.hd, fontWeight: 500, fontSize: 15,
        color: accent, marginBottom: 32, position: 'relative'
      }}>
        Week {RECOMP.currentWeek} · {RECOMP.weekRange}
      </div>

      <RCCard accent={accent} theme={t} style={{
        width: '100%', position: 'relative'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 10
        }}>
          <span style={{
            fontFamily: t.hd, fontWeight: 600, fontSize: 14, color: t.textSec
          }}>Summary</span>
          <span style={{
            fontFamily: t.hd, fontWeight: 600, fontSize: 13, color: accent
          }}>Edit</span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {/* Photo thumbnail */}
          <div style={{
            width: 56, height: 56, borderRadius: 10,
            background: t.surfaceBright,
            border: `1px solid ${t.border}`,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 24, flexShrink: 0
          }}>📷</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: t.hd, fontWeight: 700, fontSize: 20, marginBottom: 4
            }}>84.5 kg</div>
            <div style={{
              fontSize: 13, color: t.textSec, lineHeight: 1.5,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              Good week — hit the gym 4x and stayed on track with the meal plan.
            </div>
          </div>
        </div>
      </RCCard>

      <div style={{ marginTop: 28, width: '100%', position: 'relative' }}>
        <RCBtn accent={accent} full>Back to Home</RCBtn>
      </div>
    </div>);

}

// ── Leaderboard: Clean ──────────────────────────────
function LeaderboardClean({ accent, dark }) {
  const t = rcTheme(accent, dark);
  const d = RECOMP;
  const maxPts = d.participants[0].points;

  return (
    <div style={{
      minHeight: '100%', background: t.bgGrad, color: t.text,
      fontFamily: t.bd, display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ padding: '60px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span style={{
            fontSize: 16, color: accent,
            filter: `drop-shadow(0 0 4px ${accent}55)`
          }}>★</span>
          <span style={{
            fontFamily: t.hd, fontWeight: 500, fontSize: 12,
            color: t.textMut, letterSpacing: 1.5, textTransform: 'uppercase'
          }}>Recomp Games 2026</span>
        </div>
        <div style={{
          fontFamily: t.hd, fontWeight: 700, fontSize: 26
        }}>Leaderboard</div>
        <div style={{
          fontFamily: t.hd, fontWeight: 500, fontSize: 13,
          color: t.textSec, marginTop: 2
        }}>Week {d.currentWeek} of {d.totalWeeks}</div>
      </div>

      {/* List */}
      <div style={{ flex: 1, padding: '0 16px' }}>
        {d.participants.map((p, i) => {
          const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
          const rankColor = i < 3 ? medalColors[i] : t.textMut;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 0',
              borderBottom: i < d.participants.length - 1 ?
              `1px solid ${t.sep}` : 'none'
            }}>
              <span style={{
                fontFamily: t.hd, fontWeight: 700, fontSize: 15,
                color: rankColor, width: 22, textAlign: 'center'
              }}>{i + 1}</span>
              <RCAvatar name={p.name} color={p.color} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: t.hd,
                  fontWeight: p.isYou ? 600 : 500,
                  fontSize: 15,
                  color: p.isYou ? accent : t.text,
                  display: 'flex', alignItems: 'center', gap: 4
                }}>
                  {p.name}
                  {p.isYou &&
                  <span style={{
                    fontSize: 9, fontWeight: 600,
                    background: accent + '22',
                    color: accent,
                    padding: '2px 6px', borderRadius: 6
                  }}>YOU</span>
                  }
                </div>
                {/* Progress bar */}
                <div style={{
                  marginTop: 5, height: 3, borderRadius: 2,
                  background: t.sep
                }}>
                  <div style={{
                    width: `${p.weeks / d.totalWeeks * 100}%`,
                    height: '100%', borderRadius: 2,
                    background: p.isYou ? accent : p.color,
                    opacity: 0.5
                  }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontFamily: t.hd, fontWeight: 700, fontSize: 16
                }}>{p.points}</div>
                <div style={{
                  fontSize: 10, color: t.textMut, fontFamily: t.hd
                }}>{p.weeks}/{d.totalWeeks} wks</div>
              </div>
            </div>);

        })}
      </div>

    </div>);

}

// ── Leaderboard: Podium ─────────────────────────────
function LeaderboardPodium({ accent, dark }) {
  const t = rcTheme(accent, dark);
  const d = RECOMP;
  const top3 = d.participants.slice(0, 3);
  const rest = d.participants.slice(3);
  // Display order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const heights = [74, 100, 54];
  const metalColors = ['#C0C0C0', '#FFD700', '#CD7F32'];
  const medals = ['🥈', '🥇', '🥉'];
  const sizes = [36, 44, 36];

  return (
    <div style={{
      minHeight: '100%', background: t.bgGrad, color: t.text,
      fontFamily: t.bd, display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ padding: '60px 18px 6px', textAlign: 'center' }}>
        <div style={{
          fontFamily: t.hd, fontWeight: 700, fontSize: 26
        }}>🏆 Leaderboard</div>
        <div style={{
          fontFamily: t.hd, fontWeight: 500, fontSize: 13,
          color: t.textSec, marginTop: 2
        }}>Week {d.currentWeek} of {d.totalWeeks}</div>
      </div>

      {/* Podium */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center', gap: 8,
        padding: '16px 28px 0'
      }}>
        {podiumOrder.map((p, i) =>
        <div key={i} style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center'
        }}>
            <RCAvatar name={p.name} color={p.color} size={sizes[i]} />
            <div style={{
            fontFamily: t.hd, fontWeight: 600,
            fontSize: i === 1 ? 14 : 12, marginTop: 6,
            color: t.text
          }}>{p.name}</div>
            <div style={{
            fontFamily: t.hd, fontWeight: 700,
            fontSize: i === 1 ? 16 : 14,
            color: metalColors[i], marginTop: 2
          }}>{p.points}</div>
            {/* Podium bar */}
            <div style={{
            width: '100%', height: heights[i], marginTop: 8,
            borderRadius: '10px 10px 0 0',
            background: `linear-gradient(180deg, ${metalColors[i]}40 0%, ${metalColors[i]}15 100%)`,
            border: `1px solid ${metalColors[i]}30`,
            borderBottom: 'none',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center'
          }}>
              <span style={{ fontSize: i === 1 ? 28 : 22 }}>
                {medals[i]}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{
        height: 1, background: t.sep, margin: '0 16px'
      }} />

      {/* Rest of list */}
      <div style={{ flex: 1, padding: '4px 16px' }}>
        {rest.map((p, i) =>
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 0',
          borderBottom: i < rest.length - 1 ?
          `1px solid ${t.sep}` : 'none'
        }}>
            <span style={{
            fontFamily: t.hd, fontWeight: 700, fontSize: 14,
            color: t.textMut, width: 22, textAlign: 'center'
          }}>{i + 4}</span>
            <RCAvatar name={p.name} color={p.color} size={30} />
            <span style={{
            flex: 1, fontFamily: t.hd, fontWeight: 500,
            fontSize: 14, color: t.text
          }}>{p.name}</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{
              fontFamily: t.hd, fontWeight: 600, fontSize: 15
            }}>{p.points}</span>
              <div style={{
              fontSize: 10, color: t.textMut, fontFamily: t.hd
            }}>{p.weeks} wks</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <RCBottomNav accent={accent} theme={t} active="leaderboard" />
    </div>);

}

// ── Initial Photos: Step (reusable per pose) ────────
function InitialPhotosStep({ accent, dark, pose = 'front', step = 0 }) {
  const t = rcTheme(accent, dark);
  const labels = { front: 'Front', side: 'Side', back: 'Back' };
  const hints = {
    front: 'Face the camera, arms relaxed at sides',
    side: 'Turn to your left, stand naturally',
    back: 'Face away from the camera'
  };

  return (
    <div style={{
      minHeight: '100%', background: t.bg, color: t.text,
      fontFamily: t.bd, display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ padding: '64px 16px 0' }}>
        <RCStepDots step={step} total={3} accent={accent} theme={t} />
        <div style={{ textAlign: 'center', margin: '24px 0 0' }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>📸</div>
          <div style={{ fontFamily: t.hd, fontWeight: 700, fontSize: 22 }}>
            {labels[pose]} Photo
          </div>
          <div style={{ fontSize: 13, color: t.textSec, marginTop: 4 }}>
            {hints[pose]}
          </div>
        </div>
      </div>

      {/* Pose guide area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '0 48px'
      }}>
        <div style={{
          width: '100%', maxWidth: 200, aspectRatio: '3/4',
          border: `2px dashed ${accent}44`, borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 14,
          background: accent + '06'
        }}>
          {/* Simple body outline — circle + rect + lines */}
          <svg width="56" height="92" viewBox="0 0 56 92" fill="none">
            <circle cx="28" cy="12" r="9" stroke={accent + '44'} strokeWidth="2" />
            <rect x="16" y="25" width="24" height="30" rx="5"
            stroke={accent + '44'} strokeWidth="2" />
            <line x1="28" y1="55" x2="20" y2="84"
            stroke={accent + '44'} strokeWidth="2" strokeLinecap="round" />
            <line x1="28" y1="55" x2="36" y2="84"
            stroke={accent + '44'} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{
            fontFamily: t.hd, fontWeight: 600, fontSize: 13,
            color: accent + '77', letterSpacing: 1.5, textTransform: 'uppercase'
          }}>{labels[pose]}</span>
        </div>

        {/* Privacy note */}
        <div style={{
          marginTop: 20, padding: '8px 14px',
          background: t.surfaceBright, borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <span style={{
            fontSize: 11, color: t.textMut, fontFamily: t.hd, fontWeight: 500
          }}>Viewable by other participants</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 20px 6px' }}>
        <RCBtn accent={accent} full>📷 Take Photo</RCBtn>
      </div>
      <div style={{
        padding: '6px 20px 40px',
        display: 'flex', justifyContent: 'center'
      }}>
        <span style={{
          fontSize: 13, color: t.textMut,
          fontFamily: t.hd, fontWeight: 500
        }}>Skip for now — come back anytime</span>
      </div>
    </div>);

}

// ── Initial Photos: Done ────────────────────────────
function InitialPhotosDone({ accent, dark }) {
  const t = rcTheme(accent, dark);
  return (
    <div style={{
      minHeight: '100%', color: t.text, fontFamily: t.bd,
      background: t.dark ?
      'radial-gradient(ellipse at 50% 30%, #1a102e 0%, #0b0f1a 65%)' :
      '#f2f2f7',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 28px 60px', textAlign: 'center',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '18%', left: '50%',
        transform: 'translateX(-50%)',
        width: 200, height: 200, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      <div style={{ fontSize: 52, marginBottom: 16, position: 'relative' }}>
        💪
      </div>
      <div style={{
        fontFamily: t.hd, fontWeight: 700, fontSize: 26,
        marginBottom: 8, position: 'relative'
      }}>Starting photos saved!</div>
      <div style={{
        fontSize: 14, color: t.textSec, lineHeight: 1.6,
        marginBottom: 28, maxWidth: 280, position: 'relative'
      }}>
        You can retake these anytime before the challenge starts
      </div>

      {/* Thumbnails */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 36, position: 'relative'
      }}>
        {['Front', 'Side', 'Back'].map((pose) =>
        <div key={pose} style={{
          width: 80, height: 100, borderRadius: 12,
          background: t.surfaceBright,
          border: `1px solid ${t.border}`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 6
        }}>
            <span style={{ fontSize: 20 }}>📷</span>
            <span style={{
            fontFamily: t.hd, fontWeight: 500, fontSize: 11,
            color: t.textMut
          }}>{pose}</span>
          </div>
        )}
      </div>

      <div style={{ width: '100%', position: 'relative' }}>
        <RCBtn accent={accent} full>Back to Home</RCBtn>
      </div>
    </div>);

}

// ── Not Signed In Fallback ──────────────────────────
function NotSignedIn({ accent, dark }) {
  const t = rcTheme(accent, dark);
  return (
    <div style={{
      minHeight: '100%', background: t.bgGrad, color: t.text,
      fontFamily: t.bd, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '60px 32px', textAlign: 'center',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Subtle glow */}
      <div style={{
        position: 'absolute', top: '28%', left: '50%',
        transform: 'translateX(-50%)',
        width: 180, height: 180, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      {/* Star logo */}
      <div style={{
        fontSize: 36, color: accent, marginBottom: 12,
        filter: `drop-shadow(0 0 10px ${accent}44)`,
        position: 'relative'
      }}>★</div>
      <div style={{
        fontFamily: t.hd, fontWeight: 700, fontSize: 18,
        color: accent, letterSpacing: 2, marginBottom: 40,
        position: 'relative'
      }}>THE RECOMP GAMES</div>

      {/* Link icon */}
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: t.surface, border: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, position: 'relative'
      }}>
        <span style={{ fontSize: 26 }}>🔗</span>
      </div>

      <div style={{
        fontFamily: t.hd, fontWeight: 600, fontSize: 18,
        marginBottom: 8, position: 'relative'
      }}>You need a personal link</div>
      <div style={{
        fontSize: 14, color: t.textSec, lineHeight: 1.6,
        marginBottom: 36, maxWidth: 260, position: 'relative'
      }}>
        Check your group chat for your unique sign-in link. No passwords needed.
      </div>

      <div style={{ position: 'relative' }}>
        <RCBtn accent={accent} variant="secondary">
          View leaderboard →
        </RCBtn>
      </div>
    </div>);

}

// ── Home: Post Check-In (Monday confirmed) ────────
function HomeScreenCheckedIn({ accent, dark }) {
  const t = rcTheme(accent, dark);
  const d = RECOMP;
  const you = d.participants.find(function (p) {return p.isYou;});
  const yourRank = d.participants.indexOf(you) + 1;

  return (
    <div style={{
      minHeight: '100%', background: t.bgGrad, color: t.text,
      fontFamily: t.bd, display: 'flex', flexDirection: 'column'
    }}>
      <RCAppBar accent={accent} theme={t} />

      <div style={{
        flex: 1, padding: '4px 16px 12px',
        display: 'flex', flexDirection: 'column', gap: 14
      }}>
        {/* Greeting */}
        <div>
          <div style={{
            fontFamily: t.hd, fontWeight: 700, fontSize: 26, marginBottom: 4
          }}>Hey, {d.userName} 👋</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: t.hd, fontWeight: 500, fontSize: 13, color: t.textSec
            }}>Week {d.currentWeek} of {d.totalWeeks}</span>
            <div style={{
              flex: 1, height: 3, borderRadius: 2,
              background: t.sep, maxWidth: 100
            }}>
              <div style={{
                width: d.currentWeek / d.totalWeeks * 100 + '%',
                height: '100%', borderRadius: 2, background: accent
              }} />
            </div>
          </div>
        </div>

        {/* Check-in confirmed card */}
        <RCCard accent="#66BB6A" theme={t}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#66BB6A22',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#66BB6A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <span style={{
              fontFamily: t.hd, fontWeight: 600, fontSize: 15, color: '#66BB6A'
            }}>Week {d.currentWeek} check-in submitted</span>
          </div>
          <div style={{
            padding: '10px 12px', background: t.surfaceBright,
            borderRadius: 10, marginBottom: 10
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginBottom: 4
            }}>
              <span style={{
                fontFamily: t.hd, fontWeight: 600, fontSize: 14
              }}>84.5 kg</span>
              <span style={{
                fontFamily: t.hd, fontWeight: 500, fontSize: 12, color: '#66BB6A'
              }}>↓ 0.7 kg</span>
            </div>
            <div style={{
              fontSize: 12, color: t.textSec, lineHeight: 1.5
            }}>Good week — hit the gym 4x and stayed on track.</div>
          </div>
          <div style={{
            fontSize: 12, color: t.textMut,
            fontFamily: t.hd, fontWeight: 500
          }}>Next check-in opens next Monday 12:00 AM AEST</div>
        </RCCard>

        {/* Mini leaderboard */}
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 8
          }}>
            <span style={{ fontFamily: t.hd, fontWeight: 600, fontSize: 15 }}>
              🏆 Leaderboard
            </span>
            <span style={{
              fontSize: 12, color: accent, fontFamily: t.hd, fontWeight: 500
            }}>See all →</span>
          </div>
          {d.participants.slice(0, 3).map(function (p, i) {
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderBottom: i < 2 ? '1px solid ' + t.sep : 'none'
              }}>
                <span style={{
                  fontFamily: t.hd, fontWeight: 700, fontSize: 14,
                  color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32',
                  width: 18, textAlign: 'center'
                }}>{i + 1}</span>
                <RCAvatar name={p.name} color={p.color} size={28} />
                <span style={{
                  flex: 1, fontFamily: t.hd, fontWeight: 500, fontSize: 14,
                  color: p.isYou ? accent : t.text
                }}>
                  {p.name}{p.isYou ? ' (you)' : ''}
                </span>
                <span style={{
                  fontFamily: t.hd, fontWeight: 600, fontSize: 14, color: t.textSec
                }}>{p.points}</span>
              </div>);

          })}
          <div style={{
            marginTop: 8, padding: '8px 12px',
            background: t.accentDim, border: '1px solid ' + t.accentBorder,
            borderRadius: 10, fontFamily: t.hd, fontWeight: 600,
            fontSize: 12, color: accent, textAlign: 'center'
          }}>
            You're #{yourRank} with {you.points} points
          </div>
        </div>

        {/* Past check-ins */}
        <div>
          <span style={{ fontFamily: t.hd, fontWeight: 600, fontSize: 15 }}>
            Past Check-Ins
          </span>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8
          }}>
            {d.pastCheckIns.map(function (ci, i) {
              return (
                <div key={i} style={{
                  padding: '10px 12px', background: t.surface,
                  border: '1px solid ' + t.border, borderRadius: 10
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', marginBottom: 3
                  }}>
                    <span style={{
                      fontFamily: t.hd, fontWeight: 500, fontSize: 12, color: t.textSec
                    }}>Wk {ci.week} · {ci.range}</span>
                    <span style={{
                      fontFamily: t.hd, fontWeight: 600, fontSize: 13, color: accent
                    }}>{ci.weight} kg</span>
                  </div>
                  <div style={{ fontSize: 12, color: t.textSec, lineHeight: 1.4 }}>
                    {ci.note}
                  </div>
                </div>);

            })}
          </div>
        </div>
      </div>

      <RCBottomNav accent={accent} theme={t} active="home" />
    </div>);

}

// ── Participant Profile ─────────────────────────────
function ParticipantProfile({ accent, dark, participantIndex = 0 }) {
  const t = rcTheme(accent, dark);
  const d = RECOMP;
  const p = d.participants[participantIndex];
  const rank = participantIndex + 1;
  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const rankColor = rank <= 3 ? medalColors[rank - 1] : t.textMut;

  return (
    <div style={{
      minHeight: '100%', background: t.bgGrad, color: t.text,
      fontFamily: t.bd, display: 'flex', flexDirection: 'column'
    }}>
      {/* Hero */}
      <div style={{
        padding: '64px 20px 28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center'
      }}>
        <RCAvatar name={p.name} color={p.color} size={72} />
        <div style={{
          fontFamily: t.hd, fontWeight: 700, fontSize: 24, marginTop: 14
        }}>{p.name}</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 6
        }}>
          <span style={{
            fontFamily: t.hd, fontWeight: 700, fontSize: 14, color: rankColor
          }}>#{rank}</span>
          <span style={{
            fontFamily: t.hd, fontWeight: 500, fontSize: 13, color: t.textSec
          }}>· {p.weeks} weeks checked in</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', gap: 10, padding: '0 20px', marginBottom: 22
      }}>
        {[
        { label: 'Points', value: String(p.points), color: accent },
        { label: 'Rank', value: '#' + rank, color: rankColor },
        { label: 'Check-ins', value: p.weeks + '/' + d.totalWeeks, color: p.color }].
        map(function (s) {
          return (
            <div key={s.label} style={{
              flex: 1, padding: '14px 0', textAlign: 'center',
              background: t.surface, border: '1px solid ' + t.border,
              borderRadius: 14
            }}>
              <div style={{
                fontFamily: t.hd, fontWeight: 700, fontSize: 22, color: s.color
              }}>{s.value}</div>
              <div style={{
                fontFamily: t.hd, fontWeight: 500, fontSize: 11,
                color: t.textMut, marginTop: 3
              }}>{s.label}</div>
            </div>);

        })}
      </div>

      {/* Weight Progress */}
      <div style={{ padding: '0 20px', marginBottom: 16 }}>
        <RCWeightProgress accent={accent} theme={t} color={p.color} name={p.name} />
      </div>

      {/* Activity grid */}
      <div style={{ padding: '0 20px', flex: 1 }}>
        <div style={{
          fontFamily: t.hd, fontWeight: 600, fontSize: 15, marginBottom: 14
        }}>Activity</div>

        <div style={{
          padding: 16,
          background: t.surface, border: '1px solid ' + t.border,
          borderRadius: 14
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(13, 1fr)',
            gap: 5
          }}>
            {Array.from({ length: d.totalWeeks }, function (_, i) {
              var done = i < p.weeks;
              var isCurrent = i + 1 === d.currentWeek;
              return (
                <div key={i} style={{
                  aspectRatio: '1', borderRadius: 4,
                  background: done ?
                  p.color + '55' :
                  t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: isCurrent ? '2px solid ' + accent : '1px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isCurrent && <div style={{
                    width: 4, height: 4, borderRadius: '50%', background: accent
                  }} />}
                </div>);

            })}
          </div>

          <div style={{
            display: 'flex', gap: 16, marginTop: 12,
            fontSize: 11, color: t.textMut, fontFamily: t.hd, fontWeight: 500
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 8, height: 8, borderRadius: 2, background: p.color + '55'
              }} />
              Checked in
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 8, height: 8, borderRadius: 2,
                background: t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
              }} />
              Missed
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 8, height: 8, borderRadius: 2,
                border: '2px solid ' + accent, boxSizing: 'border-box'
              }} />
              Now
            </div>
          </div>
        </div>
      </div>

      <RCBottomNav accent={accent} theme={t} active="" />
    </div>);

}

// ── My Profile ──────────────────────────────────────
function MyProfile({ accent, dark }) {
  const t = rcTheme(accent, dark);
  const d = RECOMP;
  const you = d.participants.find(function (p) {return p.isYou;});
  const yourRank = d.participants.indexOf(you) + 1;

  return (
    <div style={{
      minHeight: '100%', background: t.bgGrad, color: t.text,
      fontFamily: t.bd, display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '56px 18px 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center'
      }}>
        <div style={{ position: 'relative' }}>
          <RCAvatar name={you.name} color={you.color} size={72} />
          <div style={{
            position: 'absolute', bottom: 0, right: -2,
            width: 24, height: 24, borderRadius: '50%',
            background: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid ' + t.bg
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="#0b0f1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
        </div>
        <div style={{
          fontFamily: t.hd, fontWeight: 700, fontSize: 24, marginTop: 12
        }}>{you.name}</div>
        <div style={{
          fontFamily: t.hd, fontWeight: 500, fontSize: 13,
          color: t.textSec, marginTop: 4
        }}>Rank #{yourRank} · Week {d.currentWeek} of {d.totalWeeks}</div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex', gap: 10, padding: '18px 20px 0'
      }}>
        {[
        { label: 'Points', value: String(you.points), color: accent },
        { label: 'Rank', value: '#' + yourRank, color: '#FFD700' },
        { label: 'Check-ins', value: you.weeks + '/' + d.totalWeeks, color: you.color }].
        map(function (s) {
          return (
            <div key={s.label} style={{
              flex: 1, padding: '12px 0', textAlign: 'center',
              background: t.surface, border: '1px solid ' + t.border,
              borderRadius: 14
            }}>
              <div style={{
                fontFamily: t.hd, fontWeight: 700, fontSize: 20, color: s.color
              }}>{s.value}</div>
              <div style={{
                fontFamily: t.hd, fontWeight: 500, fontSize: 11,
                color: t.textMut, marginTop: 2
              }}>{s.label}</div>
            </div>);

        })}
      </div>

      <div style={{
        flex: 1, padding: '16px 20px 12px',
        display: 'flex', flexDirection: 'column', gap: 16
      }}>
        {/* Weight Progress */}
        <RCWeightProgress accent={accent} theme={t} color={you.color} name={you.name} />

        {/* Starting Photos */}
        <div>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontFamily: t.hd, fontWeight: 600, fontSize: 15 }}>
              Starting Photos
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Front', 'Side', 'Back'].map(function (pose) {
              return (
                <div key={pose} style={{
                  flex: 1, aspectRatio: '3/4', borderRadius: 12,
                  background: t.surfaceBright,
                  border: '1px solid ' + t.border,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                  <span style={{ fontSize: 22 }}>📷</span>
                  <span style={{
                    fontFamily: t.hd, fontWeight: 500, fontSize: 11, color: t.textMut
                  }}>{pose}</span>
                </div>);

            })}
          </div>
        </div>

        {/* Recent Check-Ins */}
        <div>
          <span style={{ fontFamily: t.hd, fontWeight: 600, fontSize: 15 }}>
            Recent Check-Ins
          </span>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8
          }}>
            {d.pastCheckIns.map(function (ci, i) {
              return (
                <div key={i} style={{
                  padding: '10px 12px', background: t.surface,
                  border: '1px solid ' + t.border, borderRadius: 10
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', marginBottom: 3
                  }}>
                    <span style={{
                      fontFamily: t.hd, fontWeight: 500, fontSize: 12, color: t.textSec
                    }}>Wk {ci.week} · {ci.range}</span>
                    <span style={{
                      fontFamily: t.hd, fontWeight: 600, fontSize: 13, color: accent
                    }}>{ci.weight} kg</span>
                  </div>
                  <div style={{ fontSize: 12, color: t.textSec, lineHeight: 1.4 }}>
                    {ci.note}
                  </div>
                </div>);

            })}
          </div>
        </div>
      </div>

      <RCBottomNav accent={accent} theme={t} active="profile" />
    </div>);

}

Object.assign(window, {
  HomeScreen, HomeScreenCheckedIn,
  CheckInStep1, CheckInStep2, CheckInConfirm,
  InitialPhotosStep, InitialPhotosDone, NotSignedIn,
  LeaderboardClean, LeaderboardPodium, ParticipantProfile, MyProfile
});