export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header>
          <h2>Hazzaq Style Framework</h2>
        </header>
        {children}
        <footer>
          <small>© 2026 Hazzaq Style</small>
        </footer>
      </body>
    </html>
  )
}