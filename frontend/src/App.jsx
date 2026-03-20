import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function extractErrorMessage(payload) {
  if (!payload) return "Request failed";
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload)) return extractErrorMessage(payload[0]);
  if (typeof payload === "object") {
    if (payload.detail) return extractErrorMessage(payload.detail);
    const firstValue = Object.values(payload)[0];
    return extractErrorMessage(firstValue);
  }
  return "Request failed";
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
  const [activeView, setActiveView] = useState("accounts");
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedAccountDetail, setSelectedAccountDetail] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const toastRef = useRef(null);

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
    () =>
      accounts.map((account) => ({
        value: String(account.id),
        label: `${account.name} (${formatMoney(account.balance)})`,
      })),
    [accounts]
  );

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + Number(account.balance), 0),
    [accounts]
  );

  function showToast(message) {
    if (toastRef.current) {
      window.clearTimeout(toastRef.current);
    }
    setToast(message);
    toastRef.current = window.setTimeout(() => {
      setToast("");
    }, 2200);
  }

  useEffect(() => {
    return () => {
      if (toastRef.current) {
        window.clearTimeout(toastRef.current);
      }
    };
  }, []);

  async function loadAccounts() {
    const data = await apiFetch("/accounts/");
    setAccounts(data);
    return data;
  }

  async function loadAccountDetail(accountId) {
    if (!accountId) {
      setSelectedAccountDetail(null);
      return;
    }

    const detail = await apiFetch(`/accounts/${accountId}/`);
    setSelectedAccountDetail(detail);
  }

  function ensureTransferDefaults(accountList, preferredSourceId = "") {
    const ids = accountList.map((account) => String(account.id));

    setTransferForm((prev) => {
      let source = preferredSourceId || prev.source_account_id;
      if (!ids.includes(source)) source = ids[0] || "";

      let destination = prev.destination_account_id;
      if (!ids.includes(destination) || destination === source) {
        destination = ids.find((id) => id !== source) || "";
      }

      return {
        ...prev,
        source_account_id: source,
        destination_account_id: destination,
      };
    });
  }

  async function refreshData(preferredAccountId = "") {
    setLoading(true);
    setError("");

    try {
      const accountList = await loadAccounts();
      ensureTransferDefaults(accountList, preferredAccountId);

      const ids = accountList.map((account) => String(account.id));
      const nextAccountId =
        preferredAccountId && ids.includes(preferredAccountId)
          ? preferredAccountId
          : ids.includes(selectedAccountId)
            ? selectedAccountId
            : ids[0] || "";

      setSelectedAccountId(nextAccountId);
      if (nextAccountId) {
        await loadAccountDetail(nextAccountId);
      } else {
        setSelectedAccountDetail(null);
      }
    } catch (err) {
      setError(err.message || "Unable to fetch data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateAccount(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const created = await apiFetch("/accounts/", {
        method: "POST",
        body: JSON.stringify({
          name: accountForm.name.trim(),
          balance: accountForm.balance,
        }),
      });

      setAccountForm({ name: "", balance: "" });
      showToast("Account created successfully");
      await refreshData(String(created.id));
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTransfer(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiFetch("/transfers/", {
        method: "POST",
        body: JSON.stringify({
          source_account_id: Number(transferForm.source_account_id),
          destination_account_id: Number(transferForm.destination_account_id),
          amount: transferForm.amount,
        }),
      });

      setTransferForm((prev) => ({ ...prev, amount: "" }));
      showToast("Transferred successfully");
      await refreshData(transferForm.source_account_id);
    } catch (err) {
      setError(err.message || "Unable to transfer funds.");
    } finally {
      setLoading(false);
    }
  }

  async function handleHistoryAccountChange(nextId) {
    setSelectedAccountId(nextId);

    if (!nextId) {
      setSelectedAccountDetail(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await loadAccountDetail(nextId);
    } catch (err) {
      setError(err.message || "Unable to fetch account details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <h1>Bank Transfer Console</h1>
        <p>Simple operations dashboard for account management and transfers.</p>
        <nav className="tabs">
          <button
            type="button"
            className={activeView === "accounts" ? "tab active" : "tab"}
            onClick={() => setActiveView("accounts")}
          >
            Accounts
          </button>
          <button
            type="button"
            className={activeView === "transfer" ? "tab active" : "tab"}
            onClick={() => setActiveView("transfer")}
          >
            Transfer
          </button>
          <button
            type="button"
            className={activeView === "history" ? "tab active" : "tab"}
            onClick={() => setActiveView("history")}
          >
            History
          </button>
        </nav>
      </header>

      {error ? <div className="alert error">{error}</div> : null}

      {activeView === "accounts" ? (
        <section className="accounts-layout">
          <div className="stats-two">
            <article className="card mini-stat">
              <p className="muted small">Total Accounts</p>
              <strong className="metric">{accounts.length}</strong>
            </article>

            <article className="card mini-stat">
              <p className="muted small">Total Managed Balance</p>
              <strong className="metric">{formatMoney(totalBalance)}</strong>
            </article>
          </div>

          <article className="card split-card">
            <div className="split-col">
              <h2>Create Account</h2>
              <p className="muted">Add a new account with opening balance.</p>
              <form onSubmit={handleCreateAccount} className="form">
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
            </div>

            <div className="split-col">
              <h2>Account Directory</h2>
              <p className="muted">Snapshot of all account balances.</p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Balance</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="empty">
                          No accounts created yet.
                        </td>
                      </tr>
                    ) : (
                      accounts.map((account) => (
                        <tr key={account.id}>
                          <td>{account.name}</td>
                          <td>{formatMoney(account.balance)}</td>
                          <td>{formatDate(account.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {activeView === "transfer" ? (
        <section>
          <article className="card">
            <h2>Transfer Money</h2>
            <p className="muted">Move funds between two different accounts.</p>
            <form onSubmit={handleTransfer} className="form">
              <label>
                From
                <select
                  required
                  value={transferForm.source_account_id}
                  onChange={(event) =>
                    setTransferForm((prev) => ({
                      ...prev,
                      source_account_id: event.target.value,
                      destination_account_id:
                        prev.destination_account_id === event.target.value
                          ? ""
                          : prev.destination_account_id,
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
                  {accountOptions
                    .filter((option) => option.value !== transferForm.source_account_id)
                    .map((option) => (
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
                {loading ? "Working..." : "Transfer"}
              </button>
            </form>
          </article>
        </section>
      ) : null}

      {activeView === "history" ? (
        <section className="card">
          <h2>Transaction History</h2>
          <label className="inline-field">
            Select Account
            <select
              value={selectedAccountId}
              onChange={(event) => handleHistoryAccountChange(event.target.value)}
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
              <p className="muted">
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
                        <td colSpan={4} className="empty">
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
                                txn.direction === "DEBIT" ? "pill debit" : "pill credit"
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
            <p className="muted">Select an account to view history.</p>
          )}
        </section>
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  );
}
