import './globals.css'

export const metadata = {
  title: 'Doctor Video Generator | Cipla Patient Awareness',
  description: 'Generate personalized doctor videos for patient awareness initiatives',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
