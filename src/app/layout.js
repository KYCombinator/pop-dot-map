import "./globals.css";

export const metadata = {
  title: "Population Dot Map",
  description: "An interactive population dot map of Louisville",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
