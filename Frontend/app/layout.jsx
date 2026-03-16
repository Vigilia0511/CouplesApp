// app/layout.tsx
// Root layout
import "./globals.css";
export const metadata = {
    title: "CouplesApp - Video Calls",
    description: "Connect with your partner through secure video calls",
};
export default function RootLayout({ children, }) {
    return (<html lang="en">
      <body>{children}</body>
    </html>);
}
