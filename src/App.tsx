import React, { useCallback, useEffect, useState } from "react";
import {
  Home,
  CreditCard,
  Plus,
  ArrowRightLeft,
  X,
  History,
  Landmark,
  Wallet,
  Banknote,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Trash2,
  RefreshCw,
  PiggyBank,
  Pencil,
<<<<<<< HEAD
  Sun,
  Moon,
  Smartphone,
=======
  Archive,
>>>>>>> 6d68a50c81a15933e96267b7c8a9678d4957e3a5
} from "lucide-react";
import "./App.css";

import {
  ApiError,
  api,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "./services/api";

interface AccountData {
  id: number;
  name: string;
  balance: number;
  type: string;
  color: string;
  bg: string;
}

interface TransactionData {
  id: number;
  account_id?: number;
  category_id?: number | null;
  amount: number;
  type: string;
  category: string;
  account: string;
  date: string;
  desc: string;
  period_id?: number | null;
  period_name?: string | null;
  period_status?: string | null;
}

interface FinancialPeriod {
  id: number;
  name: string | null;
  start_date: string;
  end_date: string | null;
  status: "active" | "archived";
  closed_at?: string | null;
  transaction_count?: number;
  total_income?: number;
  total_expenses?: number;
  net_income?: number;
}

interface MonthlySummary {
  id: number;
  year: number;
  month: number;
  total_income: number;
  total_expense: number;
  net_savings: number;
  account_snapshot: Array<Record<string, unknown>>;
  category_breakdown: Array<Record<string, unknown>>;
  notes: string | null;
  closed_at: string;
}

interface LoanData {
  id: number;
  name: string;
  total: number;
  remaining: number;
  type: string;
}

interface SavingsData {
  id: number;
  name: string;
  target: number;
  saved: number;
  target_date?: string | null;
}

interface CategoryData {
  id: number;
  name: string;
  type: string;
}

interface MonthlySummaryData {
  id: number;
  year: number;
  month: number;
  total_income: string | number;
  total_expense: string | number;
  net_savings: string | number;
  notes?: string | null;
}

interface PinResponse {
  token: string;
  expires_at: number;
  remember_hours: 24 | 48;
}

const formatMMK = (num: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num);

const formatInputValue = (value: string) => {
  const numeric = value.replace(/[^0-9]/g, "");
  return numeric
    ? new Intl.NumberFormat("en-US").format(parseInt(numeric, 10))
    : "";
};

const parseInputValue = (value: string) =>
  value ? parseFloat(value.replace(/,/g, "")) : 0;

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const today = new Date();
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    return "Today";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const errorMessage = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
};

/* UPGRADED: Sleek Swipeable Item to prevent glass color bleed */
const SwipeableItem = ({
  children,
  onDelete,
  className = "",
}: {
  children: React.ReactNode;
  onDelete: () => void;
  className?: string;
}) => {
  const [startX, setStartX] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const start = (x: number) => {
    setStartX(x);
    setDragging(true);
  };

  const move = (x: number) => {
    if (!dragging || startX === null) return;
    setOffset(Math.max(-80, Math.min(0, x - startX)));
  };

  const end = () => {
    setDragging(false);
    setOffset(offset < -40 ? -80 : 0);
    setStartX(null);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background action layer is only visible during swipe */}
      <div
        className="absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-5 transition-opacity duration-200"
        style={{ opacity: offset < -10 ? 1 : 0 }}
      >
        <button
          onClick={onDelete}
          className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md active:scale-[0.96] transition-transform"
          aria-label="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div
        className="relative z-10 w-full h-full"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 250ms cubic-bezier(0.2, 0, 0, 1)",
          touchAction: "pan-y",
        }}
        onTouchStart={(e) => start(e.touches[0].clientX)}
        onTouchMove={(e) => move(e.touches[0].clientX)}
        onTouchEnd={end}
        onMouseDown={(e) => start(e.clientX)}
        onMouseMove={(e) => move(e.clientX)}
        onMouseUp={end}
        onMouseLeave={() => dragging && end()}
      >
        {children}
      </div>
    </div>
  );
};

const TopBar = ({
  title,
  syncStatus,
  isError,
  onSync,
  darkMode,
  onToggleTheme,
  onInstallHelp,
}: {
  title: string;
  syncStatus: string;
  isError: boolean;
  onSync: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  onInstallHelp: () => void;
}) => (
  <header className="app-topbar">
    <h1>{title}</h1>

    <div className="sync-area">
      <button className="theme-toggle ios-glass-clear install-icon-button" onClick={onInstallHelp} aria-label="Installation help" title="Install app">
        <Smartphone size={16} />
      </button>
      <button
        className="theme-toggle ios-glass"
        onClick={onToggleTheme}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        title={darkMode ? "Light mode" : "Dark mode"}
      >
        {darkMode ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      <button
        onClick={onSync}
        disabled={syncStatus === "Syncing..."}
        className="sync-button"
        aria-label="Sync"
        title="Sync data"
      >
        <RefreshCw
          size={14}
          className={syncStatus === "Syncing..." ? "animate-spin" : ""}
        />
      </button>
<<<<<<< HEAD
      <span className={`sync-status ${isError ? "error" : ""}`}>
=======

      {/* NEW: Dynamic classes for the new glowing pill design */}
      <span 
        className={`sync-status ${isError ? "error" : syncStatus === "Syncing..." ? "syncing" : ""}`}
      >
>>>>>>> 6d68a50c81a15933e96267b7c8a9678d4957e3a5
        <span className="sync-dot" />
        {syncStatus}
      </span>
    </div>
  </header>
);

const BottomNav = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => (
  <nav
    className="glass-bottom-nav ios-glass-clear"
    aria-label="Main navigation"
  >
    <button
      className={`glass-nav-item ${activeTab === "home" ? "active" : ""}`}
      onClick={() => setActiveTab("home")}
    >
      <Home size={20} />
      <span>Home</span>
    </button>

    <button
      className={`glass-nav-item ${activeTab === "accounts" ? "active" : ""}`}
      onClick={() => setActiveTab("accounts")}
    >
      <CreditCard size={20} />
      <span>Accounts</span>
    </button>

    <div className="glass-nav-spacer" />

    <button
      className={`glass-nav-item ${activeTab === "records" ? "active" : ""}`}
      onClick={() => setActiveTab("records")}
    >
      <History size={20} />
      <span>History</span>
    </button>

    <button
      className={`glass-nav-item ${activeTab === "budgets" ? "active" : ""}`}
      onClick={() => setActiveTab("budgets")}
    >
      <PiggyBank size={20} />
      <span>Plans</span>
    </button>
  </nav>
);

const Sheet = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div
    className="fixed inset-0 z-[80] bg-zinc-950/40 backdrop-blur-sm flex items-end justify-center"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div className="finance-sheet" onMouseDown={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const AddTransactionModal = ({
  open,
  accounts,
  onClose,
  onAdd,
}: {
  open: boolean;
  accounts: AccountData[];
  onClose: () => void;
  onAdd: (data: {
    amount: number;
    type: string;
    desc: string;
    account: string;
    date: string;
    category: string;
  }) => Promise<void>;
}) => {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [account, setAccount] = useState("");

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseInputValue(amount);
    if (!value || value <= 0) return;

    await onAdd({
      amount: value,
      type,
      desc,
      account: account || accounts[0]?.name || "",
      date: new Date().toISOString().slice(0, 10),
      category: type === "expense" ? "General" : "Income",
    });

    setAmount("");
    setDesc("");
    onClose();
  };

  return (
    <Sheet onClose={onClose}>
      <div className="sheet-header">
        <div>
          <span className="sheet-eyebrow">TRANSACTION</span>
          <h2>New Transaction</h2>
        </div>
        <button className="sheet-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="form-segment">
          <button
            type="button"
            className={type === "expense" ? "active expense" : ""}
            onClick={() => setType("expense")}
          >
            Expense
          </button>
          <button
            type="button"
            className={type === "income" ? "active income" : ""}
            onClick={() => setType("income")}
          >
            Income
          </button>
        </div>

        <div>
          <label className="finance-label">Amount (MMK)</label>
          <input
            className="finance-input amount-input"
            value={amount}
            inputMode="numeric"
            onChange={(e) => setAmount(formatInputValue(e.target.value))}
            placeholder="0"
            required
          />
        </div>

        <div>
          <label className="finance-label">Description</label>
          <input
            className="finance-input"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g. Lunch"
            required
          />
        </div>

        <div>
          <label className="finance-label">Account</label>
          <select
            className="finance-input"
            value={account || accounts[0]?.name || ""}
            onChange={(e) => setAccount(e.target.value)}
          >
            {accounts.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name} ({formatMMK(item.balance)} MMK)
              </option>
            ))}
          </select>
        </div>

        <button className={`primary-action ${type}`} type="submit">
          Add {type === "expense" ? "Expense" : "Income"}
        </button>
      </form>
    </Sheet>
  );
};

const TransferModal = ({
  open,
  accounts,
  onClose,
  onTransfer,
}: {
  open: boolean;
  accounts: AccountData[];
  onClose: () => void;
  onTransfer: (data: {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    desc: string;
  }) => Promise<void>;
}) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const fromId = from || accounts[0]?.id.toString() || "";
<<<<<<< HEAD
  const toId = to || (accounts[1]?.id ?? accounts[0]?.id)?.toString() || "";
=======
  const toId =
    to || (accounts[1]?.id ?? accounts[0]?.id)?.toString() || "";
>>>>>>> 6d68a50c81a15933e96267b7c8a9678d4957e3a5

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseInputValue(amount);

    if (fromId === toId) {
      setError("Choose two different accounts.");
      return;
    }
    if (!value || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    try {
      await onTransfer({
        fromAccountId: Number(fromId),
        toAccountId: Number(toId),
        amount: value,
        desc,
      });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Sheet onClose={onClose}>
      <div className="sheet-header">
        <div>
          <span className="sheet-eyebrow">MONEY MOVEMENT</span>
          <h2>Transfer Funds</h2>
        </div>
        <button className="sheet-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="finance-label">From</label>
          <select
            className="finance-input"
            value={fromId}
            onChange={(e) => setFrom(e.target.value)}
          >
            {accounts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({formatMMK(item.balance)} MMK)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="finance-label">To</label>
          <select
            className="finance-input"
            value={toId}
            onChange={(e) => setTo(e.target.value)}
          >
            {accounts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="finance-label">Amount (MMK)</label>
          <input
            className="finance-input amount-input"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(formatInputValue(e.target.value))}
            placeholder="0"
            required
          />
        </div>

        <div>
          <label className="finance-label">Note</label>
          <input
            className="finance-input"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <button className="primary-action transfer" type="submit">
          Confirm Transfer
        </button>
      </form>
    </Sheet>
  );
};

<<<<<<< HEAD
const PinScreen = ({ onUnlocked, darkMode }: { onUnlocked: () => Promise<void>; darkMode: boolean }) => {
=======
const CloseMonthModal = ({
  open,
  onClose,
  onCloseMonth,
}: {
  open: boolean;
  onClose: () => void;
  onCloseMonth: (data: { year: number; month: number; notes: string }) => Promise<void>;
}) => {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    if (!y || !m || m < 1 || m > 12) {
      setError("Please enter a valid year and month (1-12).");
      return;
    }

    try {
      await onCloseMonth({ year: y, month: m, notes });
      setNotes("");
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Sheet onClose={onClose}>
      <div className="sheet-header">
        <div>
          <span className="sheet-eyebrow">ARCHIVE</span>
          <h2>Close Month</h2>
        </div>
        <button className="sheet-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="finance-label">Year</label>
            <input
              className="finance-input"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="finance-label">Month (1-12)</label>
            <input
              className="finance-input"
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="finance-label">Notes (Optional)</label>
          <input
            className="finance-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., End of Month Snapshot"
          />
        </div>

        <button className="primary-action transfer" type="submit">
          Save Snapshot
        </button>
      </form>
    </Sheet>
  );
};

const PinScreen = ({ onUnlocked }: { onUnlocked: () => Promise<void> }) => {
>>>>>>> 6d68a50c81a15933e96267b7c8a9678d4957e3a5
  const [pin, setPin] = useState("");
  const [remember, setRemember] = useState<24 | 48>(48);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post<PinResponse>("auth/pin.php", {
        pin,
        remember_hours: remember,
      });

      setAuthToken(response.data.token, response.data.expires_at);
      await onUnlocked();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className={`app-outer${darkMode ? " dark" : ""}`}>
      <div className={`app-shell pin-shell${darkMode ? " dark" : ""}`}>
=======
    <div className="app-outer">
      <div className="liquid-background">
        <div className="blob blob-purple"></div>
        <div className="blob blob-cyan"></div>
        <div className="blob blob-red"></div>
      </div>
      <div className="app-shell pin-shell glass-surface">
>>>>>>> 6d68a50c81a15933e96267b7c8a9678d4957e3a5
        <div className="pin-content">
          <span className="pin-eyebrow">PERSONAL FINANCE</span>
          <h1>Enter PIN</h1>
          <p>Unlock your finance dashboard on this device.</p>

          <form onSubmit={submit} className="space-y-5 mt-8">
            <div>
              <label className="finance-label">4-digit PIN</label>
              <input
                className="pin-input"
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="\d{4}"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                required
              />
            </div>

            <div>
              <label className="finance-label">Remember on this device</label>
              <div className="form-segment">
                {[24, 48].map((hours) => (
                  <button
                    type="button"
                    key={hours}
                    className={remember === hours ? "active" : ""}
                    onClick={() => setRemember(hours as 24 | 48)}
                  >
                    {hours} hours
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button className="primary-action" disabled={loading} type="submit">
              {loading ? "Unlocking..." : "Unlock"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [recordsTab, setRecordsTab] = useState<"history" | "archive">(
    "history",
  );
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("finance_theme") === "dark",
  );
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [savings, setSavings] = useState<SavingsData[]>([]);
<<<<<<< HEAD
  const [activePeriod, setActivePeriod] = useState<FinancialPeriod | null>(
    null,
  );
  const [archivedPeriods, setArchivedPeriods] = useState<FinancialPeriod[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [periodModal, setPeriodModal] = useState(false);
  const [periodBusy, setPeriodBusy] = useState(false);
  const [periodError, setPeriodError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<FinancialPeriod | null>(
    null,
  );
  const [selectedMonthlySummary, setSelectedMonthlySummary] = useState<MonthlySummary | null>(null);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [online, setOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
=======
  const [archives, setArchives] = useState<MonthlySummaryData[]>([]);
  const [archiveDebug, setArchiveDebug] = useState<string>("");

  const [historyTab, setHistoryTab] = useState<"transactions" | "archives">("transactions");
  const [closeMonthModalOpen, setCloseMonthModalOpen] = useState(false);
>>>>>>> 6d68a50c81a15933e96267b7c8a9678d4957e3a5

  const [unlocked, setUnlocked] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [syncStatus, setSyncStatus] = useState("Connecting...");
  const [isError, setIsError] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [accountModal, setAccountModal] = useState(false);
  const [loanModal, setLoanModal] = useState(false);
  const [savingsModal, setSavingsModal] = useState(false);

  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("bank");
  const [accountBalance, setAccountBalance] = useState("");

  const [loanEditingId, setLoanEditingId] = useState<number | null>(null);
  const [loanName, setLoanName] = useState("");
  const [loanType, setLoanType] = useState("borrowed");
  const [loanTotal, setLoanTotal] = useState("");
  const [loanRemaining, setLoanRemaining] = useState("");

  const [planTab, setPlanTab] = useState<"loans" | "savings">("loans");

  const [savingEditingId, setSavingEditingId] = useState<number | null>(null);
  const [savingName, setSavingName] = useState("");
  const [savingTarget, setSavingTarget] = useState("");
  const [savingSaved, setSavingSaved] = useState("");
  const [savingDate, setSavingDate] = useState("");

  const loadFinanceData = useCallback(async () => {
    setSyncStatus("Syncing...");
    const t = Date.now();
    
    const token = getAuthToken();
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/finance-app/api';

    const archivesPromise = fetch(`${apiBase}/monthly/index.php?_t=${t}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      return res.json();
    });

    const [
<<<<<<< HEAD
      accountsResponse,
      transactionsResponse,
      loansResponse,
      categoriesResponse,
      savingsResponse,
      periodsResponse,
    ] = await Promise.all([
=======
      accountsRes,
      transactionsRes,
      loansRes,
      categoriesRes,
      savingsRes,
      archivesRes,
    ] = await Promise.allSettled([
>>>>>>> 6d68a50c81a15933e96267b7c8a9678d4957e3a5
      api.get<{ accounts: AccountData[] }>(`accounts/index.php?_t=${t}`),
      api.get<{ transactions: TransactionData[] }>(
        `transactions/index.php?_t=${t}`,
      ),
      api.get<{ loans: LoanData[] }>(`loans/index.php?_t=${t}`),
      api.get<{ categories: CategoryData[] }>(`categories/index.php?_t=${t}`),
      api.get<{ savings: SavingsData[] }>(`savings/index.php?_t=${t}`),
<<<<<<< HEAD
      api.get<{ active: FinancialPeriod | null; archived: FinancialPeriod[]; monthly_summaries?: MonthlySummary[] }>(
        `periods/index.php?_t=${t}`,
      ),
    ]);

    setAccounts(accountsResponse.data.accounts);
    setTransactions(transactionsResponse.data.transactions);
    setLoans(loansResponse.data.loans);
    setCategories(categoriesResponse.data.categories);
    setSavings(savingsResponse.data.savings);
    setActivePeriod(periodsResponse.data.active);
    setArchivedPeriods(periodsResponse.data.archived);
    setMonthlySummaries(periodsResponse.data.monthly_summaries ?? []);
=======
      archivesPromise,
    ]);

    if (accountsRes.status === "fulfilled") setAccounts(accountsRes.value.data.accounts || []);
    if (transactionsRes.status === "fulfilled") setTransactions(transactionsRes.value.data.transactions || []);
    if (loansRes.status === "fulfilled") setLoans(loansRes.value.data.loans || []);
    if (categoriesRes.status === "fulfilled") setCategories(categoriesRes.value.data.categories || []);
    if (savingsRes.status === "fulfilled") setSavings(savingsRes.value.data.savings || []);
    
    if (archivesRes.status === "fulfilled") {
      try {
        const payload = archivesRes.value; 
        
        let list: any = [];
        if (Array.isArray(payload)) list = payload;
        else if (Array.isArray(payload?.data)) list = payload.data;
        else if (Array.isArray(payload?.archives)) list = payload.archives;
        else if (Array.isArray(payload?.summaries)) list = payload.summaries;
        
        setArchives(list);
        setArchiveDebug("OK");
      } catch (e) {
        setArchives([]);
        setArchiveDebug("Extraction error: " + (e as Error).message);
      }
    } else {
      setArchives([]);
      setArchiveDebug("Native Fetch Rejected: " + String(archivesRes.reason));
    }

>>>>>>> 6d68a50c81a15933e96267b7c8a9678d4957e3a5
    setSyncStatus("API Synced");
    setIsError(false);
  }, []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("finance_theme", darkMode ? "dark" : "light");
    document.querySelector(".ios-surface")?.classList.toggle("dark", darkMode);
    document.querySelector(".app-outer")?.classList.toggle("dark", darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    const install = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", install);
    return () => window.removeEventListener("beforeinstallprompt", install);
  }, []);

  const closeMonth = async () => {
    if (!activePeriod || periodBusy) return;
    if (
      !window.confirm(
        "Close and archive this month? The app will save its totals and transaction history, remove those entries from the dashboard summary, and leave account balances unchanged.",
      )
    )
      return;
    setPeriodBusy(true);
    setPeriodError("");
    try {
      await api.post("periods/close.php", {});
      setPeriodModal(false);
      await loadFinanceData();
      setRecordsTab("archive");
      setActiveTab("records");
    } catch (error) {
      setPeriodError(errorMessage(error));
    } finally {
      setPeriodBusy(false);
    }
  };

  const startPeriod = async () => {
    if (periodBusy) return;
    setPeriodBusy(true);
    setPeriodError("");
    try {
      await api.post("periods/create.php", {});
      setPeriodModal(false);
      await loadFinanceData();
    } catch (error) {
      setPeriodError(errorMessage(error));
    } finally {
      setPeriodBusy(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      if (!getAuthToken()) {
        setSyncStatus("PIN required");
        setInitializing(false);
        return;
      }

      try {
        await loadFinanceData();
        setUnlocked(true);
      } catch {
        clearAuthToken();
        setSyncStatus("PIN required");
      } finally {
        setInitializing(false);
      }
    };

    boot();
  }, [loadFinanceData]);

  useEffect(() => {
    const onExpired = () => {
      setUnlocked(false);
      setAccounts([]);
      setTransactions([]);
      setLoans([]);
      setCategories([]);
      setSavings([]);
      setArchives([]);
      setSyncStatus("Session expired");
      setIsError(true);
    };

    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && unlocked) {
        loadFinanceData().catch(() => {
          setSyncStatus("API Error");
          setIsError(true);
        });
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [unlocked, loadFinanceData]);

  const deleteTransaction = async (id: number) => {
    const old = transactions;
    setTransactions((items) => items.filter((item) => item.id !== id));
    try {
      const response = await api.delete<{ accounts: AccountData[] }>(
        `transactions/delete.php?id=${id}`,
      );
      setAccounts(response.data.accounts);
    } catch {
      setTransactions(old);
      setIsError(true);
      setSyncStatus("API Error");
    }
  };

  const deleteAccount = async (id: number) => {
    const old = accounts;
    setAccounts((items) => items.filter((item) => item.id !== id));
    try {
      await api.delete(`accounts/delete.php?id=${id}`);
      await loadFinanceData();
    } catch {
      setAccounts(old);
      setIsError(true);
      setSyncStatus("API Error");
    }
  };

  const deleteLoan = async (id: number) => {
    const old = loans;
    setLoans((items) => items.filter((item) => item.id !== id));
    try {
      await api.delete(`loans/delete.php?id=${id}`);
    } catch {
      setLoans(old);
      setIsError(true);
      setSyncStatus("API Error");
    }
  };

  const deleteSaving = async (id: number) => {
    const old = savings;
    setSavings((items) => items.filter((item) => item.id !== id));
    try {
      await api.delete(`savings/delete.php?id=${id}`);
    } catch {
      setSavings(old);
      setIsError(true);
      setSyncStatus("API Error");
    }
  };

  const unarchiveMonth = async (id: number) => {
    const oldArchives = archives;
    setArchives((items) => items.filter((item) => item.id !== id));
    try {
      await api.delete(`monthly/delete.php?id=${id}`);
    } catch (error) {
      const msg = errorMessage(error);
      if (!msg.toLowerCase().includes("success")) {
        setArchives(oldArchives);
        setIsError(true);
        setSyncStatus("API Error");
        return;
      }
    }
    await loadFinanceData();
  };

  const addTransaction = async (data: {
    amount: number;
    type: string;
    desc: string;
    account: string;
    date: string;
    category: string;
  }) => {
    const account = accounts.find((item) => item.name === data.account);
    if (!account) throw new Error("Account not found.");

    const category = categories.find(
      (item) =>
        item.type === data.type &&
        item.name.toLowerCase() === data.category.toLowerCase(),
    );

    const response = await api.post<{
      transaction: TransactionData;
      accounts: AccountData[];
    }>("transactions/create.php", {
      account_id: account.id,
      category_id: category?.id ?? null,
      amount: data.amount,
      type: data.type,
      desc: data.desc,
      date: data.date,
    });

    setTransactions((items) => [response.data.transaction, ...items]);
    setAccounts(response.data.accounts);
  };

  const transfer = async (data: {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    desc: string;
  }) => {
    await api.post("transactions/transfer.php", {
      from_account_id: data.fromAccountId,
      to_account_id: data.toAccountId,
      amount: data.amount,
    });
    await loadFinanceData();
  };

  const closeMonth = async (data: { year: number; month: number; notes: string }) => {
    try {
      await api.post("monthly/close.php", data);
    } catch (error) {
      const msg = errorMessage(error);
      if (!msg.toLowerCase().includes("success")) {
        throw error; 
      }
    }
    await loadFinanceData();
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseInputValue(accountBalance);
    if (!accountName.trim() || balance < 0) return;

    const response = await api.post<{ account: AccountData }>(
      "accounts/create.php",
      {
        name: accountName.trim(),
        balance,
        type: accountType,
      },
    );

    setAccounts((items) => [...items, response.data.account]);
    setAccountModal(false);
    setAccountName("");
    setAccountBalance("");
  };

  const resetLoan = () => {
    setLoanEditingId(null);
    setLoanName("");
    setLoanType("borrowed");
    setLoanTotal("");
    setLoanRemaining("");
  };

  const editLoan = (loan: LoanData) => {
    setLoanEditingId(loan.id);
    setLoanName(loan.name);
    setLoanType(loan.type);
    setLoanTotal(formatInputValue(String(loan.total)));
    setLoanRemaining(formatInputValue(String(loan.remaining)));
    setLoanModal(true);
  };

  const saveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseInputValue(loanTotal);
    const remaining =
      loanRemaining.trim() === "" ? total : parseInputValue(loanRemaining);

    if (!loanName.trim() || total <= 0 || remaining < 0 || remaining > total) {
      return;
    }

    const payload = {
      name: loanName.trim(),
      total,
      remaining,
      type: loanType,
    };

    const response =
      loanEditingId === null
        ? await api.post<{ loan: LoanData }>("loans/create.php", payload)
        : await api.put<{ loan: LoanData }>(
            `loans/update.php?id=${loanEditingId}`,
            payload,
          );

    if (loanEditingId === null) {
      setLoans((items) => [...items, response.data.loan]);
    } else {
      setLoans((items) =>
        items.map((item) =>
          item.id === loanEditingId ? response.data.loan : item,
        ),
      );
    }

    setLoanModal(false);
    resetLoan();
  };

  const resetSaving = () => {
    setSavingEditingId(null);
    setSavingName("");
    setSavingTarget("");
    setSavingSaved("");
    setSavingDate("");
  };

  const editSaving = (saving: SavingsData) => {
    setSavingEditingId(saving.id);
    setSavingName(saving.name);
    setSavingTarget(formatInputValue(String(saving.target)));
    setSavingSaved(formatInputValue(String(saving.saved)));
    setSavingDate(saving.target_date ?? "");
    setSavingsModal(true);
  };

  const saveSaving = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInputValue(savingTarget);
    const saved = parseInputValue(savingSaved);

    if (!savingName.trim() || target <= 0 || saved < 0 || saved > target) {
      return;
    }

    const payload = {
      name: savingName.trim(),
      target,
      saved,
      target_date: savingDate || null,
    };

    const response =
      savingEditingId === null
        ? await api.post<{ saving: SavingsData }>("savings/create.php", payload)
        : await api.put<{ saving: SavingsData }>(
            `savings/update.php?id=${savingEditingId}`,
            payload,
          );

    if (savingEditingId === null) {
      setSavings((items) => [...items, response.data.saving]);
    } else {
      setSavings((items) =>
        items.map((item) =>
          item.id === savingEditingId ? response.data.saving : item,
        ),
      );
    }

    setSavingsModal(false);
    resetSaving();
  };

  const totalBalance = accounts.reduce((sum, item) => sum + item.balance, 0);
  const periodTransactions = activePeriod
    ? transactions.filter((item) => item.period_id === activePeriod.id)
    : [];
  const income = periodTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const expense = periodTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const title =
    activeTab === "home"
      ? "Overview"
      : activeTab === "accounts"
        ? "Accounts"
        : activeTab === "records"
          ? "History & Archive"
          : "Plans";

  const renderHome = () => (
    <div className="space-y-7">
      <section className="balance-card">
        <div className="balance-glow" />
        <span className="balance-label">LIFETIME ACCOUNT BALANCE</span>
        <div className="balance-value">
          {formatMMK(totalBalance)}
          <span>MMK</span>
        </div>

        <div className="balance-stats">
          <div>
            <span>
              <TrendingUp size={13} /> Income
            </span>
            <strong>+ {formatMMK(income)}</strong>
          </div>
          <div>
            <span>
              <TrendingDown size={13} /> Expenses
            </span>
            <strong>- {formatMMK(expense)}</strong>
          </div>
        </div>
      </section>

      <section>
        <div className="section-heading">
          <h2>My Accounts</h2>
          <button onClick={() => setActiveTab("accounts")}>See All</button>
        </div>

        <div className="accounts-scroller">
          {accounts.map((account) => {
            const Icon =
              account.type === "cash"
                ? Banknote
                : account.type === "ewallet"
                  ? Wallet
                  : Landmark;

            return (
              <div className="account-card glass-surface" key={account.id}>
                <div className={`account-icon ${account.type}`}>
                  <Icon size={20} />
                </div>
                <span>{account.name}</span>
                <strong>{formatMMK(account.balance)}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-4">
        <div className="section-heading compact">
          <h2>Recent Transactions</h2>
          <button
            onClick={() => {
              setRecordsTab("history");
              setActiveTab("records");
            }}
          >
            See All
          </button>
        </div>

<<<<<<< HEAD
        <div className="transaction-card">
          {periodTransactions.slice(0, 5).map((tx, index) => (
=======
        <div className="transaction-card glass-surface">
          {transactions.slice(0, 5).map((tx, index) => (
>>>>>>> 6d68a50c81a15933e96267b7c8a9678d4957e3a5
            <SwipeableItem
              key={tx.id}
              onDelete={() => deleteTransaction(tx.id)}
              className={index ? "transaction-divider" : ""}
            >
              <div className="transaction-row">
                <div
                  className={`transaction-icon ${
                    tx.type === "expense" ? "expense" : "income"
                  }`}
                >
                  {tx.type === "expense" ? (
                    <TrendingDown size={18} />
                  ) : (
                    <TrendingUp size={18} />
                  )}
                </div>

                <div className="transaction-info">
                  <strong>{tx.desc || "Transaction"}</strong>
                  <span>
                    {tx.account} · {formatDate(tx.date)}
                  </span>
                </div>

                <strong
                  className={`transaction-amount ${
                    tx.type === "expense" ? "expense" : "income"
                  }`}
                >
                  {tx.type === "expense" ? "-" : "+"}
                  {formatMMK(tx.amount)}
                </strong>
              </div>
            </SwipeableItem>
          ))}

          {!periodTransactions.length && (
            <div className="empty-state">
              {activePeriod
                ? "No transactions this month yet."
                : "No open month. Start one from Archive when ready."}
            </div>
          )}
        </div>
      </section>
    </div>
  );

  const renderAccounts = () => (
    <div className="page-content">
      <div className="subheader-row">
        <p>Manage bank balances & wallets</p>
        <div className="button-group">
          <button
            className="secondary-action"
            onClick={() => setTransferOpen(true)}
          >
            <ArrowRightLeft size={15} />
            Transfer
          </button>
          <button
            className="plans-add-button"
            onClick={() => setAccountModal(true)}
          >
            <PlusCircle size={15} />
            Add
          </button>
        </div>
      </div>

      <div className="stack-list">
        {accounts.map((account) => {
          const Icon =
            account.type === "cash"
              ? Banknote
              : account.type === "ewallet"
                ? Wallet
                : Landmark;

          return (
            <SwipeableItem
              key={account.id}
              onDelete={() => deleteAccount(account.id)}
              className="rounded-3xl shadow-sm"
            >
              <div className="account-list-card glass-surface rounded-2xl">
                <div className={`account-icon ${account.type}`}>
                  <Icon size={21} />
                </div>
                <div className="account-list-info">
                  <strong>{account.name}</strong>
                  <span>{account.type}</span>
                </div>
                <strong>{formatMMK(account.balance)} MMK</strong>
              </div>
            </SwipeableItem>
          );
        })}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="page-content">
<<<<<<< HEAD
      <div className="subheader-block">
        <h2>History</h2>
        <p>All activity remains available here, including archived months.</p>
      </div>

      <div className="history-filters">
        {[
          ["all", "All"],
          ["active", "Active"],
          ["archived", "Archived"],
          ["unassigned", "Unassigned"],
        ].map(([value, label]) => (
          <button
            className={historyFilter === value ? "active" : ""}
            key={value}
            onClick={() => setHistoryFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="transaction-card">
        {transactions
          .filter(
            (tx) =>
              historyFilter === "all" ||
              (historyFilter === "unassigned"
                ? !tx.period_id
                : historyFilter === "active"
                  ? tx.period_id === activePeriod?.id
                  : tx.period_status === "archived"),
          )
          .map((tx, index) => (
            <SwipeableItem
              key={tx.id}
              onDelete={() => deleteTransaction(tx.id)}
              className={index ? "transaction-divider" : ""}
            >
              <div className="transaction-row">
                <div
                  className={`transaction-icon ${
                    tx.type === "expense" ? "expense" : "income"
                  }`}
                >
                  {tx.type === "expense" ? (
                    <TrendingDown size={18} />
                  ) : (
                    <TrendingUp size={18} />
                  )}
                </div>
                <div className="transaction-info">
                  <strong>{tx.desc || "Transaction"}</strong>
                  <span>
                    {tx.account} · {tx.category} · {formatDate(tx.date)} ·{" "}
                    {tx.period_name || "Unassigned"}
                  </span>
                </div>
                <strong
                  className={`transaction-amount ${
                    tx.type === "expense" ? "expense" : "income"
                  }`}
                >
                  {tx.type === "expense" ? "-" : "+"}
                  {formatMMK(tx.amount)}
                </strong>
              </div>
            </SwipeableItem>
          ))}
=======
      <div className="subheader-row">
        <p>Ledger & Monthly Archives</p>
        <button
          className="plans-add-button"
          onClick={() => setCloseMonthModalOpen(true)}
        >
          <Archive size={15} />
          Close Month
        </button>
      </div>

      <div className="plans-segmented glass-surface">
        <button
          className={historyTab === "transactions" ? "active" : ""}
          onClick={() => setHistoryTab("transactions")}
        >
          <History size={15} />
          Transactions
        </button>
        <button
          className={historyTab === "archives" ? "active" : ""}
          onClick={() => setHistoryTab("archives")}
        >
          <Archive size={15} />
          Archives
        </button>
>>>>>>> 6d68a50c81a15933e96267b7c8a9678d4957e3a5
      </div>

      {historyTab === "transactions" ? (
        <div className="transaction-card glass-surface">
          {transactions.map((tx, index) => (
            <SwipeableItem
              key={tx.id}
              onDelete={() => deleteTransaction(tx.id)}
              className={index ? "transaction-divider" : ""}
            >
              <div className="transaction-row">
                <div
                  className={`transaction-icon ${
                    tx.type === "expense" ? "expense" : "income"
                  }`}
                >
                  {tx.type === "expense" ? (
                    <TrendingDown size={18} />
                  ) : (
                    <TrendingUp size={18} />
                  )}
                </div>
                <div className="transaction-info">
                  <strong>{tx.desc || "Transaction"}</strong>
                  <span>
                    {tx.account} · {tx.category} · {formatDate(tx.date)}
                  </span>
                </div>
                <strong
                  className={`transaction-amount ${
                    tx.type === "expense" ? "expense" : "income"
                  }`}
                >
                  {tx.type === "expense" ? "-" : "+"}
                  {formatMMK(tx.amount)}
                </strong>
              </div>
            </SwipeableItem>
          ))}
          {!transactions.length && (
            <div className="empty-state">No transactions recorded yet.</div>
          )}
        </div>
      ) : (
        <div className="stack-list">
          {archives.map((archive) => (
            <SwipeableItem
              key={archive.id}
              onDelete={() => unarchiveMonth(archive.id)}
              className="rounded-3xl shadow-sm"
            >
              <div className="glass-surface p-4 relative rounded-2xl">
                
                {/* Visible Unarchive Button directly on the card */}
                <button
                  onClick={() => unarchiveMonth(archive.id)}
                  className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-1 bg-red-50/50 rounded-md transition-transform active:scale-95"
                  title="Unarchive Month"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex justify-between items-start mb-3 border-b border-gray-200/50 pb-3 pr-8">
                  <div>
                    <strong className="text-sm font-bold block">{archive.year} - Month {archive.month}</strong>
                    {archive.notes && <span className="text-xs text-gray-500 mt-1 block">{archive.notes}</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider mb-1">Net Savings</span>
                    <strong className={`text-sm ${Number(archive.net_savings) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {Number(archive.net_savings) >= 0 ? '+' : ''}{formatMMK(Number(archive.net_savings))}
                    </strong>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100/50">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Income</span>
                    <strong className="text-emerald-700 text-xs">{formatMMK(Number(archive.total_income))}</strong>
                  </div>
                  <div className="bg-red-50/60 rounded-xl p-3 border border-red-100/50">
                    <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block mb-1">Expense</span>
                    <strong className="text-red-700 text-xs">{formatMMK(Number(archive.total_expense))}</strong>
                  </div>
                </div>
              </div>
            </SwipeableItem>
          ))}
          {!archives.length && (
            <div className="empty-state">
              <p className="mb-2">No months have been closed yet.</p>
              
              {archiveDebug !== "OK" && archiveDebug !== "" && (
                <div className="mt-4 p-3 bg-red-50/80 border border-red-200 rounded-lg text-left">
                  <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1">Debug Output:</p>
                  <p className="text-[10px] text-red-600 font-mono break-all">{archiveDebug}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderArchive = () => (
    <div className="page-content">
      {!selectedPeriod && !selectedMonthlySummary && (activePeriod ? (
        <section className="archive-close-card ios-glass-prominent">
          <div className="archive-close-icon">
            <History size={19} />
          </div>
          <div className="archive-close-copy">
            <span>MONTH IN PROGRESS</span>
            <h2>{activePeriod.name || "Current Month"}</h2>
            <p>{periodTransactions.length} transactions ready to archive</p>
          </div>
          <button onClick={() => setPeriodModal(true)}>Close Month</button>
        </section>
      ) : (
        <section className="period-empty archive-start-card">
          <div>
            <span>READY FOR A NEW MONTH?</span>
            <p>
              Start a fresh month whenever you are ready. The archived reports
              stay saved.
            </p>
          </div>
          <button onClick={startPeriod}>
            {periodBusy ? "Starting…" : "Start Month"}
          </button>
        </section>
      ))}
      {periodError && (
        <div className="form-error archive-error">{periodError}</div>
      )}
      {selectedMonthlySummary ? (
        <section className="legacy-summary-report">
          <button className="secondary-action" onClick={() => setSelectedMonthlySummary(null)}>← All archived reports</button>
          <div className="archive-detail legacy-summary-detail">
            <span>PREVIOUS MONTHLY ARCHIVE</span>
            <h2>{new Date(selectedMonthlySummary.year, selectedMonthlySummary.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
            <p>Saved {new Date(selectedMonthlySummary.closed_at).toLocaleString()}{selectedMonthlySummary.notes ? ` · ${selectedMonthlySummary.notes}` : ""}</p>
            <div className="archive-totals">
              <div>Income<strong>{formatMMK(selectedMonthlySummary.total_income)}</strong></div>
              <div>Expenses<strong>{formatMMK(selectedMonthlySummary.total_expense)}</strong></div>
              <div>Net savings<strong>{formatMMK(selectedMonthlySummary.net_savings)}</strong></div>
            </div>
          </div>
          {!!selectedMonthlySummary.category_breakdown?.length && <section className="legacy-breakdown"><h3>Category breakdown</h3>{selectedMonthlySummary.category_breakdown.map((item, index) => <div className="legacy-breakdown-row" key={index}><span>{String(item.category_name ?? item.name ?? "Uncategorized")}</span><small>{String(item.type ?? "")}</small><strong>{formatMMK(Number(item.total_amount ?? item.total ?? 0))}</strong></div>)}</section>}
          {!!selectedMonthlySummary.account_snapshot?.length && <section className="legacy-breakdown"><h3>Account balances at archive</h3>{selectedMonthlySummary.account_snapshot.map((item, index) => <div className="legacy-breakdown-row" key={index}><span>{String(item.name ?? "Account")}</span><small>{String(item.type ?? "")}</small><strong>{formatMMK(Number(item.balance ?? 0))}</strong></div>)}</section>}
        </section>
      ) : null}
      {!selectedMonthlySummary && (selectedPeriod ? (
        <>
          <button
            className="secondary-action"
              onClick={() => { setSelectedPeriod(null); setSelectedMonthlySummary(null); }}
          >
            ← All archived periods
          </button>
          <div className="archive-detail">
            <span>ARCHIVED REPORT</span>
            <h2>{selectedPeriod.name || "Financial Period"}</h2>
            <p>
              {selectedPeriod.start_date} – {selectedPeriod.end_date} · Closed{" "}
              {selectedPeriod.closed_at
                ? new Date(selectedPeriod.closed_at).toLocaleString()
                : ""}
            </p>
            <div className="archive-totals">
              <div>
                Income
                <strong>{formatMMK(selectedPeriod.total_income || 0)}</strong>
              </div>
              <div>
                Expenses
                <strong>{formatMMK(selectedPeriod.total_expenses || 0)}</strong>
              </div>
              <div>
                Net<strong>{formatMMK(selectedPeriod.net_income || 0)}</strong>
              </div>
              <div>
                Transactions
                <strong>{selectedPeriod.transaction_count || 0}</strong>
              </div>
            </div>
          </div>
          <div className="transaction-card">
            {transactions
              .filter((tx) => tx.period_id === selectedPeriod.id)
              .map((tx) => (
                <div className="transaction-row" key={tx.id}>
                  <div className={`transaction-icon ${tx.type}`}>
                    <span>{tx.type === "income" ? "+" : "−"}</span>
                  </div>
                  <div className="transaction-info">
                    <strong>{tx.desc || tx.category}</strong>
                    <span>
                      {tx.category} · {tx.account} · {formatDate(tx.date)}
                    </span>
                  </div>
                  <strong className={`transaction-amount ${tx.type}`}>
                    {tx.type === "income" ? "+" : "−"}
                    {formatMMK(tx.amount)}
                  </strong>
                </div>
              ))}
          </div>
        </>
      ) : (
        <>
          {!selectedPeriod && (
            <div className="subheader-block archive-heading">
              <h2>Archived Months</h2>
              <p>Totals and transaction details from every month you closed.</p>
            </div>
          )}
          {archivedPeriods.map((period) => (
            <button
              className="archive-card"
              key={period.id}
              onClick={() => { setSelectedMonthlySummary(null); setSelectedPeriod(period); }}
            >
              <span>
                {period.start_date} – {period.end_date}
              </span>
              <strong>{period.name || "Financial Period"}</strong>
              <div>
                Income {formatMMK(period.total_income || 0)} · Expenses{" "}
                {formatMMK(period.total_expenses || 0)}
              </div>
              <small>
                Net {formatMMK(period.net_income || 0)} ·{" "}
                {period.transaction_count || 0} transactions
              </small>
            </button>
          ))}
          {!!monthlySummaries.length && (
            <div className="subheader-block archive-heading legacy-archive-heading">
              <h2>Monthly Summaries</h2>
              <p>Saved directly from your monthly_summaries records.</p>
            </div>
          )}
          {monthlySummaries.map((summary) => (
            <button className="archive-card legacy-summary-card" key={`monthly-${summary.id}`} onClick={() => {setSelectedPeriod(null);setSelectedMonthlySummary(summary)}}>
              <span>PREVIOUS ARCHIVE · {new Date(summary.year, summary.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
              <strong>{new Date(summary.year, summary.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })} summary</strong>
              <div>Income {formatMMK(summary.total_income)} · Expenses {formatMMK(summary.total_expense)}</div>
              <small>Net savings {formatMMK(summary.net_savings)} · Saved {new Date(summary.closed_at).toLocaleDateString()}</small>
            </button>
          ))}
          {!archivedPeriods.length && !monthlySummaries.length && (
            <div className="empty-state">No archived reports yet.</div>
          )}
        </>
      ))}
    </div>
  );

  const renderPlans = () => (
    <div className="page-content">
      <div className="subheader-row">
        <p>Loans, borrowing and savings goals</p>
        <button
          className="plans-add-button"
          onClick={() => {
            if (planTab === "loans") {
              resetLoan();
              setLoanModal(true);
            } else {
              resetSaving();
              setSavingsModal(true);
            }
          }}
        >
          <PlusCircle size={15} />
          {planTab === "loans" ? "Add Loan" : "Add Saving"}
        </button>
      </div>

      <div className="plans-segmented glass-surface">
        <button
          className={planTab === "loans" ? "active" : ""}
          onClick={() => setPlanTab("loans")}
        >
          <CreditCard size={15} />
          Loans & Borrowing
        </button>
        <button
          className={planTab === "savings" ? "active" : ""}
          onClick={() => setPlanTab("savings")}
        >
          <PiggyBank size={15} />
          Savings
        </button>
      </div>

      {planTab === "loans" ? (
        <div className="stack-list">
          {loans.map((loan) => {
            const progress =
              loan.total > 0
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      ((loan.total - loan.remaining) / loan.total) * 100,
                    ),
                  )
                : 0;

            return (
              <SwipeableItem
                key={loan.id}
                onDelete={() => deleteLoan(loan.id)}
                className="rounded-3xl shadow-sm"
              >
                <div className="plan-card glass-surface rounded-2xl">
                  <div className="plan-card-top">
                    <div>
                      <strong>{loan.name}</strong>
                      <span>
                        {loan.type === "borrowed"
                          ? "Debt to repay"
                          : "Receivable"}
                      </span>
                    </div>

                    <button
                      className="edit-icon"
                      onClick={() => editLoan(loan)}
                      aria-label="Edit loan"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>

                  <div className="plan-money">
                    <span>Remaining</span>
                    <strong>
                      {formatMMK(loan.remaining)} / {formatMMK(loan.total)}
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className={`progress-fill ${
                        loan.type === "borrowed" ? "red" : "green"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </SwipeableItem>
            );
          })}

          {!loans.length && (
            <div className="empty-state">
              No loans or borrowing records yet.
            </div>
          )}
        </div>
      ) : (
        <div className="stack-list">
          {savings.map((saving) => {
            const progress =
              saving.target > 0
                ? Math.min(
                    100,
                    Math.max(0, (saving.saved / saving.target) * 100),
                  )
                : 0;

            return (
              <SwipeableItem
                key={saving.id}
                onDelete={() => deleteSaving(saving.id)}
                className="rounded-3xl shadow-sm"
              >
                <div className="plan-card glass-surface rounded-2xl">
                  <div className="plan-card-top">
                    <div className="saving-title">
                      <div className="saving-icon">
                        <PiggyBank size={19} />
                      </div>
                      <div>
                        <strong>{saving.name}</strong>
                        <span>
                          {saving.target_date
                            ? `Target: ${saving.target_date}`
                            : "Savings goal"}
                        </span>
                      </div>
                    </div>

                    <button
                      className="edit-icon"
                      onClick={() => editSaving(saving)}
                      aria-label="Edit savings"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>

                  <div className="plan-money">
                    <strong>{formatMMK(saving.saved)} saved</strong>
                    <strong className="green-text">
                      {Math.round(progress)}%
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill green"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <span className="target-text">
                    Target {formatMMK(saving.target)} MMK
                  </span>
                </div>
              </SwipeableItem>
            );
          })}

          {!savings.length && (
            <div className="empty-state">
              No savings goals yet. Start your first goal.
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (initializing) {
    return (
<<<<<<< HEAD
      <div className={`app-outer${darkMode ? " dark" : ""}`}>
        <div className="app-shell loading-shell">
          <RefreshCw className="animate-spin text-blue-600" size={28} />
=======
      <div className="app-outer">
        <div className="liquid-background">
          <div className="blob blob-purple"></div>
          <div className="blob blob-cyan"></div>
          <div className="blob blob-red"></div>
        </div>
        <div className="app-shell loading-shell glass-surface">
          <RefreshCw className="animate-spin text-indigo-600" size={28} />
>>>>>>> 6d68a50c81a15933e96267b7c8a9678d4957e3a5
          <span>{syncStatus}</span>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <PinScreen
        darkMode={darkMode}
        onUnlocked={async () => {
          setInitializing(true);
          try {
            await loadFinanceData();
            setUnlocked(true);
          } catch {
            setSyncStatus("API Error");
            setIsError(true);
          } finally {
            setInitializing(false);
          }
        }}
      />
    );
  }

  const anyModal =
    addOpen ||
    transferOpen ||
    accountModal ||
    loanModal ||
    savingsModal ||
<<<<<<< HEAD
    periodModal;

  return (
    <div className={`app-outer${darkMode ? " dark" : ""}`}>
      <div
        className={`app-shell finance-app-shell ios-surface${darkMode ? " dark" : ""}`}
      >
=======
    closeMonthModalOpen;

  return (
    <div className="app-outer">
      <div className="liquid-background">
        <div className="blob blob-purple"></div>
        <div className="blob blob-cyan"></div>
        <div className="blob blob-red"></div>
      </div>
      <div className="app-shell finance-app-shell glass-surface">
>>>>>>> 6d68a50c81a15933e96267b7c8a9678d4957e3a5
        <TopBar
          title={title}
          syncStatus={syncStatus}
          isError={isError}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode((value) => !value)}
          onInstallHelp={() => setShowInstallHelp(true)}
          onSync={() =>
            loadFinanceData().catch(() => {
              setSyncStatus("API Error");
              setIsError(true);
            })
          }
        />

        <main className="app-scroll hide-scrollbar">
          {!online && (
            <div className="offline-banner">
              Offline · financial changes require a connection
            </div>
          )}
          {installPrompt && (
            <button
              className="install-banner"
              onClick={async () => {
                const prompt = installPrompt as Event & {
                  prompt?: () => Promise<void>;
                };
                await prompt.prompt?.();
                setInstallPrompt(null);
              }}
            >
              Install MyFinanceApp
            </button>
          )}
          {activeTab === "home" && renderHome()}
          {activeTab === "accounts" && renderAccounts()}
          {activeTab === "records" && (
            <div className="records-page">
              <div className="plans-segmented records-segmented">
                <button
                  className={recordsTab === "history" ? "active" : ""}
                  onClick={() => {
                    setRecordsTab("history");
                    setSelectedPeriod(null);
                    setSelectedMonthlySummary(null);
                  }}
                >
                  History
                </button>
                <button
                  className={recordsTab === "archive" ? "active" : ""}
                  onClick={() => { setRecordsTab("archive"); setSelectedPeriod(null); setSelectedMonthlySummary(null); }}
                >
                  Archive
                </button>
              </div>
              {recordsTab === "history" ? renderHistory() : renderArchive()}
            </div>
          )}
          {activeTab === "budgets" && renderPlans()}
        </main>

        {!anyModal && (
          <>
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
            <button
              className="finance-fab"
              onClick={() => setAddOpen(true)}
              aria-label="New transaction"
            >
              <Plus size={28} strokeWidth={2.5} />
            </button>
          </>
        )}

        {showInstallHelp && (
          <Sheet onClose={() => setShowInstallHelp(false)}>
            <div className="sheet-header">
              <div>
                <span className="sheet-eyebrow">INSTALL MYFINANCEAPP</span>
                <h2>Add to Home Screen</h2>
              </div>
              <button
                className="sheet-close"
                onClick={() => setShowInstallHelp(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="install-help">
              <p>
                <strong>iPhone or iPad</strong>
                <br />
                Open this page in Safari, tap Share, then choose{" "}
                <b>Add to Home Screen</b>.
              </p>
              <p>
                <strong>Android</strong>
                <br />
                Open in Chrome and tap Install, or use the browser menu →{" "}
                <b>Install app</b>.
              </p>
              <small>
                On iPhone, launch the saved icon for the standalone app view.
              </small>
            </div>
          </Sheet>
        )}


        {periodModal && (
          <Sheet onClose={() => setPeriodModal(false)}>
            <div className="sheet-header">
              <div>
                <span className="sheet-eyebrow">MONTH SUMMARY</span>
                <h2>Review &amp; Close Month</h2>
              </div>
              <button
                className="sheet-close"
                onClick={() => setPeriodModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="period-review">
              <strong>{activePeriod?.name || "Current Month"}</strong>
              <span>
                Income {formatMMK(income)} · Expenses {formatMMK(expense)} · Net{" "}
                {formatMMK(income - expense)}
              </span>
              <span>{periodTransactions.length} transactions</span>
            </div>
            {periodError && <div className="form-error">{periodError}</div>}
            <button
              className="primary-action period-close-action"
              disabled={periodBusy}
              onClick={closeMonth}
            >
              {periodBusy ? "Archiving…" : "Confirm Close Month"}
            </button>
          </Sheet>
        )}

        <AddTransactionModal
          open={addOpen}
          accounts={accounts}
          onClose={() => setAddOpen(false)}
          onAdd={addTransaction}
        />

        <TransferModal
          open={transferOpen}
          accounts={accounts}
          onClose={() => setTransferOpen(false)}
          onTransfer={transfer}
        />

        {accountModal && (
          <Sheet onClose={() => setAccountModal(false)}>
            <div className="sheet-header">
              <div>
                <span className="sheet-eyebrow">ACCOUNT</span>
                <h2>Add Account</h2>
              </div>
              <button
                className="sheet-close"
                onClick={() => setAccountModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={createAccount} className="space-y-4">
              <div>
                <label className="finance-label">Account Name</label>
                <input
                  className="finance-input"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. KBZPAY"
                  required
                />
              </div>

              <div>
                <label className="finance-label">Initial Balance</label>
                <input
                  className="finance-input amount-input"
                  inputMode="numeric"
                  value={accountBalance}
                  onChange={(e) =>
                    setAccountBalance(formatInputValue(e.target.value))
                  }
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="finance-label">Account Type</label>
                <select
                  className="finance-input"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                >
                  <option value="bank">Traditional Bank</option>
                  <option value="cash">Physical Cash</option>
                  <option value="ewallet">Electronic Wallet</option>
                </select>
              </div>

              <button className="primary-action" type="submit">
                Create Account
              </button>
            </form>
          </Sheet>
        )}

        {loanModal && (
          <Sheet
            onClose={() => {
              setLoanModal(false);
              resetLoan();
            }}
          >
            <div className="sheet-header">
              <div>
                <span className="sheet-eyebrow">LOANS & BORROWING</span>
                <h2>{loanEditingId ? "Edit Loan" : "New Loan / IOU"}</h2>
              </div>
              <button
                className="sheet-close"
                onClick={() => {
                  setLoanModal(false);
                  resetLoan();
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveLoan} className="space-y-4">
              <div>
                <label className="finance-label">Name</label>
                <input
                  className="finance-input"
                  value={loanName}
                  onChange={(e) => setLoanName(e.target.value)}
                  placeholder="e.g. Nang Ei"
                  required
                />
              </div>

              <div>
                <label className="finance-label">Type</label>
                <select
                  className="finance-input"
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                >
                  <option value="borrowed">I borrowed money</option>
                  <option value="lent">I lent money</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="finance-label">Total</label>
                  <input
                    className="finance-input amount-input"
                    inputMode="numeric"
                    value={loanTotal}
                    onChange={(e) =>
                      setLoanTotal(formatInputValue(e.target.value))
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="finance-label">Remaining</label>
                  <input
                    className="finance-input amount-input"
                    inputMode="numeric"
                    value={loanRemaining}
                    onChange={(e) =>
                      setLoanRemaining(formatInputValue(e.target.value))
                    }
                    placeholder="Same as total"
                  />
                </div>
              </div>

              <button className="primary-action" type="submit">
                {loanEditingId ? "Save Changes" : "Create Loan"}
              </button>
            </form>
          </Sheet>
        )}

        {savingsModal && (
          <Sheet
            onClose={() => {
              setSavingsModal(false);
              resetSaving();
            }}
          >
            <div className="sheet-header">
              <div>
                <span className="sheet-eyebrow green-eyebrow">SAVINGS</span>
                <h2>
                  {savingEditingId ? "Edit Savings Goal" : "New Savings Goal"}
                </h2>
              </div>
              <button
                className="sheet-close"
                onClick={() => {
                  setSavingsModal(false);
                  resetSaving();
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveSaving} className="space-y-4">
              <div>
                <label className="finance-label">Goal Name</label>
                <input
                  className="finance-input"
                  value={savingName}
                  onChange={(e) => setSavingName(e.target.value)}
                  placeholder="e.g. New iPhone"
                  required
                />
              </div>

              <div>
                <label className="finance-label">Target Amount</label>
                <input
                  className="finance-input amount-input"
                  inputMode="numeric"
                  value={savingTarget}
                  onChange={(e) =>
                    setSavingTarget(formatInputValue(e.target.value))
                  }
                  placeholder="1,000,000"
                  required
                />
              </div>

              <div>
                <label className="finance-label">Already Saved</label>
                <input
                  className="finance-input amount-input"
                  inputMode="numeric"
                  value={savingSaved}
                  onChange={(e) =>
                    setSavingSaved(formatInputValue(e.target.value))
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <label className="finance-label">Target Date</label>
                <input
                  className="finance-input"
                  type="date"
                  value={savingDate}
                  onChange={(e) => setSavingDate(e.target.value)}
                />
              </div>

              <button className="primary-action savings-action" type="submit">
                {savingEditingId ? "Save Changes" : "Create Savings Goal"}
              </button>
            </form>
          </Sheet>
        )}

        <CloseMonthModal
          open={closeMonthModalOpen}
          onClose={() => setCloseMonthModalOpen(false)}
          onCloseMonth={closeMonth}
        />
      </div>
    </div>
  );
}