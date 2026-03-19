import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function extractErrorMessage(payload) {
  if (!payload) {
    return "Request failed";
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload[0] || "Request failed";
  }

  if (payload.detail) {
    return extractErrorMessage(payload.detail);
  }

  const firstValue = Object.values(payload)[0];
  return extractErrorMessage(firstValue);
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData));
  }

  return response.json();
}

function formatMoney(amount) {
  return Number(amount).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedAccountDetail, setSelectedAccountDetail] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [accountForm, setAccountForm] = useState({
    name: "",
    balance: "",
  });

  const [transferForm, setTransferForm] = useState({
    source_account_id: "",
    destination_account_id: "",
    amount: "",
  });

  const accountOptions = useMemo(
    () => accounts.map((account) => ({ value: String(account.id), label: `${account.name} (${formatMoney(account.balance)})` })),
    [accounts]
  );

  async function loadAccounts() {
    const data = await apiFetch("/accounts/");
    setAccounts(data);

    if (!selectedAccountId && data.length > 0) {
      setSelectedAccountId(String(data[0].id));
    }

    if (!transferForm.source_account_id && data.length > 0) {
      setTransferForm((prev) => ({
        ...prev,
        source_account_id: String(data[0].id),
        destination_account_id: data[1] ? String(data[1].id) : "",
      }));
    }
  }

  async function loadAccountDetail(accountId) {
    if (!accountId) {
      setSelectedAccountDetail(null);
      return;
    }
    const data = await apiFetch(`/accounts/${accountId}/`);
    setSelectedAccountDetail(data);
  }

  async function refreshData(preferredAccountId = null) {
    setLoading(true);
    setError("");

    try {
      await loadAccounts();
      const nextId = preferredAccountId || selectedAccountId;
      if (nextId) {
        await loadAccountDetail(nextId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedAccountId) {
      return;
    }

    loadAccountDetail(selectedAccountId).catch((err) => setError(err.message));
  }, [selectedAccountId]);

  async function handleCreateAccount(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await apiFetch("/accounts/", {
        method: "POST",
        body: JSON.stringify({
          name: accountForm.name.trim(),
          balance: accountForm.balance,
        }),
      });

      setAccountForm({ name: "", balance: "" });
      setMessage("Account created successfully.");
      await refreshData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTransfer(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        source_account_id: Number(transferForm.source_account_id),
        destination_account_id: Number(transferForm.destination_account_id),
        amount: transferForm.amount,
      };

      await apiFetch("/transfers/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setTransferForm((prev) => ({ ...prev, amount: "" }));
      setMessage("Transfer completed successfully.");
      const preferredId = selectedAccountId || transferForm.source_account_id;
      await refreshData(preferredId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <h1>Bank Transfer Console</h1>

      {error ? <p className="alert error">{error}</p> : null}
      {message ? <p className="alert success">{message}</p> : null}

      <section className="card">
        <h2>Create Account</h2>
        <form onSubmit={handleCreateAccount} className="grid-form">
          <label>
            Name
            <input
              required
              value={accountForm.name}
              onChange={(event) =>
                setAccountForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="e.g. Alice"
            />
          </label>

          <label>
            Opening Balance
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={accountForm.balance}
              onChange={(event) =>
                setAccountForm((prev) => ({ ...prev, balance: event.target.value }))
              }
              placeholder="1000.00"
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Working..." : "Create Account"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Transfer Money</h2>
        <form onSubmit={handleTransfer} className="grid-form">
          <label>
            From
            <select
              required
              value={transferForm.source_account_id}
              onChange={(event) =>
                setTransferForm((prev) => ({
                  ...prev,
                  source_account_id: event.target.value,
                }))
              }
            >
              <option value="">Select source</option>
              {accountOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            To
            <select
              required
              value={transferForm.destination_account_id}
              onChange={(event) =>
                setTransferForm((prev) => ({
                  ...prev,
                  destination_account_id: event.target.value,
                }))
              }
            >
              <option value="">Select destination</option>
              {accountOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Amount
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={transferForm.amount}
              onChange={(event) =>
                setTransferForm((prev) => ({ ...prev, amount: event.target.value }))
              }
              placeholder="50.00"
            />
          </label>

          <button type="submit" disabled={loading || accounts.length < 2}>
            {loading ? "Working..." : "Send Transfer"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Account Balance & History</h2>

        <label className="standalone-label">
          Select Account
          <select
            value={selectedAccountId}
            onChange={(event) => setSelectedAccountId(event.target.value)}
          >
            <option value="">Select account</option>
            {accountOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {selectedAccountDetail ? (
          <>
            <p className="balance">
              Current Balance: <strong>{formatMoney(selectedAccountDetail.balance)}</strong>
            </p>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Counterparty</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAccountDetail.transactions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-state">
                        No transactions yet.
                      </td>
                    </tr>
                  ) : (
                    selectedAccountDetail.transactions.map((txn) => (
                      <tr key={txn.id}>
                        <td>{formatDate(txn.created_at)}</td>
                        <td>
                          <span
                            className={
                              txn.direction === "DEBIT"
                                ? "pill debit"
                                : "pill credit"
                            }
                          >
                            {txn.direction}
                          </span>
                        </td>
                        <td>{txn.counterparty.name}</td>
                        <td>{formatMoney(txn.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p>Select an account to view details.</p>
        )}
      </section>
    </main>
  );
}
