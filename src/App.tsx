import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import type { User as FirebaseAuthUser, Auth } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
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
} from "lucide-react";

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

// --- Initial State ---
const initialAccounts: AccountData[] = [
  {
    id: 1,
    name: "Main Checking",
    balance: 0,
    type: "bank",
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    id: 2,
    name: "Cash Wallet",
    balance: 0,
    type: "cash",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  {
    id: 3,
    name: "PayPal",
    balance: 0,
    type: "ewallet",
    color: "text-indigo-600",
    bg: "bg-indigo-100",
  },
];

const initialTransactions: TransactionData[] = [
  {
    id: 101,
    amount: 0,
    type: "expense",
    category: "Food",
    account: "Main Checking",
    date: new Date().toISOString().split("T")[0],
    desc: "Groceries",
  },
  {
    id: 102,
    amount: 0,
    type: "income",
    category: "Salary",
    account: "Main Checking",
    date: new Date().toISOString().split("T")[0],
    desc: "Paycheck",
  },
];

const initialLoans: LoanData[] = [
  {
    id: 1,
    name: "Alice (I Owe)",
    total: 0,
    remaining: 0,
    type: "borrowed",
  },
  { id: 2, name: "Bob (Owes Me)", total: 100000, remaining: 100000, type: "lent" },
];

const getGlobalValue = (key: string): string | undefined => {
  if (typeof window !== "undefined") {
    return (window as unknown as Record<string, unknown>)[key] as
      | string
      | undefined;
  }
  return undefined;
};

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyADKcHmYUjmo7-PEd1P9Rv6sGblbeeduRc",
  authDomain: "finance-app-221bb.firebaseapp.com",
  projectId: "finance-app-221bb",
  storageBucket: "finance-app-221bb.firebasestorage.app",
  messagingSenderId: "838412317776",
  appId: "1:838412317776:web:f12144aee0d68aba428d55",
  measurementId: "G-F268X22YTR",
};

let auth: Auth | null = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;
let usingCanvasFirebase = false;

const hasUserConfig =
  firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith("AIzaSy");
const activeConfigStr = getGlobalValue("__firebase_config");
let finalConfig = firebaseConfig;

if (hasUserConfig) {
  finalConfig = firebaseConfig;
  isFirebaseConfigured = true;
} else if (activeConfigStr) {
  try {
    finalConfig = JSON.parse(activeConfigStr);
    isFirebaseConfigured = true;
    usingCanvasFirebase = true;
  } catch (error) {
    console.error("Failed to parse system Firebase configuration", error);
  }
}

if (isFirebaseConfigured) {
  try {
    const appInstance = initializeApp(finalConfig);
    auth = getAuth(appInstance);
    db = getFirestore(appInstance);
  } catch (error) {
    console.error("Initialization error, running locally:", error);
    isFirebaseConfigured = false;
  }
}

const myAppId = getGlobalValue("__app_id") || "my-personal-finance-app-v1";

const sanitizeAccounts = (accs: unknown[]) =>
  (accs as Record<string, unknown>[]).map((acc) => {
    const clean = { ...acc };
    delete clean.icon;
    return clean;
  });

// --- Formatting Helper (MMK) ---
const formatMMK = (num: number) => {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(num);
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

// --- Shared UI Components ---
const TopBar = ({
  title,
  syncStatus,
  isError,
}: {
  title: string;
  syncStatus: string;
  isError: boolean;
}) => (
  <div className="bg-zinc-50 text-zinc-900 p-5 shrink-0 flex flex-col justify-between items-start z-10">
    <div className="flex justify-between items-center w-full mt-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          {title === "My Dashboard" ? "Overview" : title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm ${
            isError
              ? "bg-red-100 text-red-600 border border-red-200"
              : syncStatus === "Cloud Synced"
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-amber-100 text-amber-700 border border-amber-200"
          }`}
        >
          {!isError && (
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                syncStatus === "Cloud Synced"
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
        activeTab === "home" ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"
      }`}
    >
      <Home size={22} className={activeTab === "home" ? "stroke-[2.5px]" : ""} />
      <span className="text-[10px] mt-1 font-semibold">Home</span>
    </button>
    <button
      onClick={() => setActiveTab("accounts")}
      className={`flex flex-col items-center transition-all ${
        activeTab === "accounts" ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"
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
        activeTab === "history" ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"
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
        activeTab === "budgets" ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"
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
  }) => void;
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

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [accounts, setAccounts] = useState<AccountData[]>(initialAccounts);
  const [transactions, setTransactions] = useState<TransactionData[]>(
    initialTransactions
  );
  const [loans, setLoans] = useState<LoanData[]>(initialLoans);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [syncStatus, setSyncStatus] = useState(
    !isFirebaseConfigured ? "Local Sandbox" : "Connecting..."
  );
  const [isError, setIsError] = useState(false);

  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState("bank");
  const [newAccBalance, setNewAccBalance] = useState("");

  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);
  const [newLoanName, setNewLoanName] = useState("");
  const [newLoanType, setNewLoanType] = useState("borrowed");
  const [newLoanTotal, setNewLoanTotal] = useState("");
  const [newLoanRemaining, setNewLoanRemaining] = useState("");

  // 1. Authentication Check
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }

    const initAuth = async () => {
      try {
        if (usingCanvasFirebase) {
          const initialAuthToken = getGlobalValue("__initial_auth_token");
          if (initialAuthToken && auth) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else if (auth) {
            await signInAnonymously(auth);
          }
        } else {
          if (auth) {
            await signInAnonymously(auth);
          }
        }
      } catch (error: unknown) {
        console.error("Auth error:", error);
        const err = error as { code?: string };
        setSyncStatus(
          err.code === "auth/operation-not-allowed"
            ? "Enable Anonymous Login!"
            : "Auth Failed"
        );
        setIsError(true);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setSyncStatus((prevStatus) => {
          if (
            prevStatus === "Enable Anonymous Login!" ||
            prevStatus === "Auth Failed"
          )
            return prevStatus;
          return "Cloud Synced";
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Database Sync Check
  useEffect(() => {
    if (!isFirebaseConfigured || !user || !db) return;

    const stateRef = doc(
      db,
      "artifacts",
      myAppId,
      "public",
      "data",
      "ledgers",
      "finance_state"
    );

    const unsubscribe = onSnapshot(
      stateRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.accounts) setAccounts(data.accounts as AccountData[]);
          if (data.transactions)
            setTransactions(data.transactions as TransactionData[]);
          if (data.loans) setLoans(data.loans as LoanData[]);
        } else {
          if (db) {
            const safeAccounts = sanitizeAccounts(initialAccounts);
            setDoc(stateRef, {
              accounts: safeAccounts,
              transactions: initialTransactions,
              loans: initialLoans,
            }).catch((err: unknown) => {
              console.error(err);
              setSyncStatus("Rules Denied (Check DB Rules)");
              setIsError(true);
            });
          }
        }
      },
      (error: unknown) => {
        console.error("Firestore error:", error);
        setSyncStatus("DB Error (Check Rules)");
        setIsError(true);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleDeleteTransaction = async (idToDelete: number) => {
    const txToDelete = transactions.find((t) => t.id === idToDelete);
    if (!txToDelete) return;

    const updatedTransactions = transactions.filter((t) => t.id !== idToDelete);
    const updatedAccounts = accounts.map((acc) => {
      if (acc.name === txToDelete.account) {
        const balanceModifier =
          txToDelete.type === "expense"
            ? txToDelete.amount
            : -txToDelete.amount;
        return { ...acc, balance: acc.balance + balanceModifier };
      }
      return acc;
    });

    setTransactions(updatedTransactions);
    setAccounts(updatedAccounts);

    if (isFirebaseConfigured && user && db && !isError) {
      const stateRef = doc(
        db,
        "artifacts",
        myAppId,
        "public",
        "data",
        "ledgers",
        "finance_state"
      );
      try {
        const safeAccounts = sanitizeAccounts(updatedAccounts);
        await setDoc(stateRef, {
          accounts: safeAccounts,
          transactions: updatedTransactions,
          loans,
        });
      } catch (error) {
        console.error("Cloud delete failure:", error);
      }
    }
  };

  const handleDeleteAccount = async (idToDelete: number) => {
    const updatedAccounts = accounts.filter((a) => a.id !== idToDelete);
    setAccounts(updatedAccounts);

    if (isFirebaseConfigured && user && db && !isError) {
      const stateRef = doc(
        db,
        "artifacts",
        myAppId,
        "public",
        "data",
        "ledgers",
        "finance_state"
      );
      try {
        const safeAccounts = sanitizeAccounts(updatedAccounts);
        await setDoc(stateRef, {
          accounts: safeAccounts,
          transactions: transactions,
          loans,
        });
      } catch (error) {
        console.error("Cloud delete failure:", error);
      }
    }
  };

  const handleDeleteLoan = async (idToDelete: number) => {
    const updatedLoans = loans.filter((l) => l.id !== idToDelete);
    setLoans(updatedLoans);

    if (isFirebaseConfigured && user && db && !isError) {
      const stateRef = doc(
        db,
        "artifacts",
        myAppId,
        "public",
        "data",
        "ledgers",
        "finance_state"
      );
      try {
        const safeAccounts = sanitizeAccounts(accounts);
        await setDoc(stateRef, {
          accounts: safeAccounts,
          transactions,
          loans: updatedLoans,
        });
      } catch (error) {
        console.error("Cloud delete failure:", error);
      }
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
    const transactionWithId: TransactionData = { ...newTx, id: Date.now() };
    const updatedTransactions = [transactionWithId, ...transactions];

    const updatedAccounts = accounts.map((acc) => {
      if (acc.name === newTx.account) {
        const balanceModifier =
          newTx.type === "expense" ? -newTx.amount : newTx.amount;
        return { ...acc, balance: acc.balance + balanceModifier };
      }
      return acc;
    });

    setTransactions(updatedTransactions);
    setAccounts(updatedAccounts);

    if (isFirebaseConfigured && user && db && !isError) {
      const stateRef = doc(
        db,
        "artifacts",
        myAppId,
        "public",
        "data",
        "ledgers",
        "finance_state"
      );
      try {
        const safeAccounts = sanitizeAccounts(updatedAccounts);
        await setDoc(stateRef, {
          accounts: safeAccounts,
          transactions: updatedTransactions,
          loans,
        });
        setSyncStatus("Cloud Synced");
        setIsError(false);
      } catch (error: unknown) {
        console.error("Cloud persistence failure:", error);
        setSyncStatus("Failed to Save");
        setIsError(true);
      }
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccBalance || isNaN(parseFloat(newAccBalance)))
      return;

    let color = "text-blue-600";
    let bg = "bg-blue-100";

    if (newAccType === "cash") {
      color = "text-emerald-600";
      bg = "bg-emerald-100";
    } else if (newAccType === "ewallet") {
      color = "text-indigo-600";
      bg = "bg-indigo-100";
    }

    const createdAccount: AccountData = {
      id: Date.now(),
      name: newAccName,
      balance: parseFloat(newAccBalance),
      type: newAccType,
      color,
      bg,
    };

    const updatedAccounts = [...accounts, createdAccount];
    setAccounts(updatedAccounts);

    setNewAccName("");
    setNewAccBalance("");
    setIsNewAccountModalOpen(false);

    if (isFirebaseConfigured && user && db && !isError) {
      const stateRef = doc(
        db,
        "artifacts",
        myAppId,
        "public",
        "data",
        "ledgers",
        "finance_state"
      );
      try {
        const safeAccounts = sanitizeAccounts(updatedAccounts);
        await setDoc(stateRef, {
          accounts: safeAccounts,
          transactions: transactions,
          loans,
        });
      } catch (error: unknown) {
        console.error("Cloud save failure:", error);
      }
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

    const newLoan: LoanData = {
      id: Date.now(),
      name: newLoanName,
      total,
      remaining,
      type: newLoanType,
    };

    const updatedLoans = [...loans, newLoan];
    setLoans(updatedLoans);

    setNewLoanName("");
    setNewLoanTotal("");
    setNewLoanRemaining("");
    setIsNewLoanModalOpen(false);

    if (isFirebaseConfigured && user && db && !isError) {
      const stateRef = doc(
        db,
        "artifacts",
        myAppId,
        "public",
        "data",
        "ledgers",
        "finance_state"
      );
      try {
        const safeAccounts = sanitizeAccounts(accounts);
        await setDoc(stateRef, {
          accounts: safeAccounts,
          transactions,
          loans: updatedLoans,
        });
      } catch (error: unknown) {
        console.error("Cloud save failure:", error);
      }
    }
  };

  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0
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
                {formatMMK(totalBalance)} <span className="text-2xl font-semibold opacity-80">MMK</span>
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
                <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs text-red-800 space-y-1">
                  <p className="font-bold">Sync Error: {syncStatus}</p>
                  <p className="text-red-700/90 leading-relaxed">
                    Ensure you enabled Anonymous Login in the Auth tab.
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
                          loan.type === "borrowed" ? "bg-red-500" : "bg-emerald-500"
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
                        <option value="borrowed">I borrowed money (Debt)</option>
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