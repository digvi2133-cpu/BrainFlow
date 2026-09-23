import { Navigate, Route, Routes } from "react-router-dom";
import AcceptInvitation from "./pages/AcceptInvitation.jsx";

function HomePage() {
  return (
    <main className="home-page">
      <div className="brand-mark">B</div>
      <p className="eyebrow">BRAINFLOW</p>
      <h1>Your workspace, connected.</h1>
      <p className="home-description">
        A focused digital workspace for your documents, collaboration, and
        ideas.
      </p>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="home-page">
      <p className="eyebrow">404 — PAGE NOT FOUND</p>
      <h1>We couldn't find that page.</h1>
      <p className="home-description">
        Check the address or return to the BrainFlow home page.
      </p>
      <a className="primary-link" href="/">
        Go to home
      </a>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;