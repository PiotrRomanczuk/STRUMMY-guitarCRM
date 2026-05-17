// Admin dashboard — "Is the platform healthy and who's stuck?"
// HERO: two-up — platform pulse (left) + at-risk students (right)
// SECONDARY: services status, cohort insights, audit log, pending invites, AI assistant strip

const AdminDashboard = ({ width = 1440, height = 1024 }) => (
  <div className="app-viewport" style={{
    width, height, display:'flex',
    background:'var(--ivory)', color:'var(--ink)',
    fontSize:13, lineHeight:1.4, overflow:'hidden',
    borderRadius:'var(--radius-lg)',
  }}>
    <SidebarNav active="home" />
    <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
      <TopBar variant="admin" />
      <div style={{ flex:1, overflowY:'auto', padding:'24px 32px 64px', background:'var(--ivory)' }}>
        <AdminGreeting />
        <AdminHero />
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:20, marginTop:20 }}>
          <AdminCohortInsights />
          <AdminServices />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:20, marginTop:20 }}>
          <AdminAuditLog />
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <AdminPending />
            <AdminAssistantStrip />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AdminGreeting = () => (
  <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20 }}>
    <div>
      <div style={{ color:'var(--ink-4)', fontFamily:'var(--mono)', fontSize:11,
                    textTransform:'uppercase', letterSpacing:'.16em', marginBottom:6 }}>
        Platform · Thursday · Apr 23, 2026
      </div>
      <h1 style={{ margin:0, fontFamily:'var(--serif)', fontWeight:400, fontSize:36, letterSpacing:'-0.02em' }}>
        Everything sounds <em style={{ color:'var(--gold-2)' }}>roughly in tune</em>.
      </h1>
      <div style={{ color:'var(--ink-3)', fontSize:14, marginTop:8, maxWidth:580 }}>
        Spotify is showing elevated latency · <span style={{ color:'var(--danger)' }}>5 students</span> trending toward churn this week.
      </div>
    </div>
    <div style={{ display:'flex', gap:8 }}>
      <button style={{ padding:'9px 14px', borderRadius:8, border:'1px solid var(--rule)',
                       background:'var(--card)', color:'var(--ink-2)', fontSize:13, cursor:'pointer' }}>
        Send report
      </button>
      <button style={{ padding:'9px 14px', borderRadius:8, background:'var(--ink)', color:'var(--paper)',
                       border:'none', fontSize:13, fontWeight:500, cursor:'pointer',
                       display:'inline-flex', alignItems:'center', gap:6 }}>
        <Icon d={I.plus} size={12} stroke="var(--paper)" /> Invite user
      </button>
    </div>
  </div>
);

// ─── HERO: platform pulse + at-risk ─────────────────────────
const AdminHero = () => (
  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
    <AdminPlatformPulse />
    <AdminAtRisk />
  </div>
);

const AdminPlatformPulse = () => {
  const p = ADMIN_PLATFORM;
  return (
    <div style={{
      position:'relative', overflow:'hidden',
      background:'var(--card)', border:'1px solid var(--rule)', borderRadius:18,
      boxShadow:'0 1px 2px rgba(26,22,19,.04), 0 10px 40px -20px rgba(26,22,19,.08)',
      padding:'28px 30px',
      display:'flex', flexDirection:'column', gap:18, minHeight:380,
    }}>
      <div style={{ position:'absolute', inset:0, opacity:0.45 }}>
        <StringVibration width={800} height={380} color="var(--success)" opacity={0.10} />
      </div>
      <div style={{ position:'relative', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <PulseDot color="var(--success)" />
            <Eyebrow style={{ color:'var(--success)' }}>Platform pulse</Eyebrow>
          </div>
          <div style={{ fontFamily:'var(--serif)', fontSize:56, letterSpacing:'-0.035em',
                        lineHeight:1, fontWeight:400, marginTop:10 }}>
            <em style={{ color:'var(--success)' }}>Healthy</em>
            <span style={{ color:'var(--ink-4)', fontSize:18, marginLeft:10, fontStyle:'italic' }}>· 1 watch</span>
          </div>
          <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:8, maxWidth:380 }}>
            All core services responding. <span style={{ color:'var(--warn)' }}>Spotify p95 elevated</span> over the last 30m — auto-degraded matchers.
          </div>
        </div>
      </div>

      {/* big metrics */}
      <div style={{ position:'relative', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14, marginTop:'auto' }}>
        {[
          { label:'Active 30d', value:p.activeUsers30d, delta:p.activeUsersΔ, format:'count' },
          { label:'Lessons / wk',  value:p.lessonsThisWeek, delta:p.lessonsThisWeekΔ, format:'count' },
          { label:'MRR',           value:p.mrr, delta:p.mrrΔ, format:'currency' },
        ].map((m, i) => (
          <div key={i} style={{ borderLeft: i === 0 ? 'none' : '1px solid var(--rule)', paddingLeft: i === 0 ? 0 : 14 }}>
            <div style={{ fontFamily:'var(--serif)', fontSize:36, letterSpacing:'-0.025em', fontWeight:500, lineHeight:1 }}>
              {m.format === 'currency' ? '$' : ''}
              <CountUp to={m.value} fmt={n => Math.round(n).toLocaleString()} />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
              <Eyebrow>{m.label}</Eyebrow>
              <span style={{ fontFamily:'var(--mono)', fontSize:10,
                             color: m.delta.startsWith('+') ? 'var(--success)' : 'var(--danger)' }}>
                {m.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* tab notation strip */}
      <div style={{ position:'relative', marginTop:6 }}>
        <TabNotation items={[
          { label:'Retention 28d', value:`${p.retention28d}%` },
          { label:'New 7d',        value:`+${p.newSignups7d}` },
          { label:'Avg sess.',     value:'34m' },
          { label:'NPS',           value:'62' },
        ]} height={66} />
      </div>
    </div>
  );
};

const AdminAtRisk = () => (
  <div style={{
    background:'var(--card)', border:'1px solid var(--rule)', borderRadius:18,
    boxShadow:'0 1px 2px rgba(26,22,19,.04), 0 10px 40px -20px rgba(26,22,19,.08)',
    padding:'24px 26px', minHeight:380, display:'flex', flexDirection:'column',
  }}>
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8 }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--danger)',
                         boxShadow:'0 0 0 3px rgba(184,74,58,.18)' }} />
          <Eyebrow style={{ color:'var(--danger)' }}>Trending churn · 7d</Eyebrow>
        </div>
        <div style={{ fontFamily:'var(--serif)', fontSize:28, letterSpacing:'-0.02em', marginTop:6 }}>
          5 students at risk
        </div>
      </div>
      <a style={{ color:'var(--ink-4)', fontSize:12, cursor:'pointer' }}>Open cohort →</a>
    </div>

    <div style={{ display:'flex', flexDirection:'column', flex:1, marginTop:8 }}>
      {ADMIN_AT_RISK.map((s, i) => (
        <div key={i} style={{
          display:'grid', gridTemplateColumns:'30px 1fr auto auto', gap:10, alignItems:'center',
          padding:'10px 0',
          borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
          borderBottom:'1px solid var(--rule)',
        }}>
          <div style={{ width:26, height:26, borderRadius:'50%', background:s.color, color:'#fff',
                        fontSize:10, fontWeight:600,
                        display:'grid', placeItems:'center' }}>{s.avatar}</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:500 }}>{s.name}</div>
            <div style={{ fontSize:11, color:'var(--ink-3)' }}>
              <span style={{ color:'var(--ink-4)' }}>{s.teacher} · </span>{s.reason}
            </div>
          </div>
          {/* churn meter */}
          <div style={{ width:80 }}>
            <div style={{ display:'flex', justifyContent:'flex-end',
                          fontFamily:'var(--mono)', fontSize:10,
                          color: s.churn > 70 ? 'var(--danger)' : s.churn > 50 ? 'var(--warn)' : 'var(--ink-4)' }}>
              {s.churn}%
            </div>
            <ProgressBar value={s.churn} max={100} delay={70*i} height={3}
                         color={s.churn > 70 ? 'var(--danger)' : s.churn > 50 ? 'var(--warn)' : 'var(--ink-4)'} />
          </div>
          <button style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--rule)',
                           background:'var(--card)', color:'var(--ink-2)', fontSize:10, cursor:'pointer' }}>
            Draft email
          </button>
        </div>
      ))}
    </div>
  </div>
);

// ─── Cohort insights ─────────────────────────────────────────
const AdminCohortInsights = () => (
  <div style={{ background:'var(--card)', border:'1px solid var(--rule)', borderRadius:14,
                padding:'20px 22px', boxShadow:'var(--shadow-sm)' }}>
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:14 }}>
      <div>
        <Eyebrow>Cohort health</Eyebrow>
        <div style={{ fontFamily:'var(--serif)', fontSize:18, marginTop:2 }}>744 students across the platform</div>
      </div>
      <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)' }}>Snapshot · 4:00p</span>
    </div>
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {ADMIN_COHORT_INSIGHTS.map((c, i) => {
        const total = c.count;
        return (
          <div key={i}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:500 }}>{c.cohort}</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>{c.count}</span>
            </div>
            {/* stacked bar */}
            <div style={{ display:'flex', height:8, borderRadius:4, overflow:'hidden', background:'var(--rule-2)' }}>
              <div style={{ width:`${c.healthy/total*100}%`, background:'var(--success)' }} />
              <div style={{ width:`${c.atRisk/total*100}%`, background:'var(--warn)' }} />
              <div style={{ width:`${c.dormant/total*100}%`, background:'var(--ink-4)' }} />
            </div>
            <div style={{ display:'flex', gap:14, marginTop:6, fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-3)' }}>
              <span><span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'var(--success)', marginRight:4 }} />
                Healthy {c.healthy}</span>
              <span><span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'var(--warn)', marginRight:4 }} />
                At risk {c.atRisk}</span>
              <span><span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'var(--ink-4)', marginRight:4 }} />
                Dormant {c.dormant}</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Services status ─────────────────────────────────────────
const AdminServices = () => {
  const dotColor = (s) => ({ ok:'var(--success)', degraded:'var(--warn)', down:'var(--danger)' }[s] || 'var(--ink-4)');
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--rule)', borderRadius:14,
                  padding:'20px 22px', boxShadow:'var(--shadow-sm)' }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
        <Eyebrow>Services</Eyebrow>
        <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--success)' }}>5/6 OK</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column' }}>
        {ADMIN_SERVICES.map((s, i) => (
          <div key={i} style={{
            display:'grid', gridTemplateColumns:'14px 1fr auto auto', gap:12, alignItems:'center',
            padding:'10px 0',
            borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
            borderBottom:'1px solid var(--rule)',
          }}>
            <span style={{ position:'relative', display:'inline-flex', width:8, height:8 }}>
              <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:dotColor(s.status) }} />
              {s.status === 'degraded' && (
                <span style={{
                  position:'absolute', inset:-3, borderRadius:'50%', border:`1.5px solid ${dotColor(s.status)}`,
                  opacity:0.4, animation:'strummy-pulse 1.6s ease-out infinite',
                }} />
              )}
            </span>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>{s.name}</div>
              {s.note && <div style={{ fontSize:11, color:'var(--warn)' }}>{s.note}</div>}
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-3)', textAlign:'right' }}>
              <div>{s.latency}</div>
              <div style={{ fontSize:10, color:'var(--ink-4)' }}>{s.uptime}</div>
            </div>
            <Icon d={I.chevron} size={12} style={{ color:'var(--ink-4)' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Audit log ───────────────────────────────────────────────
const AdminAuditLog = () => (
  <div style={{ background:'var(--card)', border:'1px solid var(--rule)', borderRadius:14,
                padding:'20px 22px', boxShadow:'var(--shadow-sm)' }}>
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
      <div>
        <Eyebrow>Audit log</Eyebrow>
        <div style={{ fontFamily:'var(--serif)', fontSize:18, marginTop:2 }}>Recent activity</div>
      </div>
      <div style={{ display:'flex', gap:4 }}>
        {['All','Admin','Teacher','System'].map((t,i) => (
          <button key={t} style={{
            padding:'4px 10px', borderRadius:999, fontSize:10, cursor:'pointer',
            border: i === 0 ? 'none' : '1px solid var(--rule)',
            background: i === 0 ? 'var(--ink)' : 'transparent',
            color: i === 0 ? 'var(--paper)' : 'var(--ink-3)',
          }}>{t}</button>
        ))}
      </div>
    </div>
    <div style={{ display:'flex', flexDirection:'column' }}>
      {ADMIN_AUDIT.map((a, i) => {
        const rc = { admin:'var(--gold-2)', teacher:'var(--info)', system:'var(--ink-4)' }[a.role];
        return (
          <div key={i} style={{
            display:'grid', gridTemplateColumns:'8px 1fr auto', gap:14, alignItems:'flex-start',
            padding:'10px 0',
            borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
            borderBottom:'1px solid var(--rule)',
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:rc, marginTop:6 }} />
            <div style={{ fontSize:12, lineHeight:1.45 }}>
              <span style={{ fontFamily:'var(--mono)', color:'var(--ink-3)' }}>{a.who}</span>{' '}
              <span style={{ color:'var(--ink-2)' }}>{a.verb}</span>{' '}
              <span style={{ color:'var(--ink)', fontWeight:500 }}>{a.obj}</span>
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)' }}>
              <TimeAgo minutes={a.mins} />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Pending invites ─────────────────────────────────────────
const AdminPending = () => (
  <div style={{ background:'var(--card)', border:'1px solid var(--rule)', borderRadius:14,
                padding:'20px 22px', boxShadow:'var(--shadow-sm)' }}>
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10 }}>
      <Eyebrow>Pending invites</Eyebrow>
      <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)' }}>{ADMIN_PENDING.length} open</span>
    </div>
    <div style={{ display:'flex', flexDirection:'column' }}>
      {ADMIN_PENDING.map((p, i) => (
        <div key={i} style={{
          display:'grid', gridTemplateColumns:'1fr auto auto', gap:10, alignItems:'center',
          padding:'10px 0',
          borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
          borderBottom:'1px solid var(--rule)',
        }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--ink-2)', textOverflow:'ellipsis', overflow:'hidden' }}>{p.email}</div>
            <div style={{ fontSize:11, color:'var(--ink-4)' }}>{p.role} · {p.when} · by {p.invitedBy}</div>
          </div>
          <button style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--rule)',
                           background:'transparent', fontSize:10, cursor:'pointer', color:'var(--ink-3)' }}>
            Resend
          </button>
          <button style={{ padding:'4px 10px', borderRadius:6, border:'none',
                           background:'var(--ink)', color:'var(--paper)', fontSize:10, cursor:'pointer' }}>
            Approve
          </button>
        </div>
      ))}
    </div>
  </div>
);

const AdminAssistantStrip = () => (
  <div style={{
    position:'relative', overflow:'hidden',
    background:'linear-gradient(135deg, var(--ink) 0%, var(--ink-2) 100%)',
    color:'var(--paper)', borderRadius:14, padding:'20px 22px',
    boxShadow:'0 10px 30px -16px rgba(0,0,0,.4)',
  }}>
    <div style={{ position:'absolute', inset:0, opacity:0.35 }}>
      <StringVibration width={500} height={200} color="var(--gold-dim)" opacity={0.4} />
    </div>
    <div style={{ position:'relative', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width:36, height:36, borderRadius:10,
                    background:'linear-gradient(135deg, var(--gold-2), var(--gold))',
                    display:'grid', placeItems:'center' }}>
        <Icon d={I.spark} size={18} stroke="#fff" />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <Eyebrow style={{ color:'var(--gold-dim)' }}>Strummy AI</Eyebrow>
        <div style={{ fontFamily:'var(--serif)', fontSize:15, fontStyle:'italic', marginTop:2, lineHeight:1.35 }}>
          "Carlos is the highest-risk of your watchlist. Want me to draft a 3-step re-engagement plan?"
        </div>
      </div>
      <button style={{ padding:'8px 14px', borderRadius:8, border:'none',
                       background:'var(--gold-2)', color:'#fff', fontWeight:500, fontSize:12, cursor:'pointer' }}>
        Draft plan
      </button>
    </div>
  </div>
);

// ─── MOBILE ──────────────────────────────────────────────────
const AdminDashboardMobile = () => (
  <div className="app-viewport" style={{
    width:390, height:844, background:'var(--ivory)', color:'var(--ink)',
    overflow:'hidden', borderRadius:'var(--radius-lg)', display:'flex', flexDirection:'column',
  }}>
    <div style={{ height:44, padding:'12px 24px 0', display:'flex', justifyContent:'space-between',
                  alignItems:'center', fontFamily:'var(--mono)', fontSize:13, fontWeight:600 }}>
      <span>3:46</span><span>● ● ●</span>
    </div>
    <div style={{ padding:'8px 20px 12px' }}>
      <Eyebrow>Platform · Apr 23</Eyebrow>
      <div style={{ fontFamily:'var(--serif)', fontSize:22, marginTop:2, letterSpacing:'-0.02em' }}>
        <em style={{ color:'var(--success)' }}>Healthy</em> · 1 watch
      </div>
    </div>

    <div style={{ flex:1, overflowY:'auto', padding:'4px 16px 32px', display:'flex', flexDirection:'column', gap:12 }}>
      {/* Pulse hero */}
      <div style={{
        position:'relative', overflow:'hidden',
        background:'var(--card)', borderRadius:16, border:'1px solid var(--rule)',
        padding:'16px 18px', boxShadow:'var(--shadow-sm)',
      }}>
        <div style={{ position:'absolute', inset:0, opacity:0.45 }}>
          <StringVibration width={400} height={180} color="var(--success)" opacity={0.10} />
        </div>
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <PulseDot color="var(--success)" size={6} />
            <Eyebrow style={{ color:'var(--success)' }}>Platform pulse</Eyebrow>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:12 }}>
            {[
              { v:1284, l:'Active 30d', d:'+8.2%' },
              { v:412,  l:'Lessons /wk', d:'+12%' },
              { v:'$18.4k', l:'MRR', d:'+$640' },
            ].map((m,i) => (
              <div key={i} style={{ borderLeft: i === 0 ? 'none' : '1px solid var(--rule)', paddingLeft: i === 0 ? 0 : 10 }}>
                <div style={{ fontFamily:'var(--serif)', fontSize:22, letterSpacing:'-0.02em', fontWeight:500 }}>
                  {typeof m.v === 'number' ? m.v.toLocaleString() : m.v}
                </div>
                <Eyebrow style={{ marginTop:2 }}>{m.l}</Eyebrow>
                <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--success)', marginTop:1 }}>{m.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* At risk */}
      <div style={{ background:'var(--card)', borderRadius:14, border:'1px solid var(--rule)', padding:'14px 16px', boxShadow:'var(--shadow-sm)' }}>
        <Eyebrow style={{ color:'var(--danger)', marginBottom:8 }}>At risk · 5 students</Eyebrow>
        {ADMIN_AT_RISK.slice(0, 4).map((s, i) => (
          <div key={i} style={{
            display:'grid', gridTemplateColumns:'24px 1fr auto', gap:10, alignItems:'center',
            padding:'8px 0',
            borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
            borderBottom:'1px solid var(--rule)',
          }}>
            <div style={{ width:22, height:22, borderRadius:'50%', background:s.color, color:'#fff',
                          fontSize:9, fontWeight:600, display:'grid', placeItems:'center' }}>{s.avatar}</div>
            <div>
              <div style={{ fontSize:12, fontWeight:500 }}>{s.name}</div>
              <div style={{ fontSize:10, color:'var(--ink-3)' }}>{s.reason}</div>
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:10,
                          color: s.churn > 70 ? 'var(--danger)' : 'var(--warn)' }}>
              {s.churn}%
            </div>
          </div>
        ))}
      </div>

      {/* Services */}
      <div style={{ background:'var(--card)', borderRadius:14, border:'1px solid var(--rule)', padding:'14px 16px', boxShadow:'var(--shadow-sm)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
          <Eyebrow>Services</Eyebrow>
          <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--success)' }}>5/6 OK</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
          {ADMIN_SERVICES.map((s, i) => (
            <div key={i} style={{
              border:'1px solid var(--rule)', borderRadius:8, padding:'8px',
              display:'flex', flexDirection:'column', alignItems:'flex-start', gap:4,
            }}>
              <span style={{ width:6, height:6, borderRadius:'50%',
                             background: s.status === 'ok' ? 'var(--success)' : s.status === 'degraded' ? 'var(--warn)' : 'var(--danger)' }} />
              <div style={{ fontSize:11, fontWeight:500 }}>{s.name}</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--ink-4)' }}>{s.latency}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign:'center', fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)', marginTop:6, letterSpacing:'.1em' }}>
        COHORTS · AUDIT · INVITES
      </div>
    </div>
  </div>
);

window.AdminDashboard = AdminDashboard;
window.AdminDashboardMobile = AdminDashboardMobile;
