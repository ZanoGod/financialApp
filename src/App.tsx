import React, { useState } from 'react';
import { 
  Home, 
  PieChart, 
  Wallet, 
  ArrowRightLeft, 
  Plus, 
  Landmark, 
  Banknote, 
  CreditCard,
  User,
  TrendingUp,
  TrendingDown,
  X,
  History,
  Calendar,
  CheckCircle2
} from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// --- Mock Data ---
const initialAccounts = [
  { id: 1, name: 'Main Checking', balance: 2450.00, type: 'bank', color: 'bg-blue-600' },
  { id: 2, name: 'Savings', balance: 8200.00, type: 'bank', color: 'bg-indigo-600' },
  { id: 3, name: 'Cash Wallet', balance: 150.00, type: 'cash', color: 'bg-green-500' },
  { id: 4, name: 'Credit Card', balance: -450.00, type: 'credit', color: 'bg-red-500' },
];

const initialTransactions = [
  { id: 1, desc: 'Grocery Store', amount: -85.50, category: 'Food', date: 'Today', account: 'Main Checking', type: 'expense' },
  { id: 2, desc: 'Salary Deposit', amount: 3200.00, category: 'Income', date: 'Yesterday', account: 'Main Checking', type: 'income' },
  { id: 3, desc: 'Coffee Shop', amount: -4.50, category: 'Food', date: 'Yesterday', account: 'Cash Wallet', type: 'expense' },
  { id: 4, desc: 'Transfer to Savings', amount: -200.00, category: 'Transfer', date: '12 Oct', account: 'Main Checking', type: 'transfer' },
];

const mockLoans = [
  { id: 1, name: 'Alice (I Owe)', total: 500, remaining: 200, type: 'borrowed' },
  { id: 2, name: 'Bob (Owes Me)', total: 100, remaining: 100, type: 'lent' }
];

const TopBar = ({ title }) => (
  <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4 flex justify-between items-center border-b border-gray-100">
    <h1 className="text-xl font-bold text-gray-800">{title}</h1>
    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
      <User size={18} className="text-gray-600" />
    </div>
  </div>
);

// --- Views ---

const DashboardView = ({ accounts, transactions }) => {
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <TopBar title="Overview" />
      
      {/* Total Balance Card */}
      <div className="px-6 py-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-blue-100 font-medium mb-1">Total Net Balance</p>
          <h2 className="text-4xl font-bold tracking-tight mb-6">{formatCurrency(totalBalance)}</h2>
          
          <div className="flex gap-4">
            <div className="bg-white/20 rounded-2xl p-3 flex-1 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-sm text-blue-50 mb-1">
                <TrendingUp size={16} className="text-green-300"/> Income
              </div>
              <p className="font-semibold">+ $3,200.00</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-3 flex-1 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-sm text-blue-50 mb-1">
                <TrendingDown size={16} className="text-red-300"/> Expenses
              </div>
              <p className="font-semibold">- $850.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Accounts Scroll */}
      <div className="px-6 mb-6">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold text-gray-800">My Accounts</h3>
          <button className="text-sm text-blue-600 font-medium hover:underline">See All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
          {accounts.map((account) => (
            <div key={account.id} className="min-w-[140px] bg-white border border-gray-100 rounded-2xl p-4 shadow-sm snap-start shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 text-white ${account.color}`}>
                {account.type === 'bank' ? <Landmark size={20} /> : account.type === 'cash' ? <Banknote size={20} /> : <CreditCard size={20} />}
              </div>
              <p className="text-xs text-gray-500 truncate">{account.name}</p>
              <p className="font-bold text-gray-800">{formatCurrency(account.balance)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-6">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold text-gray-800">Recent Transactions</h3>
        </div>
        <div className="bg-white border border-gray-100 rounded-3xl p-2 shadow-sm">
          {transactions.slice(0, 4).map((tx, index) => (
            <div key={tx.id} className={`flex items-center justify-between p-4 ${index !== 3 ? 'border-b border-gray-50' : ''}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'income' ? 'bg-green-100 text-green-600' : 
                  tx.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tx.type === 'income' ? <TrendingUp size={18} /> : 
                   tx.type === 'expense' ? <TrendingDown size={18} /> : <ArrowRightLeft size={18} />}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{tx.desc}</p>
                  <p className="text-xs text-gray-500">{tx.account}</p>
                </div>
              </div>
              <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-800'}`}>
                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AccountsView = ({ accounts }) => {
  return (
    <div className="pb-24 animate-in fade-in duration-300">
      <TopBar title="Accounts & Balances" />
      
      <div className="p-6 space-y-6">
        {/* Bank Accounts Section */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Landmark size={16} /> Bank Accounts
          </h3>
          <div className="space-y-3">
            {accounts.filter(a => a.type === 'bank').map(account => (
              <div key={account.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${account.color}`}>
                    <Landmark size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{account.name}</p>
                    <p className="text-xs text-gray-500">Virtual Ledger</p>
                  </div>
                </div>
                <p className="font-bold text-lg">{formatCurrency(account.balance)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cash & Wallets Section */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2 mt-8">
            <Wallet size={16} /> Cash & E-Wallets
          </h3>
          <div className="space-y-3">
            {accounts.filter(a => a.type !== 'bank').map(account => (
              <div key={account.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${account.color}`}>
                    {account.type === 'cash' ? <Banknote size={20} /> : <CreditCard size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{account.name}</p>
                    <p className="text-xs text-gray-500">Manual Entry</p>
                  </div>
                </div>
                <p className={`font-bold text-lg ${account.balance < 0 ? 'text-red-500' : ''}`}>
                  {formatCurrency(account.balance)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const HistoryView = ({ transactions }) => {
  return (
    <div className="pb-24 animate-in fade-in duration-300">
      <TopBar title="Transaction History" />
      <div className="p-6">
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  tx.type === 'income' ? 'bg-green-100 text-green-600' : 
                  tx.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {tx.type === 'income' ? <TrendingUp size={24} /> : 
                   tx.type === 'expense' ? <TrendingDown size={24} /> : <ArrowRightLeft size={24} />}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{tx.desc}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span className="flex items-center gap-1"><Calendar size={12}/> {tx.date}</span>
                    <span>•</span>
                    <span>{tx.account}</span>
                  </div>
                </div>
              </div>
              <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-800'}`}>
                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BudgetsView = () => {
  return (
    <div className="pb-24 animate-in fade-in duration-300">
      <TopBar title="Budgets & Loans" />
      <div className="p-6 space-y-6">
        {/* Budgets Progress */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Monthly Spending</h3>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
            <div className="bg-blue-600 h-3 rounded-full w-[75%]"></div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-800">$1,500 Spent</span>
            <span className="text-gray-500">$2,000 Budget</span>
          </div>
        </div>

        {/* Loans & Debts */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 mt-4">Active Loans & Debts</h3>
          <div className="space-y-4">
            {mockLoans.map(loan => (
              <div key={loan.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-800">{loan.name}</span>
                  <span className={`font-bold ${loan.type === 'borrowed' ? 'text-red-500' : 'text-green-500'}`}>
                    {loan.type === 'borrowed' ? '-' : '+'}{formatCurrency(loan.remaining)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                  <div className={`h-2 rounded-full ${loan.type === 'borrowed' ? 'bg-red-400 w-[60%]' : 'bg-green-400 w-[0%]'}`}></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>Paid: {formatCurrency(loan.total - loan.remaining)}</span>
                  <span>Total: {formatCurrency(loan.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const AddTransactionModal = ({ isOpen, onClose, onAdd, accounts }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [accountName, setAccountName] = useState(accounts[0]?.name || '');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!amount || !desc) return;
    const numAmount = parseFloat(amount);
    const finalAmount = type === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);
     
    onAdd({
      desc,
      amount: finalAmount,
      category: type === 'expense' ? 'Misc' : 'Income',
      date: 'Just Now',
      account: accountName,
      type
    });
    
    setAmount('');
    setDesc('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 animate-in slide-in-from-bottom-full duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">New Transaction</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"><X size={20}/></button>
        </div>
        
        {/* Type Selector Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
          <button onClick={() => setType('expense')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}>Expense</button>
          <button onClick={() => setType('income')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}>Income</button>
        </div>

        {/* Input Fields */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-10 pr-4 text-2xl font-bold text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
            <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="E.g., Groceries, Salary, Coffee" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 font-medium text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Account</label>
            <select value={accountName} onChange={(e) => setAccountName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 font-medium text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none cursor-pointer">
              {accounts.map(acc => (
                <option key={acc.id} value={acc.name}>{acc.name} (Current: {formatCurrency(acc.balance)})</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30">
          <CheckCircle2 size={20} /> Save Transaction
        </button>
      </div>
    </div>
  );
};

const AddTransactionFab = ({ onClick, isVisible }) => (
  <button 
    onClick={onClick} 
    className={`absolute bottom-6 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/40 hover:bg-blue-700 active:scale-95 transition-all duration-300 z-50 border-4 border-gray-50 ${
      isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
    }`}
  >
    <Plus size={28} />
  </button>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [accounts, setAccounts] = useState(initialAccounts);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddTransaction = (newTx) => {
    // 1. Add new transaction to the top of the history list
    const transactionWithId = { ...newTx, id: Date.now() };
    setTransactions([transactionWithId, ...transactions]);

    // 2. Instantly update the affected Virtual Bank/Wallet Account Balance
    setAccounts(accounts.map(acc => {
      if (acc.name === newTx.account) {
        return { ...acc, balance: acc.balance + newTx.amount };
      }
      return acc;
    }));
  };

  const renderView = () => {
    switch (activeTab) {
      case 'home': return <DashboardView accounts={accounts} transactions={transactions} />;
      case 'accounts': return <AccountsView accounts={accounts} />;
      case 'history': return <HistoryView transactions={transactions} />;
      case 'budgets': return <BudgetsView />;
      default: return <DashboardView accounts={accounts} transactions={transactions} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 relative max-w-md mx-auto shadow-2xl overflow-hidden border-x border-gray-200">
      
      {/* Main View Area */}
      <main className="h-screen overflow-y-auto hide-scrollbar">
        {renderView()}
      </main>

      {/* Slide-up Add Transaction Modal */}
      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddTransaction}
        accounts={accounts}
      />

      {/* Floating Action Button */}
      <AddTransactionFab 
        onClick={() => setIsAddModalOpen(true)} 
        isVisible={!isAddModalOpen} 
      />

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-4 pb-8 flex justify-between items-center z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Home size={24} className={activeTab === 'home' ? 'fill-blue-50' : ''} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('accounts')}
          className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'accounts' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'} mr-8`}
        >
          <Wallet size={24} className={activeTab === 'accounts' ? 'fill-blue-50' : ''} />
          <span className="text-[10px] font-medium">Accounts</span>
        </button>

        {/* Spacer for Floating Button */}
        <div className="w-8"></div>

        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'history' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'} ml-8`}
        >
          <History size={24} className={activeTab === 'history' ? 'fill-blue-50' : ''} />
          <span className="text-[10px] font-medium">History</span>
        </button>

        <button 
          onClick={() => setActiveTab('budgets')}
          className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'budgets' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <PieChart size={24} className={activeTab === 'budgets' ? 'fill-blue-50' : ''} />
          <span className="text-[10px] font-medium">Budgets</span>
        </button>
      </nav>

      {/* Hide Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}