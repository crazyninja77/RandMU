import { useState } from "react";
import { api } from "../api";
import type { Payment, Song } from "../types";

const BANKS = [
  "ABN AMRO",
  "ING",
  "Rabobank",
  "SNS",
  "ASN Bank",
  "Bunq",
  "Knab",
  "Revolut",
  "Triodos Bank",
  "Van Lanschot",
];

type Phase = "select" | "processing";

export function IdealModal({
  payment,
  onPaid,
  onCancel,
}: {
  payment: Payment;
  onPaid: (song: Song | null) => void;
  onCancel: () => void;
}) {
  const [bank, setBank] = useState(BANKS[0]);
  const [phase, setPhase] = useState<Phase>("select");
  const [error, setError] = useState<string | null>(null);

  const amount = `€${(payment.amountCents / 100).toFixed(2).replace(".", ",")}`;

  async function pay() {
    setPhase("processing");
    setError(null);
    try {
      // Simulate the redirect + bank approval round-trip.
      await new Promise((r) => setTimeout(r, 1200));
      const { song } = await api.confirmPayment(payment.id);
      onPaid(song);
    } catch (e) {
      setError((e as Error).message);
      setPhase("select");
    }
  }

  async function cancel() {
    try {
      await api.failPayment(payment.id);
    } catch {
      /* ignore */
    }
    onCancel();
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal ideal-modal">
        <div className="ideal-header">
          <span className="ideal-logo">iDEAL</span>
          <span className="ideal-merchant">RandMU</span>
        </div>

        <div className="ideal-body">
          <div className="ideal-amount-row">
            <span>Amount</span>
            <strong>{amount}</strong>
          </div>
          <p className="ideal-note">Mock payment — no real money is charged.</p>

          <label className="ideal-label" htmlFor="bank">
            Choose your bank
          </label>
          <select
            id="bank"
            className="ideal-select"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            disabled={phase === "processing"}
          >
            {BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {error && <p className="ideal-error">Payment failed: {error}</p>}

          <button className="btn btn-primary ideal-pay" onClick={pay} disabled={phase === "processing"}>
            {phase === "processing" ? `Confirming at ${bank}…` : `Pay ${amount} with ${bank}`}
          </button>
          <button className="btn btn-ghost" onClick={cancel} disabled={phase === "processing"}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
