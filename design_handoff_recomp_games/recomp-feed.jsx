// Recomp Games — Activity Feed Components

function FeedReactions({ reactions, theme }) {
  const t = theme;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {Object.entries(reactions).map(([emoji, count]) => (
        <div key={emoji} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', borderRadius: 12,
          background: t.surfaceBright,
          border: '1px solid ' + t.border,
          fontSize: 12
        }}>
          <span>{emoji}</span>
          <span style={{
            fontFamily: t.hd, fontWeight: 600, fontSize: 11, color: t.textSec
          }}>{count}</span>
        </div>
      ))}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, borderRadius: '50%',
        background: t.surfaceBright, border: '1px solid ' + t.border,
        fontSize: 12, color: t.textMut
      }}>+</div>
    </div>
  );
}

function FeedWeightBadge({ item, theme }) {
  const t = theme;
  return (
    <span style={{
      fontSize: 12, fontFamily: t.hd, fontWeight: 600,
      color: item.change <= 0 ? '#66BB6A' : t.textSec,
      padding: '2px 8px', borderRadius: 6,
      background: item.change <= 0 ? '#66BB6A15' : (t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
    }}>
      {item.change <= 0 ? '↓' : '↑'} {Math.abs(item.change)} kg
    </span>
  );
}

// ── Option A: Compact List ──────────────────────────
function ActivityFeedA({ accent, dark }) {
  const t = rcTheme(accent, dark);
  const d = RECOMP;

  return (
    <div style={{
      minHeight: '100%', background: t.bgGrad, color: t.text,
      fontFamily: t.bd, display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ padding: '60px 18px 14px' }}>
        <div style={{
          fontFamily: t.hd, fontWeight: 700, fontSize: 26
        }}>Activity</div>
        <div style={{
          fontFamily: t.hd, fontWeight: 500, fontSize: 13,
          color: t.textSec, marginTop: 2
        }}>Week {d.currentWeek} check-ins</div>
      </div>

      <div style={{ flex: 1, padding: '0 16px' }}>
        {d.feedItems.map(function(item, i) {
          return (
            <div key={i} style={{
              padding: '14px 0',
              borderBottom: i < d.feedItems.length - 1
                ? '1px solid ' + t.sep : 'none'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8
              }}>
                <RCAvatar name={item.name} color={item.color} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: t.hd, fontWeight: 600, fontSize: 14,
                    color: item.isYou ? accent : t.text
                  }}>
                    {item.name}{item.isYou ? ' (you)' : ''}
                  </div>
                  <div style={{
                    fontSize: 11, color: t.textMut, fontFamily: t.hd, fontWeight: 500
                  }}>Wk {item.week} check-in · {item.time}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: t.hd, fontWeight: 700, fontSize: 16
                  }}>{item.weight} kg</div>
                  <div style={{
                    fontSize: 11, fontFamily: t.hd, fontWeight: 500,
                    color: item.change <= 0 ? '#66BB6A' : t.textSec
                  }}>{item.change <= 0 ? '↓' : '↑'} {Math.abs(item.change)} kg</div>
                </div>
              </div>
              <div style={{
                fontSize: 13, color: t.textSec, lineHeight: 1.5,
                paddingLeft: 42, marginBottom: 8
              }}>"{item.note}"</div>
              <div style={{ paddingLeft: 42 }}>
                <FeedReactions reactions={item.reactions} theme={t} />
              </div>
            </div>
          );
        })}
      </div>

      <RCBottomNav accent={accent} theme={t} active="activity" />
    </div>
  );
}

// ── Option B: Cards ─────────────────────────────────
function ActivityFeedB({ accent, dark }) {
  const t = rcTheme(accent, dark);
  const d = RECOMP;

  return (
    <div style={{
      minHeight: '100%', background: t.bgGrad, color: t.text,
      fontFamily: t.bd, display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ padding: '60px 18px 14px' }}>
        <div style={{
          fontFamily: t.hd, fontWeight: 700, fontSize: 26
        }}>Activity</div>
        <div style={{
          fontFamily: t.hd, fontWeight: 500, fontSize: 13,
          color: t.textSec, marginTop: 2
        }}>Week {d.currentWeek} · {d.weekRange}</div>
      </div>

      <div style={{
        flex: 1, padding: '0 16px',
        display: 'flex', flexDirection: 'column', gap: 10
      }}>
        {d.feedItems.map(function(item, i) {
          return (
            <RCCard key={i} accent={item.color} theme={t}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10
              }}>
                <RCAvatar name={item.name} color={item.color} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: t.hd, fontWeight: 600, fontSize: 15,
                    color: item.isYou ? accent : t.text
                  }}>
                    {item.name}{item.isYou ? ' (you)' : ''}
                  </div>
                  <div style={{
                    fontSize: 11, color: t.textMut, fontFamily: t.hd, fontWeight: 500
                  }}>{item.time}</div>
                </div>
                <div style={{
                  padding: '6px 12px', borderRadius: 10,
                  background: item.color + '18',
                  border: '1px solid ' + item.color + '33'
                }}>
                  <span style={{
                    fontFamily: t.hd, fontWeight: 700, fontSize: 16
                  }}>{item.weight}</span>
                  <span style={{
                    fontFamily: t.hd, fontWeight: 500, fontSize: 12,
                    color: t.textMut, marginLeft: 2
                  }}>kg</span>
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8
              }}>
                <FeedWeightBadge item={item} theme={t} />
              </div>
              <div style={{
                fontSize: 13, color: t.textSec, lineHeight: 1.5, marginBottom: 10
              }}>"{item.note}"</div>
              <FeedReactions reactions={item.reactions} theme={t} />
            </RCCard>
          );
        })}
      </div>

      <RCBottomNav accent={accent} theme={t} active="activity" />
    </div>
  );
}

// ── Option C: Timeline with day grouping ────────────
function ActivityFeedC({ accent, dark }) {
  const t = rcTheme(accent, dark);
  const d = RECOMP;

  var today = d.feedItems.filter(function(i) {
    return i.time.indexOf('h ago') !== -1;
  });
  var yesterday = d.feedItems.filter(function(i) {
    return i.time === 'Yesterday';
  });
  var older = d.feedItems.filter(function(i) {
    return i.time.indexOf('h ago') === -1 && i.time !== 'Yesterday';
  });

  var groups = [
    { label: 'Today', items: today },
    { label: 'Yesterday', items: yesterday },
    { label: 'Earlier', items: older }
  ].filter(function(g) { return g.items.length > 0; });

  return (
    <div style={{
      minHeight: '100%', background: t.bgGrad, color: t.text,
      fontFamily: t.bd, display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ padding: '60px 18px 8px' }}>
        <div style={{
          fontFamily: t.hd, fontWeight: 700, fontSize: 26
        }}>Activity</div>
        <div style={{
          fontFamily: t.hd, fontWeight: 500, fontSize: 13,
          color: t.textSec, marginTop: 2
        }}>Week {d.currentWeek} check-ins</div>
      </div>

      <div style={{ flex: 1, padding: '0 16px' }}>
        {groups.map(function(group) {
          return (
            <div key={group.label}>
              <div style={{
                fontFamily: t.hd, fontWeight: 600, fontSize: 12,
                color: t.textMut, letterSpacing: 1.2, textTransform: 'uppercase',
                padding: '14px 0 8px'
              }}>{group.label}</div>

              {group.items.map(function(item, i) {
                return (
                  <div key={i} style={{
                    display: 'flex', gap: 12, marginBottom: 4,
                    position: 'relative'
                  }}>
                    {/* Timeline connector */}
                    {i < group.items.length - 1 && (
                      <div style={{
                        position: 'absolute', left: 16, top: 40,
                        width: 2, bottom: -4,
                        background: t.sep, borderRadius: 1
                      }} />
                    )}
                    <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
                      <RCAvatar name={item.name} color={item.color} size={34} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingBottom: 14 }}>
                      <div style={{
                        display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 5
                      }}>
                        <span style={{
                          fontFamily: t.hd, fontWeight: 600, fontSize: 14,
                          color: item.isYou ? accent : t.text
                        }}>{item.name}</span>
                        <span style={{
                          fontSize: 11, color: t.textMut, fontFamily: t.hd, fontWeight: 500
                        }}>{item.time}</span>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6
                      }}>
                        <span style={{
                          fontFamily: t.hd, fontWeight: 700, fontSize: 18
                        }}>{item.weight} kg</span>
                        <FeedWeightBadge item={item} theme={t} />
                      </div>
                      {/* Scale photo */}
                      <div style={{
                        width: 64, height: 48, borderRadius: 8,
                        background: t.surfaceBright,
                        border: '1px solid ' + t.border,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 8
                      }}>
                        <div style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1
                        }}>
                          <span style={{ fontSize: 9, fontFamily: t.hd, fontWeight: 700, color: t.text }}>{item.weight}</span>
                          <span style={{ fontSize: 7, fontFamily: t.hd, fontWeight: 500, color: t.textMut }}>kg</span>
                        </div>
                      </div>
                      <div style={{
                        fontSize: 13, color: t.textSec, lineHeight: 1.5, marginBottom: 8
                      }}>{item.note}</div>
                      <FeedReactions reactions={item.reactions} theme={t} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <RCBottomNav accent={accent} theme={t} active="activity" />
    </div>
  );
}

Object.assign(window, {
  ActivityFeedA, ActivityFeedB, ActivityFeedC
});
