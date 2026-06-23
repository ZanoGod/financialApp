import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import type {
  User as FirebaseAuthUser,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
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
  AlertTriangle
} from 'lucide-react';

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

// Removed 'icon' parameter from data state so Firestore doesn't crash on non-serializable objects
const initialAccounts: AccountData[] = [
  { id: 1, name: 'Main Checking', balance: 2500, type: 'bank', color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 2, name: 'Cash Wallet', balance: 350, type: 'cash', color: 'text-green-500', bg: 'bg-green-50' },
  { id: 3, name: 'PayPal', balance: 150, type: 'ewallet', color: 'text-indigo-500', bg: 'bg-indigo-50' }
];

const initialTransactions: TransactionData[] = [
  { id: 101, amount: 50, type: 'expense', category: 'Food', account: 'Main Checking', date: new Date().toISOString().split('T')[0], desc: 'Groceries' },
  { id: 102, amount: 1500, type: 'income', category: 'Salary', account: 'Main Checking', date: new Date().toISOString().split('T')[0], desc: 'Paycheck' }
];

const mockLoans = [
  { id: 1, name: 'Alice (I Owe)', total: 500, remaining: 200, type: 'borrowed' },
  { id: 2, name: 'Bob (Owes Me)', total: 100, remaining: 100, type: 'lent' }
];

const getGlobalValue = (key: string): string | undefined => {
  if (typeof window !== 'undefined') {
    return (window as unknown as Record<string, unknown>)[key] as string | undefined;
  }
  return undefined;
};

// ---> YOUR FIREBASE CONFIGURATION <---
const firebaseConfig = {
  apiKey: "AIzaSyADKcHmYUjmo7-PEd1P9Rv6sGblbeeduRc",
  authDomain: "finance-app-221bb.firebaseapp.com",
  projectId: "finance-app-221bb",
  storageBucket: "finance-app-221bb.firebasestorage.app",
  messagingSenderId: "838412317776",
  appId: "1:838412317776:web:f12144aee0d68aba428d55",
  measurementId: "G-F268X22YTR"
};

let auth: Auth | null = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;
let usingCanvasFirebase = false;

// Check if you've provided valid custom API keys
const hasUserConfig = firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith("AIzaSy");
const activeConfigStr = getGlobalValue('__firebase_config');
let finalConfig = firebaseConfig;

// Ensure your custom configuration overrides the Canvas defaults
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

const myAppId = getGlobalValue('__app_id') || 'my-personal-finance-app-v1';

// Safety wrapper to ensure functions/icons are stripped before saving
const sanitizeAccounts = (accs: unknown[]) => (accs as Record<string, unknown>[]).map(acc => {
  const clean = { ...acc };
  delete clean.icon; 
  return clean;
});

const TopBar = ({ title, syncStatus, isError }: { title: string, syncStatus: string, isError: boolean }) => (
  <div className="bg-slate-50 text-slate-900 p-5 sticky top-0 z-10 flex flex-col justify-between items-start gap-2">
    <div className="flex justify-between items-center w-full mt-2">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title === 'My Dashboard' ? 'Overview' : title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm ${
          isError ? 'bg-red-100 text-red-600 border border-red-200' : 
          syncStatus === 'Cloud Synced' ? 'bg-green-100 text-green-700 border border-green-200' : 
          'bg-amber-100 text-amber-700 border border-amber-200'
        }`}>
          {!isError && <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'Cloud Synced' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></span>}
          {isError && <AlertTriangle size={12} className="text-red-500" />}
          {syncStatus}
        </div>
      </div>
    </div>
  </div>
);

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => (
  <div className="bg-white border-t border-slate-200 fixed bottom-0 w-full max-w-md flex justify-between items-center px-6 py-3 z-20 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
    <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center transition-all ${activeTab === 'home' ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
      <Home size={22} className={activeTab === 'home' ? 'stroke-[2.5px]' : ''} />
      <span className="text-[10px] mt-1 font-semibold">Home</span>
    </button>
    <button onClick={() => setActiveTab('accounts')} className={`flex flex-col items-center transition-all ${activeTab === 'accounts' ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
      <CreditCard size={22} className={activeTab === 'accounts' ? 'stroke-[2.5px]' : ''} />
      <span className="text-[10px] mt-1 font-semibold">Accounts</span>
    </button>
    <div className="w-12"></div>
    <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center transition-all ${activeTab === 'history' ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
      <History size={22} className={activeTab === 'history' ? 'stroke-[2.5px]' : ''} />
      <span className="text-[10px] mt-1 font-semibold">History</span>
    </button>
    <button onClick={() => setActiveTab('budgets')} className={`flex flex-col items-center transition-all ${activeTab === 'budgets' ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
      <PieChart size={22} className={activeTab === 'budgets' ? 'stroke-[2.5px]' : ''} />
      <span className="text-[10px] mt-1 font-semibold">Loans</span>
    </button>
  </div>
);

const AddTransactionModal = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  accounts 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAdd: (tx: { amount: number; type: string; desc: string; account: string; date: string; category: string }) => void; 
  accounts: AccountData[]; 
}) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [account, setAccount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    const finalAccount = account || (accounts.length > 0 ? accounts[0].name : '');

    onAdd({
      amount: parseFloat(amount),
      type,
      desc,
      account: finalAccount,
      date: new Date().toISOString().split('T')[0],
      category: type === 'expense' ? 'General' : 'Income'
    });
    
    setAmount('');
    setDesc('');
    setAccount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-2xl p-6 shadow-2xl animate-slide-up border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">New Transaction</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 transition rounded-full p-1.5">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
          <button 
            type="button"
            className={`flex-1 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide transition-all ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
            onClick={() => setType('expense')}
          >
            Expense
          </button>
          <button 
            type="button"
            className={`flex-1 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide transition-all ${type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}
            onClick={() => setType('income')}
          >
            Income
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-medium">$</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-9 pr-4 text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description / Notes</label>
            <input 
              type="text" 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
              placeholder="e.g. Rice, electric bill, dinner"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bank or Wallet Account</label>
            <select 
              value={account || (accounts.length > 0 ? accounts[0].name : '')}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
            >
              {accounts.map((acc: AccountData) => (
                <option key={acc.id} value={acc.name}>
                  {acc.name} (${acc.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className={`w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide mt-4 shadow-lg transition-all active:scale-95 ${type === 'expense' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-green-500 hover:bg-green-600 shadow-green-500/20'}`}
          >
            Log This {type === 'expense' ? 'Expense' : 'Income'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [accounts, setAccounts] = useState<AccountData[]>(initialAccounts);
  const [transactions, setTransactions] = useState<TransactionData[]>(initialTransactions);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [syncStatus, setSyncStatus] = useState(!isFirebaseConfigured ? 'Local Sandbox' : 'Connecting...');
  const [isError, setIsError] = useState(false);

  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState('bank');
  const [newAccBalance, setNewAccBalance] = useState('');

  // 1. Authentication Check
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }

    const initAuth = async () => {
      try {
        if (usingCanvasFirebase) {
          const initialAuthToken = getGlobalValue('__initial_auth_token');
          if (initialAuthToken && auth) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else if (auth) {
            await signInAnonymously(auth);
          }
        } else {
          // If you pasted your config, we exclusively use your Anon Auth setup!
          if (auth) {
            await signInAnonymously(auth);
          }
        }
      } catch (error: unknown) {
        console.error("Auth error:", error);
        const err = error as { code?: string };
        setSyncStatus(err.code === 'auth/operation-not-allowed' ? 'Enable Anonymous Login!' : 'Auth Failed');
        setIsError(true);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setSyncStatus(prevStatus => {
          if (prevStatus === 'Enable Anonymous Login!' || prevStatus === 'Auth Failed') return prevStatus;
          return 'Cloud Synced';
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Database Sync Check (UPDATED FOR SHARED CROSS-DEVICE SYNC)
  useEffect(() => {
    if (!isFirebaseConfigured || !user || !db) return;
    
    // Changing from private user path to a shared "public" ledger path
    const stateRef = doc(db, 'artifacts', myAppId, 'public', 'data', 'ledgers', 'finance_state');
    
    const unsubscribe = onSnapshot(stateRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.accounts) setAccounts(data.accounts as AccountData[]);
        if (data.transactions) setTransactions(data.transactions as TransactionData[]);
      } else {
        if (db) {
          // Send sanitized array
          const safeAccounts = sanitizeAccounts(initialAccounts);
          setDoc(stateRef, { accounts: safeAccounts, transactions: initialTransactions })
            .catch((err: unknown) => {
              console.error(err);
              setSyncStatus('Rules Denied (Check DB Rules)');
              setIsError(true);
            });
        }
      }
    }, (error: unknown) => {
      console.error("Firestore error:", error);
      setSyncStatus('DB Error (Check Rules)');
      setIsError(true);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddTransaction = async (newTx: { amount: number; type: string; desc: string; account: string; date: string; category: string }) => {
    const transactionWithId: TransactionData = { ...newTx, id: Date.now() };
    const updatedTransactions = [transactionWithId, ...transactions];

    const updatedAccounts = accounts.map(acc => {
      if (acc.name === newTx.account) {
        const balanceModifier = newTx.type === 'expense' ? -newTx.amount : newTx.amount;
        return { ...acc, balance: acc.balance + balanceModifier };
      }
      return acc;
    });

    setTransactions(updatedTransactions);
    setAccounts(updatedAccounts);

    if (isFirebaseConfigured && user && db && !isError) {
      // Changed to shared "public" ledger path
      const stateRef = doc(db, 'artifacts', myAppId, 'public', 'data', 'ledgers', 'finance_state');
      try {
        const safeAccounts = sanitizeAccounts(updatedAccounts);
        await setDoc(stateRef, {
          accounts: safeAccounts,
          transactions: updatedTransactions
        });
        setSyncStatus('Cloud Synced');
        setIsError(false);
      } catch (error: unknown) {
        console.error("Cloud persistence failure:", error);
        setSyncStatus('Failed to Save');
        setIsError(true);
      }
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccBalance || isNaN(parseFloat(newAccBalance))) return;

    let color = 'text-blue-500';
    let bg = 'bg-blue-50';

    if (newAccType === 'cash') {
      color = 'text-green-500'; bg = 'bg-green-50';
    } else if (newAccType === 'ewallet') {
      color = 'text-indigo-500'; bg = 'bg-indigo-50';
    }

    const createdAccount: AccountData = {
      id: Date.now(), name: newAccName, balance: parseFloat(newAccBalance), type: newAccType, color, bg
    };

    const updatedAccounts = [...accounts, createdAccount];
    setAccounts(updatedAccounts);

    if (isFirebaseConfigured && user && db && !isError) {
      // Changed to shared "public" ledger path
      const stateRef = doc(db, 'artifacts', myAppId, 'public', 'data', 'ledgers', 'finance_state');
      try {
        const safeAccounts = sanitizeAccounts(updatedAccounts);
        await setDoc(stateRef, { accounts: safeAccounts, transactions: transactions });
      } catch (error: unknown) {
        console.error("Cloud save failure:", error);
      }
    }

    setNewAccName(''); setNewAccBalance(''); setIsNewAccountModalOpen(false);
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const calculatedIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const calculatedExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8">
            {/* Main Blue Gradient Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] p-6 text-white shadow-lg shadow-blue-500/30 relative overflow-hidden mx-1">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
              <p className="text-blue-100 text-sm font-semibold tracking-wide mb-1">Total Net Balance</p>
              <h2 className="text-4xl font-extrabold tracking-tight mb-8">
                ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-1.5 mb-1 text-blue-100 text-[11px] uppercase font-bold tracking-wider">
                    <TrendingUp size={14} className="text-green-300" /> Income
                  </div>
                  <p className="text-xl font-bold text-white">+ ${calculatedIncome.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-1.5 mb-1 text-blue-100 text-[11px] uppercase font-bold tracking-wider">
                    <TrendingDown size={14} className="text-red-300" /> Expenses
                  </div>
                  <p className="text-xl font-bold text-white">- ${calculatedExpense.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {isError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-start mx-1">
                <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs text-red-800 space-y-1">
                  <p className="font-bold">Sync Error: {syncStatus}</p>
                  <p className="text-red-700/90 leading-relaxed">Ensure you enabled Anonymous Login in the Auth tab.</p>
                </div>
              </div>
            )}

            {/* My Accounts Horizontal Scroll */}
            <div>
              <div className="flex justify-between items-end mb-4 px-1">
                <h3 className="text-lg font-bold text-slate-900">My Accounts</h3>
                <button onClick={() => setActiveTab('accounts')} className="text-sm text-blue-600 font-semibold hover:underline">
                  See All
                </button>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 snap-x hide-scrollbar">
                {accounts.map(acc => {
                  let IconComponent = Landmark;
                  if (acc.type === 'cash') IconComponent = Banknote;
                  if (acc.type === 'ewallet') IconComponent = Wallet;

                  return (
                    <div 
                      key={acc.id} 
                      className="min-w-[140px] bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 snap-start shrink-0 flex flex-col justify-between"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${acc.bg || 'bg-blue-50'} ${acc.color || 'text-blue-500'}`}>
                        <IconComponent size={22} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1 truncate">{acc.name}</p>
                        <p className="text-lg font-bold text-slate-900">${acc.balance.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="px-1">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
                <button onClick={() => setActiveTab('history')} className="text-sm text-blue-600 font-semibold hover:underline">
                  See All
                </button>
              </div>
              <div className="bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                {transactions.slice(0, 4).map((tx, index) => (
                  <div key={tx.id} className={`p-4 flex items-center justify-between hover:bg-slate-50/50 transition duration-150 ${index !== 0 ? 'border-t border-slate-50' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                        {tx.type === 'expense' ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-950 truncate">{tx.desc}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{tx.account}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm shrink-0 pl-2 ${tx.type === 'expense' ? 'text-slate-900' : 'text-green-600'}`}>
                      {tx.type === 'expense' ? '-' : '+'}${tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                
                {transactions.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No transactions entered yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'accounts':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">My Accounts</h2>
                <p className="text-slate-500 text-xs mt-0.5">Manage bank balances & wallets</p>
              </div>
              <button 
                onClick={() => setIsNewAccountModalOpen(true)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm shadow-blue-500/10 transition-all active:scale-95"
              >
                <PlusCircle size={14} />
                Add Account
              </button>
            </div>
            
            <div className="space-y-3">
              {accounts.map(acc => {
                let IconComponent = Landmark;
                if (acc.type === 'cash') IconComponent = Banknote;
                if (acc.type === 'ewallet') IconComponent = Wallet;

                return (
                  <div 
                    key={acc.id} 
                    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-slate-200 transition-all cursor-default"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${acc.bg || 'bg-slate-50'} ${acc.color || 'text-slate-600'}`}>
                        <IconComponent size={22} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{acc.name}</p>
                        <p className="text-[10px] text-slate-400 capitalize font-medium tracking-wide">{acc.type} account</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-extrabold text-slate-950">${acc.balance.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {isNewAccountModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
                <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-2xl p-6 shadow-2xl animate-slide-up border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Add Account Ledger</h2>
                    <button onClick={() => setIsNewAccountModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 transition rounded-full p-1.5">
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleAddAccount} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Account Label</label>
                      <input type="text" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-sm" placeholder="e.g. KBZ Bank, Wallet Cash" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Initial Balance</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                        <input type="number" value={newAccBalance} onChange={(e) => setNewAccBalance(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-8 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-sm font-bold" placeholder="0.00" step="0.01" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Account Classification</label>
                      <select value={newAccType} onChange={(e) => setNewAccType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-sm">
                        <option value="bank">Traditional Banking Account</option>
                        <option value="cash">External Physical Cash</option>
                        <option value="ewallet">Electronic Wallet (Paypal, Venmo)</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 mt-4">
                      Create Ledger Card
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Ledger History</h2>
              <p className="text-slate-500 text-xs mt-0.5">Filterable historic item lists</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                      {tx.type === 'expense' ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{tx.desc}</p>
                      <p className="text-[11px] text-slate-500 truncate">{tx.account} • {tx.date}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm shrink-0 pl-2 ${tx.type === 'expense' ? 'text-slate-900' : 'text-green-600'}`}>
                    {tx.type === 'expense' ? '-' : '+'}${tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
              
              {transactions.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">No entries found.</div>
              )}
            </div>
          </div>
        );

      case 'budgets':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Loans & Borrowing</h2>
              <p className="text-slate-500 text-xs mt-0.5">Track financial IOUs & dynamic loans</p>
            </div>

            <div className="grid gap-3">
              {mockLoans.map(loan => (
                <div key={loan.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{loan.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                        {loan.type === 'borrowed' ? 'Debt to repay' : 'Receivables owed'}
                      </p>
                    </div>
                    <span className={`font-bold text-sm ${loan.type === 'borrowed' ? 'text-red-500' : 'text-green-500'}`}>
                      ${loan.remaining} / ${loan.total}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${loan.type === 'borrowed' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${((loan.total - loan.remaining) / loan.total) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 flex justify-center pb-24">
      <div className="w-full max-w-md bg-slate-50 min-h-screen relative shadow-2xl flex flex-col pb-10 border-x border-slate-200/50">
        
        <TopBar 
          title={activeTab === 'home' ? 'My Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} 
          syncStatus={syncStatus}
          isError={isError}
        />
        
        <main className="p-4 flex-1 overflow-y-auto animate-fade-in">
          {renderView()}
        </main>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl shadow-blue-500/30 flex items-center justify-center z-30 transition-all duration-300 ease-in-out border-4 border-slate-50 ${
            !isAddModalOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
          }`}
          aria-label="New transaction entry"
        >
          <Plus size={28} />
        </button>

        <AddTransactionModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onAdd={handleAddTransaction}
          accounts={accounts}
        />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fadeIn 0.25s ease-out forwards; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}