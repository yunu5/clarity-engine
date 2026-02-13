import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, AlertTriangle, Trophy, BrainCircuit, RotateCcw, Download } from 'lucide-react';
import { calculateScores, generateAIExplanation, exportToPDF } from './utils/calculator';
import './index.css';
import { supabase } from './supabaseClient';

export default function App() {
  // --- 1. State Management ---
  const [criteria, setCriteria] = useState(() => {
    const saved = localStorage.getItem('clarity_criteria');
    return saved ? JSON.parse(saved) : [{ id: 1, name: 'Impact', weight: 8 }];
  });

  const [options, setOptions] = useState(() => {
    const saved = localStorage.getItem('clarity_options');
    return saved ? JSON.parse(saved) : [{ id: 101, name: 'Project A', scores: { 1: 7 }, isHighRisk: false }];
  });

  const [riskFactor, setRiskFactor] = useState(() => {
    const saved = localStorage.getItem('clarity_risk');
    return saved ? JSON.parse(saved) : 15;
  });

  // Waitlist State
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  // --- 2. Persistence ---
  useEffect(() => {
    localStorage.setItem('clarity_criteria', JSON.stringify(criteria));
    localStorage.setItem('clarity_options', JSON.stringify(options));
    localStorage.setItem('clarity_risk', JSON.stringify(riskFactor));
  }, [criteria, options, riskFactor]);

  // --- 3. Calculations ---
  const results = useMemo(() => 
    calculateScores(options, criteria, riskFactor), 
    [options, criteria, riskFactor]
  );

  const winner = results[0]?.finalScore > 0 ? results[0] : null;
  const aiSummary = useMemo(() => 
    generateAIExplanation(winner, criteria, results),
    [winner, criteria, results]
  );

  // --- 4. Handlers ---
  const addCriterion = () => setCriteria([...criteria, { id: Date.now(), name: 'New Metric', weight: 5 }]);
  const addOption = () => setOptions([...options, { id: Date.now(), name: 'New Option', scores: {}, isHighRisk: false }]);
  
  const updateScore = (optId, critId, val) => {
    setOptions(options.map(opt => 
      opt.id === optId ? { ...opt, scores: { ...opt.scores, [critId]: parseInt(val) || 0 } } : opt
    ));
  };

  const deleteCriterion = (id) => {
    if (criteria.length <= 1) return alert("You need at least one criterion.");
    setCriteria(criteria.filter(c => c.id !== id));
    setOptions(options.map(opt => {
      const newScores = { ...opt.scores };
      delete newScores[id];
      return { ...opt, scores: newScores };
    }));
  };

  const deleteOption = (id) => {
    if (options.length <= 1) return alert("You need at least one option.");
    setOptions(options.filter(o => o.id !== id));
  };

  const resetData = () => {
    if(confirm("Clear all data?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleWaitlist = async (e) => {
    e.preventDefault();
    setStatus('Adding you to the circle...');
    const { error } = await supabase
      .from('waitlist')
      .insert([{ email }]);

    if (error) {
      setStatus('Error: ' + error.message);
    } else {
      setStatus('Success! You are on the list for the Pro launch.');
      setEmail('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* HEADER SECTION */}
      <header className="border-b pb-6 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Clarity Engine</h1>
          <p className="text-indigo-600 font-bold text-xs tracking-widest uppercase mt-1">
            A structured decision framework for high-stakes life choices.
          </p>
          <p className="text-slate-500 text-sm mt-2 max-w-md font-medium">
            Eliminate decision fatigue by evaluating options against weighted criteria and adjusted risk profiles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {criteria.length > 0 && (
            <button 
              onClick={() => exportToPDF("Clarity_Report", criteria, results, aiSummary)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Download size={16}/> Export PDF
            </button>
          )}
          <button onClick={resetData} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <RotateCcw size={20}/>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      {criteria.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-6 shadow-sm">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-slate-100">
            <BrainCircuit size={32} className="text-indigo-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Start your analysis</h2>
          <button onClick={addCriterion} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 flex items-center gap-2 mx-auto">
            <Plus size={20} /> Add First Criterion
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-slate-800 text-xs uppercase">Criteria Weights</h2>
                <button onClick={addCriterion} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded-lg">
                  <Plus size={20}/>
                </button>
              </div>
              {criteria.map(c => (
                <div key={c.id} className="mb-6 last:mb-0 space-y-2">
                  <div className="flex justify-between items-center">
                    <input className="font-bold text-[10px] uppercase text-slate-400 bg-transparent border-none focus:ring-0 w-2/3 p-0"
                      value={c.name} onChange={(e) => setCriteria(criteria.map(item => item.id === c.id ? {...item, name: e.target.value} : item))} />
                    <button onClick={() => deleteCriterion(c.id)} className="text-slate-200 hover:text-red-400"><Trash2 size={14}/></button>
                  </div>
                  <div className="flex items-center gap-4">
                    <input type="range" min="1" max="10" value={c.weight} onChange={(e) => setCriteria(criteria.map(item => item.id === c.id ? {...item, weight: parseInt(e.target.value)} : item))}
                      className="flex-1 h-1 bg-slate-100 rounded-lg appearance-none accent-slate-900" />
                    <span className="text-[10px] font-black text-slate-900">{c.weight}</span>
                  </div>
                </div>
              ))}
            </section>

            <section className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
              <h2 className="font-bold mb-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
                <AlertTriangle size={16} className="text-yellow-400"/> Risk Adjustment
              </h2>
              <input type="range" min="0" max="30" value={riskFactor} onChange={(e) => setRiskFactor(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none accent-yellow-400 mb-2" />
              <p className="text-[10px] text-slate-400 font-mono italic tracking-tighter">Penalty: -{riskFactor}% for High Risk</p>
            </section>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8 space-y-6">
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="p-4 font-bold text-slate-400 uppercase text-[10px]">Options</th>
                      {criteria.map(c => <th key={c.id} className="p-4 font-bold text-slate-400 uppercase text-[10px] text-center">{c.name}</th>)}
                      <th className="p-4 font-bold text-slate-400 uppercase text-[10px] text-right">Risk</th>
                      <th className="p-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {options.map(opt => (
                      <tr key={opt.id} className="group hover:bg-slate-50/50">
                        <td className="p-4">
                          <input className="font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 w-full"
                            value={opt.name} onChange={(e) => setOptions(options.map(o => o.id === opt.id ? {...o, name: e.target.value} : o))} />
                        </td>
                        {criteria.map(c => (
                          <td key={c.id} className="p-4 text-center">
                            <input type="number" min="0" max="10" value={opt.scores[c.id] || 0}
                              onChange={(e) => updateScore(opt.id, c.id, e.target.value)}
                              className="w-10 text-center font-mono text-xs bg-white border border-slate-200 rounded py-1" />
                          </td>
                        ))}
                        <td className="p-4 text-right">
                          <input type="checkbox" checked={opt.isHighRisk} onChange={(e) => setOptions(options.map(o => o.id === opt.id ? {...o, isHighRisk: e.target.checked} : o))}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                        </td>
                        <td className="p-4">
                          <button onClick={() => deleteOption(opt.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={addOption} className="w-full py-4 bg-slate-50/30 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-900 border-t border-slate-100">
                + Add Comparison Option
              </button>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-indigo-600 text-white p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between min-h-[200px]">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Top Ranked</span>
                  <h3 className="text-3xl font-black mt-2 leading-tight tracking-tighter">{winner?.name || "---"}</h3>
                </div>
                <div className="mt-8 flex items-end gap-3">
                  <span className="text-5xl font-black tracking-tighter">{winner?.finalScore || 0}%</span>
                  <span className="text-[10px] uppercase font-bold opacity-60 mb-2">Clarity Index</span>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BrainCircuit size={20} className="text-indigo-600"/>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Strategic Analysis</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic font-medium">"{aiSummary}"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Waitlist Section at the very bottom */}
      <section className="mt-16 p-10 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 text-center space-y-4">
          <h3 className="text-2xl font-black tracking-tight uppercase">Ready for the Pro upgrade?</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Join the waitlist for Cloud Sync, Advanced Medical Templates, and Unlimited PDF Exports.
          </p>
          <form onSubmit={handleWaitlist} className="max-w-md mx-auto flex gap-2 pt-4">
            <input 
              type="email" 
              required
              placeholder="Enter your professional email"
              className="flex-1 px-5 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="px-6 py-3 bg-white text-slate-900 font-bold rounded-2xl hover:bg-indigo-50 transition-all text-sm">
              Join Waitlist
            </button>
          </form>
          {status && <p className="text-xs font-bold text-indigo-400 mt-4">{status}</p>}
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-5">
          <Trophy size={200} />
        </div>
      </section>
    </div>
  );
}