export default function Loading() {
  return (
    <div
      style={{
        padding: '28px 32px 64px',
        color: 'var(--ink-4, #888)',
        fontSize: 13,
      }}
    >
      <div
        style={{
          height: 40,
          width: 160,
          borderRadius: 6,
          background: 'var(--rule, #e5e5e5)',
          opacity: 0.4,
          marginBottom: 20,
        }}
      />
      <div
        style={{
          border: '1px solid var(--rule, #e5e5e5)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 48,
              borderBottom: '1px solid var(--rule, #e5e5e5)',
              background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.015)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
