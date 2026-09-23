import { useSearchParams } from "react-router-dom";

function AcceptInvitation() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");
  const workspaceId = searchParams.get("workspaceId");

  const hasInvitation = Boolean(token && workspaceId);

  return (
    <main className="invitation-page">
      <section className="invitation-card">
        <div className="brand-mark">B</div>

        <p className="eyebrow">BRAINFLOW WORKSPACE</p>

        <h1>You're invited</h1>

        {hasInvitation ? (
          <>
            <p className="invitation-description">
              You've received a workspace invitation. Sign in with the email
              address that received the invitation to continue.
            </p>

            <div className="invitation-status">
              <span className="status-dot" />
              Invitation link detected
            </div>

            <p className="invitation-note">
              Your invitation will be validated by BrainFlow before you can
              join the workspace.
            </p>
          </>
        ) : (
          <>
            <p className="invitation-description">
              This invitation link is incomplete or invalid.
            </p>

            <p className="invitation-note">
              Please open the complete invitation link from your email, or ask
              the workspace administrator to send you a new invitation.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

export default AcceptInvitation;