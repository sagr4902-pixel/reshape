// Fallback for requests outside any locale (e.g. unknown top-level files).
export default function GlobalNotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem', background: '#17181A', color: '#F7F0E9' }}>
        <h1>الصفحة غير موجودة · Page not found</h1>
        <p>
          <a href="/ar" style={{ color: '#FF5420' }}>
            ريشيب الظهران
          </a>{' '}
          ·{' '}
          <a href="/en" style={{ color: '#FF5420' }}>
            RESHAPE Dhahran
          </a>
        </p>
      </body>
    </html>
  );
}
