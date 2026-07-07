import React, { useCallback, useEffect, useState } from "react";
import {
  Home,
  CreditCard,
  PieChart,
  Plus,
  X,
  History,
  Landmark,
  Wallet,
  Banknote,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  AlertTriangle,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  ApiError,
  api,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "./services/api";

// --- Types ---
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
}

interface LoanData {
  id: number;
  name: string;
  total: number;
  remaining: number;
  type: string;
}

interface CategoryData {
  id: number;
  name: string;
  type: string;
}

interface PinResponse {
  token: string;
  expires_at: number;
  remember_hours: 24 | 48;
}

interface AccountsResponse {
  accounts: AccountData[];
}

interface TransactionsResponse {
  transactions: TransactionData[];
}

interface TransactionMutationResponse {
  transaction: TransactionData;
  accounts: AccountData[];
}

interface LoansResponse {
  loans: LoanData[];
}

interface LoanMutationResponse {
  loan: LoanData;
}

interface CategoriesResponse {
  categories: CategoryData[];
}

interface AccountMutationResponse {
  account: AccountData;
}

// --- Formatting Helper (MMK) ---
const formatMMK = (num: number) => {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(num);
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
};

// --- Swipeable Component ---
const SwipeableItem = ({
  children,
  onDelete,
  containerClassName = "",
}: {
  children: React.ReactNode;
  onDelete: () => void;
  containerClassName?: string;
}) => {
  const [startX, setStartX] = useState<number | null>(null);
  const [startOffset, setStartOffset] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const buttonWidth = 80;

  const handleStart = (clientX: number) => {
    setStartX(clientX);
    setStartOffset(currentX);
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || startX === null) return;
    const diff = clientX - startX;

    const newX = startOffset + diff;

    if (newX < 0) {
      setCurrentX(Math.max(newX, -buttonWidth - 20));
    } else {
      setCurrentX(0);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (currentX < -40) {
      setCurrentX(-buttonWidth);
    } else {
      setCurrentX(0);
    }
    setStartX(null);
  };

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={{ touchAction: "pan-y" }}
    >
      <div className="absolute inset-y-0 right-0 w-[80px] bg-red-500 flex items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentX(0);
            onDelete();
          }}
          className="w-full h-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
          aria-label="Confirm Delete"
        >
          <Trash2 size={20} />
        </button>
      </div>
      <div
        className="relative bg-white w-full h-full cursor-pointer"
        style={{
          transform: `translateX(${currentX}px)`,
          transitionDuration: isDragging ? "0ms" : "250ms",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={() => isDragging && handleEnd()}
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
}: {
  title: string;
  syncStatus: string;
  isError: boolean;
  onSync?: () => void;
}) => (
  <div className="bg-zinc-50 text-zinc-900 p-5 shrink-0 flex flex-col justify-between items-start z-10">
    <div className="flex justify-between items-center w-full mt-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          {title === "My Dashboard" ? "Overview" : title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {onSync && (
          <button
            onClick={onSync}
            disabled={syncStatus === "Syncing..."}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 shadow-sm rounded-full transition-all active:scale-95 disabled:opacity-50"
            aria-label="Sync data"
          >
            <RefreshCw
              size={14}
              className={
                syncStatus === "Syncing..." ? "animate-spin text-blue-600" : ""
              }
            />
          </button>
        )}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm ${
            isError
              ? "bg-red-100 text-red-600 border border-red-200"
              : syncStatus === "API Synced"
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-amber-100 text-amber-700 border border-amber-200"
          }`}
        >
          {!isError && (
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                syncStatus === "API Synced"
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-amber-500"
              }`}
            ></span>
          )}
          {isError && <AlertTriangle size={12} className="text-red-500" />}
          {syncStatus}
        </div>
      </div>
    </div>
  </div>
);

const BottomNav = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => (
  <div className="bg-white border-t border-zinc-200 absolute bottom-0 w-full flex justify-between items-center px-6 py-3 z-40 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
    <button
      onClick={() => setActiveTab("home")}
      className={`flex flex-col items-center transition-all ${
        activeTab === "home"
          ? "text-blue-600"
          : "text-zinc-400 hover:text-zinc-600"
      }`}
    >
      <Home
        size={22}
        className={activeTab === "home" ? "stroke-[2.5px]" : ""}
      />
      <span className="text-[10px] mt-1 font-semibold">Home</span>
    </button>
    <button
      onClick={() => setActiveTab("accounts")}
      className={`flex flex-col items-center transition-all ${
        activeTab === "accounts"
          ? "text-blue-600"
          : "text-zinc-400 hover:text-zinc-600"
      }`}
    >
      <CreditCard
        size={22}
        className={activeTab === "accounts" ? "stroke-[2.5px]" : ""}
      />
      <span className="text-[10px] mt-1 font-semibold">Accounts</span>
    </button>

    {/* Spacer for Floating Action Button */}
    <div className="w-16"></div>

    <button
      onClick={() => setActiveTab("history")}
      className={`flex flex-col items-center transition-all ${
        activeTab === "history"
          ? "text-blue-600"
          : "text-zinc-400 hover:text-zinc-600"
      }`}
    >
      <History
        size={22}
        className={activeTab === "history" ? "stroke-[2.5px]" : ""}
      />
      <span className="text-[10px] mt-1 font-semibold">History</span>
    </button>
    <button
      onClick={() => setActiveTab("budgets")}
      className={`flex flex-col items-center transition-all ${
        activeTab === "budgets"
          ? "text-blue-600"
          : "text-zinc-400 hover:text-zinc-600"
      }`}
    >
      <PieChart
        size={22}
        className={activeTab === "budgets" ? "stroke-[2.5px]" : ""}
      />
      <span className="text-[10px] mt-1 font-semibold">Loans</span>
    </button>
  </div>
);

// --- Modals ---
const AddTransactionModal = ({
  isOpen,
  onClose,
  onAdd,
  accounts,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: {
    amount: number;
    type: string;
    desc: string;
    account: string;
    date: string;
    category: string;
  }) => void | Promise<void>;
  accounts: AccountData[];
}) => {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [account, setAccount] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    const finalAccount =
      account || (accounts.length > 0 ? accounts[0].name : "");

    onAdd({
      amount: parseFloat(amount),
      type,
      desc,
      account: finalAccount,
      date: new Date().toISOString().split("T")[0],
      category: type === "expense" ? "General" : "Income",
    });

    // Modal closes instantly for Optimistic UI
    setAmount("");
    setDesc("");
    setAccount("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-end justify-center p-0 z-[60]">
      <div
        className="bg-white w-full max-w-md rounded-t-[2rem] p-6 shadow-2xl animate-slide-up border border-zinc-100 max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-zinc-900">New Transaction</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition rounded-full p-1.5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 mb-6 bg-zinc-100 p-1 rounded-xl">
          <button
            type="button"
            className={`flex-1 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide transition-all ${
              type === "expense"
                ? "bg-white text-red-600 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
            onClick={() => setType("expense")}
          >
            Expense
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide transition-all ${
              type === "income"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
            onClick={() => setType("income")}
          >
            Income
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pb-10">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
              Amount (MMK)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-2xl font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="0"
                step="1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
              placeholder="e.g. Rice, electric bill, dinner"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
              Bank or Wallet Account
            </label>
            <select
              value={account || (accounts.length > 0 ? accounts[0].name : "")}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
            >
              {accounts.map((acc: AccountData) => (
                <option key={acc.id} value={acc.name}>
                  {acc.name} ({formatMMK(acc.balance)} MMK)
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className={`w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide mt-4 shadow-lg transition-all active:scale-95 ${
              type === "expense"
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
            }`}
          >
            Log This {type === "expense" ? "Expense" : "Income"}
          </button>
        </form>
      </div>
    </div>
  );
};

const PinScreen = ({ onUnlocked }: { onUnlocked: () => Promise<void> }) => {
  const [pin, setPin] = useState("");
  const [rememberHours, setRememberHours] = useState<24 | 48>(48);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post<PinResponse>("auth/pin.php", {
        pin,
        remember_hours: rememberHours,
      });

      setAuthToken(response.data.token, response.data.expires_at);
      await onUnlocked();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-100 h-screen overflow-hidden font-sans text-zinc-900 flex justify-center">
      <div className="w-full max-w-md bg-zinc-50 h-full flex flex-col justify-center px-6 border-x border-zinc-200">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-3">
            Personal Finance
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">
            Enter PIN
          </h1>
          <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
            Unlock your finance dashboard on this device.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              4-digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={(event) =>
                setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="w-full bg-white border border-zinc-200 rounded-xl py-4 px-4 text-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-3xl font-extrabold text-center tracking-[0.45em]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              Remember on this device
            </label>
            <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-xl">
              {[24, 48].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setRememberHours(hours as 24 | 48)}
                  className={`py-2.5 rounded-lg font-bold text-xs transition ${
                    rememberHours === hours
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-zinc-500"
                  }`}
                >
                  {hours} hours
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            {isSubmitting ? "Unlocking..." : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Connecting...");
  const [isError, setIsError] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState("bank");
  const [newAccBalance, setNewAccBalance] = useState("");

  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);
  const [newLoanName, setNewLoanName] = useState("");
  const [newLoanType, setNewLoanType] = useState("borrowed");
  const [newLoanTotal, setNewLoanTotal] = useState("");
  const [newLoanRemaining, setNewLoanRemaining] = useState("");

  const resetFinanceState = useCallback(() => {
    setAccounts([]);
    setTransactions([]);
    setLoans([]);
    setCategories([]);
  }, []);


  
 const loadFinanceData = useCallback(async () => {
    setSyncStatus("Syncing...");

    // Generate a unique timestamp for cache-busting
    const timestamp = Date.now();

    const [
      accountsResponse,
      transactionsResponse,
      loansResponse,
      categoriesResponse,
    ] = await Promise.all([
      api.get<AccountsResponse>(`accounts/index.php?_t=${timestamp}`),
      api.get<TransactionsResponse>(`transactions/index.php?_t=${timestamp}`),
      api.get<LoansResponse>(`loans/index.php?_t=${timestamp}`),
      api.get<CategoriesResponse>(`categories/index.php?_t=${timestamp}`),
    ]);

    setAccounts(accountsResponse.data.accounts);
    setTransactions(transactionsResponse.data.transactions);
    setLoans(loansResponse.data.loans);
    setCategories(categoriesResponse.data.categories);
    setSyncStatus("API Synced");
    setIsError(false);

    
  }, []);

  // --- Auto-Refresh on iOS App Resume ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      // If the app just came back to the screen AND the user is logged in
      if (document.visibilityState === "visible" && isUnlocked) {
        // Silently fetch the latest data in the background
        loadFinanceData(); 
      }
    };

    // Listen for when the app goes to the background or comes to the foreground
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isUnlocked, loadFinanceData]);
  
  useEffect(() => {
    let cancelled = false;

    const bootFromToken = async () => {
      if (!getAuthToken()) {
        setSyncStatus("PIN required");
        setIsInitializing(false);
        return;
      }

      try {
        if (cancelled) {
          return;
        }

        await loadFinanceData();
        setIsUnlocked(true);
      } catch (error) {
        if (!cancelled) {
          console.error("PIN session restore failed:", error);
          clearAuthToken();
          setIsUnlocked(false);
          resetFinanceState();
          setSyncStatus("PIN required");
          setIsError(false);
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    bootFromToken();

    return () => {
      cancelled = true;
    };
  }, [loadFinanceData, resetFinanceState]);

  useEffect(() => {
    const handleExpired = () => {
      setIsUnlocked(false);
      resetFinanceState();
      setSyncStatus("Session expired");
      setIsError(true);
    };

    window.addEventListener("auth:expired", handleExpired);

    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [resetFinanceState]);

  const handleUnlocked = useCallback(async () => {
    setIsInitializing(true);

    try {
      await loadFinanceData();
      setIsUnlocked(true);
    } catch (error) {
      console.error("Initial data load failed:", error);
      setSyncStatus("API Error");
      setIsError(true);
    } finally {
      setIsInitializing(false);
    }
  }, [loadFinanceData]);

  const handleDeleteTransaction = async (idToDelete: number) => {
    const previousTransactions = transactions;
    const previousAccounts = accounts;

    setTransactions((currentTransactions) =>
      currentTransactions.filter(
        (transaction) => transaction.id !== idToDelete,
      ),
    );

    try {
      const response = await api.delete<{ accounts: AccountData[] }>(
        `transactions/delete.php?id=${idToDelete}`,
      );
      setAccounts(response.data.accounts);
      setSyncStatus("API Synced");
      setIsError(false);
    } catch (error) {
      console.error("Transaction delete failed:", error);
      setTransactions(previousTransactions);
      setAccounts(previousAccounts);
      setSyncStatus("API Error");
      setIsError(true);
    }
  };

  const handleDeleteAccount = async (idToDelete: number) => {
    const previousAccounts = accounts;

    setAccounts((currentAccounts) =>
      currentAccounts.filter((account) => account.id !== idToDelete),
    );

    try {
      await api.delete<Record<string, never>>(
        `accounts/delete.php?id=${idToDelete}`,
      );
      await loadFinanceData();
    } catch (error) {
      console.error("Account delete failed:", error);
      setAccounts(previousAccounts);
      setSyncStatus("API Error");
      setIsError(true);
    }
  };

  const handleDeleteLoan = async (idToDelete: number) => {
    const previousLoans = loans;

    setLoans((currentLoans) =>
      currentLoans.filter((loan) => loan.id !== idToDelete),
    );

    try {
      await api.delete<Record<string, never>>(
        `loans/delete.php?id=${idToDelete}`,
      );
      setSyncStatus("API Synced");
      setIsError(false);
    } catch (error) {
      console.error("Loan delete failed:", error);
      setLoans(previousLoans);
      setSyncStatus("API Error");
      setIsError(true);
    }
  };

  const handleAddTransaction = async (newTx: {
    amount: number;
    type: string;
    desc: string;
    account: string;
    date: string;
    category: string;
  }) => {
    const selectedAccount = accounts.find(
      (account) => account.name === newTx.account,
    );

    if (!selectedAccount) {
      setSyncStatus("Select an account");
      setIsError(true);
      return;
    }

    const selectedCategory = categories.find(
      (category) =>
        category.type === newTx.type &&
        category.name.toLowerCase() === newTx.category.toLowerCase(),
    );
    const optimisticId = Date.now();
    const optimisticTransaction: TransactionData = {
      ...newTx,
      id: optimisticId,
      account_id: selectedAccount.id,
      category_id: selectedCategory?.id ?? null,
    };

    setTransactions((currentTransactions) => [
      optimisticTransaction,
      ...currentTransactions,
    ]);

    try {
      const response = await api.post<TransactionMutationResponse>(
        "transactions/create.php",
        {
          account_id: selectedAccount.id,
          category_id: selectedCategory?.id ?? null,
          amount: newTx.amount,
          type: newTx.type,
          desc: newTx.desc,
          date: newTx.date,
        },
      );

      setTransactions((currentTransactions) => [
        response.data.transaction,
        ...currentTransactions.filter(
          (transaction) => transaction.id !== optimisticId,
        ),
      ]);
      setAccounts(response.data.accounts);
      setSyncStatus("API Synced");
      setIsError(false);
    } catch (error) {
      console.error("Transaction save failed:", error);
      setTransactions((currentTransactions) =>
        currentTransactions.filter(
          (transaction) => transaction.id !== optimisticId,
        ),
      );
      setSyncStatus("API Error");
      setIsError(true);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccBalance || isNaN(parseFloat(newAccBalance)))
      return;

    try {
      const response = await api.post<AccountMutationResponse>(
        "accounts/create.php",
        {
          name: newAccName,
          balance: parseFloat(newAccBalance),
          type: newAccType,
        },
      );

      setAccounts((currentAccounts) => [
        ...currentAccounts,
        response.data.account,
      ]);
      setNewAccName("");
      setNewAccBalance("");
      setIsNewAccountModalOpen(false);
      setSyncStatus("API Synced");
      setIsError(false);
    } catch (error) {
      console.error("Account save failed:", error);
      setSyncStatus("API Error");
      setIsError(true);
    }
  };

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoanName || !newLoanTotal || isNaN(parseFloat(newLoanTotal)))
      return;

    const total = parseFloat(newLoanTotal);
    const remaining =
      newLoanRemaining && !isNaN(parseFloat(newLoanRemaining))
        ? parseFloat(newLoanRemaining)
        : total;

    try {
      const response = await api.post<LoanMutationResponse>(
        "loans/create.php",
        {
          name: newLoanName,
          total,
          remaining,
          type: newLoanType,
        },
      );

      setLoans((currentLoans) => [...currentLoans, response.data.loan]);
      setNewLoanName("");
      setNewLoanTotal("");
      setNewLoanRemaining("");
      setIsNewLoanModalOpen(false);
      setSyncStatus("API Synced");
      setIsError(false);
    } catch (error) {
      console.error("Loan save failed:", error);
      setSyncStatus("API Error");
      setIsError(true);
    }
  };

  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  const calculatedIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const calculatedExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const renderView = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="space-y-8 mt-2">
            {/* Main Blue Gradient Card */}
            <div className="mx-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[28px] p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
              {/* Soft decorative glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

              <p className="text-blue-100 text-sm font-medium tracking-wide mb-1">
                Total Net Balance
              </p>
              <h2 className="text-4xl font-extrabold tracking-tight mb-8">
                {formatMMK(totalBalance)}{" "}
                <span className="text-2xl font-semibold opacity-80">MMK</span>
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-1.5 mb-1 text-blue-100 text-xs font-semibold tracking-wide">
                    <TrendingUp size={14} className="text-emerald-300" /> Income
                  </div>
                  <p className="text-lg font-bold text-white">
                    + {formatMMK(calculatedIncome)}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-1.5 mb-1 text-blue-100 text-xs font-semibold tracking-wide">
                    <TrendingDown size={14} className="text-red-300" /> Expenses
                  </div>
                  <p className="text-lg font-bold text-white">
                    - {formatMMK(calculatedExpense)}
                  </p>
                </div>
              </div>
            </div>

            {isError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-start mx-4">
                <AlertTriangle
                  size={18}
                  className="text-red-500 shrink-0 mt-0.5"
                />
                <div className="text-xs text-red-800 space-y-1">
                  <p className="font-bold">Sync Error: {syncStatus}</p>
                  <p className="text-red-700/90 leading-relaxed">
                    Check your API URL, database credentials, or enter your PIN
                    again.
                  </p>
                </div>
              </div>
            )}

            {/* My Accounts Horizontal Scroll */}
            <div>
              <div className="flex justify-between items-end mb-4 px-5">
                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                  My Accounts
                </h3>
                <button
                  onClick={() => setActiveTab("accounts")}
                  className="text-sm text-blue-600 font-semibold hover:underline"
                >
                  See All
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 px-4 snap-x hide-scrollbar">
                {accounts.map((acc) => {
                  let IconComponent = Landmark;
                  if (acc.type === "cash") IconComponent = Banknote;
                  if (acc.type === "ewallet") IconComponent = Wallet;

                  return (
                    <div
                      key={acc.id}
                      className="min-w-[140px] bg-white p-5 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-zinc-100 snap-start shrink-0 flex flex-col justify-between"
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${acc.bg} ${acc.color}`}
                      >
                        <IconComponent size={22} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 font-medium mb-1 truncate">
                          {acc.name}
                        </p>
                        <p className="text-lg font-bold text-zinc-900 tracking-tight">
                          {formatMMK(acc.balance)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="px-4">
              <div className="flex justify-between items-end mb-4 px-1">
                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                  Recent Transactions
                </h3>
                <button
                  onClick={() => setActiveTab("history")}
                  className="text-sm text-blue-600 font-semibold hover:underline"
                >
                  See All
                </button>
              </div>

              <div className="bg-white rounded-[28px] shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-zinc-100 overflow-hidden">
                {transactions.slice(0, 4).map((tx, index) => (
                  <SwipeableItem
                    key={tx.id}
                    onDelete={() => handleDeleteTransaction(tx.id)}
                  >
                    <div
                      className={`p-4 flex items-center justify-between transition-colors bg-white ${
                        index !== 0 ? "border-t border-zinc-100/60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                            tx.type === "expense"
                              ? "bg-red-50 text-red-500"
                              : "bg-emerald-50 text-emerald-500"
                          }`}
                        >
                          {tx.type === "expense" ? (
                            <TrendingDown size={20} />
                          ) : (
                            <TrendingUp size={20} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-zinc-950 truncate">
                            {tx.desc}
                          </p>
                          <p className="text-xs text-zinc-400 truncate mt-0.5">
                            {tx.account}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-bold text-sm shrink-0 pl-2 ${
                          tx.type === "expense"
                            ? "text-zinc-900"
                            : "text-emerald-600"
                        }`}
                      >
                        {tx.type === "expense" ? "-" : "+"}
                        {formatMMK(tx.amount)}
                      </span>
                    </div>
                  </SwipeableItem>
                ))}

                {transactions.length === 0 && (
                  <div className="p-8 text-center text-zinc-400 text-sm">
                    No transactions entered yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "accounts":
        return (
          <div className="space-y-6 px-4 pt-2">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
                  My Accounts
                </h2>
                <p className="text-zinc-500 text-sm mt-0.5">
                  Manage bank balances & wallets
                </p>
              </div>
              <button
                onClick={() => setIsNewAccountModalOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl shadow-sm shadow-blue-500/10 transition-all active:scale-95"
              >
                <PlusCircle size={16} />
                Add
              </button>
            </div>

            <div className="space-y-3">
              {accounts.map((acc) => {
                let IconComponent = Landmark;
                if (acc.type === "cash") IconComponent = Banknote;
                if (acc.type === "ewallet") IconComponent = Wallet;

                return (
                  <SwipeableItem
                    key={acc.id}
                    onDelete={() => handleDeleteAccount(acc.id)}
                    containerClassName="rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-zinc-100"
                  >
                    <div className="bg-white p-5 flex items-center justify-between hover:border-zinc-200 transition-all cursor-default h-full">
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                            acc.bg || "bg-zinc-50"
                          } ${acc.color || "text-zinc-600"}`}
                        >
                          <IconComponent size={24} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-900 truncate tracking-tight text-base">
                            {acc.name}
                          </p>
                          <p className="text-xs text-zinc-400 capitalize font-medium tracking-wide mt-0.5">
                            {acc.type} account
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xl font-extrabold text-zinc-950 tracking-tight">
                          {formatMMK(acc.balance)}
                        </span>
                      </div>
                    </div>
                  </SwipeableItem>
                );
              })}
            </div>

            {/* Modal for adding accounts */}
            {isNewAccountModalOpen && (
              <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-end justify-center p-0 z-[60]">
                <div
                  className="bg-white w-full max-w-md rounded-t-[2rem] p-6 shadow-2xl animate-slide-up border border-zinc-100 max-h-[85vh] overflow-y-auto"
                  style={{
                    paddingBottom: "max(24px, env(safe-area-inset-bottom))",
                  }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-zinc-900">
                      Add Account
                    </h2>
                    <button
                      onClick={() => setIsNewAccountModalOpen(false)}
                      className="text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition rounded-full p-1.5"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleAddAccount} className="space-y-5 pb-10">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                        Account Label
                      </label>
                      <input
                        type="text"
                        value={newAccName}
                        onChange={(e) => setNewAccName(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-sm"
                        placeholder="e.g. KBZ Bank, Wallet Cash"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                        Initial Balance (MMK)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={newAccBalance}
                          onChange={(e) => setNewAccBalance(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-lg font-bold tracking-tight"
                          placeholder="0"
                          step="1"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                        Account Classification
                      </label>
                      <select
                        value={newAccType}
                        onChange={(e) => setNewAccType(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-sm"
                      >
                        <option value="bank">Traditional Bank</option>
                        <option value="cash">Physical Cash</option>
                        <option value="ewallet">Electronic Wallet</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 mt-4"
                    >
                      Create Account
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case "history":
        return (
          <div className="space-y-6 px-4 pt-2">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
                Ledger History
              </h2>
              <p className="text-zinc-500 text-sm mt-0.5">
                Swipe left to delete a transaction
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-zinc-100 overflow-hidden divide-y divide-zinc-100/60">
              {transactions.map((tx) => (
                <SwipeableItem
                  key={tx.id}
                  onDelete={() => handleDeleteTransaction(tx.id)}
                >
                  <div className="p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors bg-white">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === "expense"
                            ? "bg-red-50 text-red-500"
                            : "bg-emerald-50 text-emerald-500"
                        }`}
                      >
                        {tx.type === "expense" ? (
                          <TrendingDown size={20} />
                        ) : (
                          <TrendingUp size={20} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-zinc-900 truncate">
                          {tx.desc}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {tx.account} • {tx.date}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-bold text-sm shrink-0 pl-2 tracking-tight ${
                        tx.type === "expense"
                          ? "text-zinc-900"
                          : "text-emerald-600"
                      }`}
                    >
                      {tx.type === "expense" ? "-" : "+"}
                      {formatMMK(tx.amount)}
                    </span>
                  </div>
                </SwipeableItem>
              ))}

              {transactions.length === 0 && (
                <div className="p-8 text-center text-zinc-400 text-sm">
                  No entries found.
                </div>
              )}
            </div>
          </div>
        );

      case "budgets":
        return (
          <div className="space-y-6 px-4 pt-2">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
                  Loans & Borrowing
                </h2>
                <p className="text-zinc-500 text-sm mt-0.5">
                  Track financial IOUs & debts
                </p>
              </div>
              <button
                onClick={() => setIsNewLoanModalOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl shadow-sm shadow-blue-500/10 transition-all active:scale-95"
              >
                <PlusCircle size={16} />
                Add Loan
              </button>
            </div>

            <div className="grid gap-4">
              {loans.map((loan) => (
                <SwipeableItem
                  key={loan.id}
                  onDelete={() => handleDeleteLoan(loan.id)}
                  containerClassName="rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-zinc-100"
                >
                  <div className="bg-white p-6 flex flex-col justify-center hover:border-zinc-200 transition-all cursor-default h-full">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="font-bold text-zinc-900 text-base tracking-tight">
                          {loan.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase mt-1">
                          {loan.type === "borrowed"
                            ? "Debt to repay"
                            : "Receivables owed"}
                        </p>
                      </div>
                      <span
                        className={`font-bold text-sm tracking-tight ${
                          loan.type === "borrowed"
                            ? "text-red-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {formatMMK(loan.remaining)} / {formatMMK(loan.total)}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          loan.type === "borrowed"
                            ? "bg-red-500"
                            : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${
                            ((loan.total - loan.remaining) / loan.total) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </SwipeableItem>
              ))}

              {loans.length === 0 && (
                <div className="p-8 text-center text-zinc-400 text-sm">
                  No active loans. You are debt-free!
                </div>
              )}
            </div>

            {/* Modal for Add Loan */}
            {isNewLoanModalOpen && (
              <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-end justify-center p-0 z-[60]">
                <div
                  className="bg-white w-full max-w-md rounded-t-[2rem] p-6 shadow-2xl animate-slide-up border border-zinc-100 max-h-[85vh] overflow-y-auto"
                  style={{
                    paddingBottom: "max(24px, env(safe-area-inset-bottom))",
                  }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-zinc-900">
                      Add Loan / IOU
                    </h2>
                    <button
                      onClick={() => setIsNewLoanModalOpen(false)}
                      className="text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition rounded-full p-1.5"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleAddLoan} className="space-y-5 pb-10">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                        Who is this with?
                      </label>
                      <input
                        type="text"
                        value={newLoanName}
                        onChange={(e) => setNewLoanName(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-sm"
                        placeholder="e.g. John Doe, Bank Loan"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                        Type of Loan
                      </label>
                      <select
                        value={newLoanType}
                        onChange={(e) => setNewLoanType(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-sm"
                      >
                        <option value="borrowed">
                          I borrowed money (Debt)
                        </option>
                        <option value="lent">I lent money (Owes me)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                          Total Amount
                        </label>
                        <input
                          type="number"
                          value={newLoanTotal}
                          onChange={(e) => setNewLoanTotal(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-base font-bold tracking-tight"
                          placeholder="0"
                          step="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                          Remaining
                        </label>
                        <input
                          type="number"
                          value={newLoanRemaining}
                          onChange={(e) => setNewLoanRemaining(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-base font-bold tracking-tight"
                          placeholder="(Optional)"
                          step="1"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 mt-4"
                    >
                      Save Record
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (isInitializing) {
    return (
      <div className="bg-zinc-100 h-screen overflow-hidden font-sans text-zinc-900 flex justify-center">
        <div className="w-full max-w-md bg-zinc-50 h-full flex items-center justify-center border-x border-zinc-200">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-bold text-zinc-700">{syncStatus}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return <PinScreen onUnlocked={handleUnlocked} />;
  }

  return (
    <div className="bg-zinc-100 h-screen overflow-hidden font-sans text-zinc-900 flex justify-center">
      <div className="w-full max-w-md bg-zinc-50 h-full relative shadow-[0_0_40px_rgba(0,0,0,0.05)] flex flex-col border-x border-zinc-200 overflow-hidden">
        <TopBar
          title={
            activeTab === "home"
              ? "My Dashboard"
              : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
          }
          syncStatus={syncStatus}
          isError={isError}
          onSync={loadFinanceData}
        />

        {/* Dynamic padding: enough space so lists scroll past the nav + floating button */}
        <main className="flex-1 overflow-y-auto animate-fade-in hide-scrollbar pb-32">
          {renderView()}
        </main>

        {!isAddModalOpen && !isNewAccountModalOpen && !isNewLoanModalOpen && (
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* The overlapping center Action button */}
        {!isAddModalOpen && !isNewAccountModalOpen && !isNewLoanModalOpen && (
          <div className="absolute bottom-6 left-0 right-0 pointer-events-none flex justify-center z-[45]">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="pointer-events-auto w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-[0_8px_30px_rgba(37,99,235,0.4)] flex items-center justify-center transition-transform active:scale-95 border-4 border-white"
              aria-label="New transaction entry"
            >
              <Plus size={28} strokeWidth={2.5} />
            </button>
          </div>
        )}

        <AddTransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddTransaction}
          accounts={accounts}
        />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fadeIn 0.25s ease-out forwards; }
        .pb-safe { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </div>
  );
}
