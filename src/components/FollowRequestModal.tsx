import type { FollowRequestInfo } from '../remote/types'

type FollowRequestModalProps = {
  request: FollowRequestInfo
  busy: boolean
  onAccept: () => void
  onReject: () => void
}

export function FollowRequestModal({
  request,
  busy,
  onAccept,
  onReject,
}: FollowRequestModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="follow-request-title"
        className="w-full max-w-sm rounded-3xl border border-[var(--glass-edge)] bg-white/95 p-6 shadow-lg backdrop-blur"
      >
        <h2
          id="follow-request-title"
          className="font-[Fraunces,serif] text-2xl text-[var(--ink)]"
        >
          Follow Request
        </h2>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          <span className="font-semibold text-[var(--ink)]">
            {request.from.username}
          </span>{' '}
          wants to Follow you and see your water level on their Vessel.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className="flex-1 rounded-2xl border border-[var(--glass-edge)] bg-white px-4 py-3 font-semibold text-[var(--pool-deep)]"
          >
            Reject
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onAccept}
            className="flex-1 rounded-2xl bg-[var(--pool)] px-4 py-3 font-semibold text-white"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
