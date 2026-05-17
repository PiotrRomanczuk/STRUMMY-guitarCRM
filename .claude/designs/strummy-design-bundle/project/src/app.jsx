// Mount both directions inside a DesignCanvas with artboards.

const App = () => {
  const [fbStyle, setFbStyle] = React.useState('engraved');
  // Listen for style changes from the Tweaks panel
  React.useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail.fbStyle) setFbStyle(e.detail.fbStyle);
    };
    window.addEventListener('fb-style-change', handler);
    return () => window.removeEventListener('fb-style-change', handler);
  }, []);
  return (
  <DesignCanvas>
    <DCSection id="landing" title="Landing Page" subtitle="Strummy.app — editorial light, warm tone · Desktop + Mobile">
      <DCArtboard id="landing-desktop" label="Desktop · 1440 wide · full scroll" width={1440} height={5400}>
        <LandingPageDesktop />
      </DCArtboard>
      <DCArtboard id="landing-mobile" label="Mobile · 390 wide" width={390} height={3600}>
        <LandingPageMobile />
      </DCArtboard>
    </DCSection>
    <DCSection id="fretboard" title="Fretboard Explorer" subtitle="Desktop (1440 × 1024) · Mobile (390 × 844) · Interactive — pick a key & scale">
      <DCArtboard id="fb-desktop" label="Desktop · 3-column · Editorial Light" width={1440} height={1024}>
        <FretboardExplorer fretboardStyle={fbStyle} />
      </DCArtboard>
      <DCArtboard id="fb-mobile" label="Mobile · Stacked · Landscape hint" width={390} height={844}>
        <FretboardExplorerMobile fretboardStyle={fbStyle} />
      </DCArtboard>
    </DCSection>
    <DCSection id="dashboards" title="Role-Specific Dashboards" subtitle="One hero per role · String-vibration ambient · Fret-progress · Tab-rule dividers · Mobile-first">
      <DCArtboard id="student-desktop" label="Student · Desktop · 1440 × 1024 — practice hero" width={1440} height={1024}>
        <StudentDashboard />
      </DCArtboard>
      <DCArtboard id="student-mobile" label="Student · Mobile · 390 × 844" width={390} height={844}>
        <StudentDashboardMobile />
      </DCArtboard>
      <DCArtboard id="teacher-desktop" label="Teacher · Desktop · 1440 × 1024 — day-spine schedule" width={1440} height={1024}>
        <TeacherDashboardNew />
      </DCArtboard>
      <DCArtboard id="teacher-mobile" label="Teacher · Mobile · 390 × 844" width={390} height={844}>
        <TeacherDashboardMobile />
      </DCArtboard>
      <DCArtboard id="admin-desktop" label="Admin · Desktop · 1440 × 1024 — pulse + at-risk" width={1440} height={1024}>
        <AdminDashboard />
      </DCArtboard>
      <DCArtboard id="admin-mobile" label="Admin · Mobile · 390 × 844" width={390} height={844}>
        <AdminDashboardMobile />
      </DCArtboard>
    </DCSection>
    <DCSection id="teacher-old" title="Teacher (earlier directions)" subtitle="Desktop · 1440 × 1024 · two A/B directions kept for reference">
      <DCArtboard id="safe" label="A · Editorial Light — safe" width={1440} height={1024}>
        <DirectionA />
      </DCArtboard>
      <DCArtboard id="bold" label="B · Music Manuscript — bold" width={1440} height={1024}>
        <DirectionB />
      </DCArtboard>
    </DCSection>
    <DCSection id="song-form" title="Song Form" subtitle="Most field-heavy form in the app · Create/Edit · Spotify-assisted">
      <DCArtboard id="form-a" label="A · Editorial single-page — desktop" width={1440} height={1200}>
        <SongFormA />
      </DCArtboard>
      <DCArtboard id="form-b" label="B · Music Manuscript — desktop" width={1440} height={1200}>
        <SongFormB />
      </DCArtboard>
      <DCArtboard id="form-mobile" label="C · Step wizard — mobile (390 × 844)" width={390} height={844}>
        <SongFormMobile />
      </DCArtboard>
    </DCSection>
  </DesignCanvas>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
