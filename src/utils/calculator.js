/**
 * CLARITY ENGINE - CORE LOGIC
 * Handles mathematical scoring, AI narrative generation, and PDF export.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Calculates normalized scores (0-100) and applies risk penalties.
 */
export const calculateScores = (options, criteria, riskFactor) => {
  return options.map(option => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    criteria.forEach(criterion => {
      const score = option.scores[criterion.id] || 0;
      totalWeightedScore += (score * criterion.weight);
      totalWeight += criterion.weight;
    });

    // GUARD: Avoid divide-by-zero if weights are not yet set
    if (totalWeight === 0) return { ...option, finalScore: 0 };

    // Normalize to 100% scale
    const baseScore = (totalWeightedScore / (totalWeight * 10)) * 100;
    
    // Apply risk penalty to high-risk flagged options
    const penalty = option.isHighRisk ? (baseScore * (riskFactor / 100)) : 0;
    const finalScore = Math.max(0, baseScore - penalty);

    return { 
      ...option, 
      finalScore: parseFloat(finalScore.toFixed(1)) 
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
};

/**
 * Analyzes the results to explain the "Why" behind the top choice.
 */
export const generateAIExplanation = (winner, criteria, results) => {
  if (!winner || winner.finalScore === 0 || results.length < 2) {
    return "Insufficient data. Add at least two options and provide scores to generate a strategic analysis.";
  }

  const runnerUp = results[1];
  const margin = (winner.finalScore - runnerUp.finalScore).toFixed(1);
  
  const strengths = criteria.map(c => {
    const score = winner.scores[c.id] || 0;
    return { name: c.name, weightedScore: score * c.weight };
  }).sort((a, b) => b.weightedScore - a.weightedScore);

  const primaryStrength = strengths[0]?.name || "key metrics";

  let analysis = `Strategy Analysis: "${winner.name}" is the optimal path, leading by a margin of ${margin}%. `;
  analysis += `The decision is primarily supported by its performance in "${primaryStrength}". `;

  if (winner.isHighRisk) {
    analysis += `WARNING: This option is high risk. Ensure the ${margin}% advantage is worth the potential volatility.`;
  } else if (runnerUp.isHighRisk && !winner.isHighRisk) {
    analysis += `This is a stable choice; it outranks competition while maintaining a lower risk profile than "${runnerUp.name}".`;
  } else {
    analysis += `This represents a balanced, low-risk recommendation based on your weighted priorities.`;
  }

  return analysis;
};

/**
 * Generates and downloads a professional PDF report.
 */
export const exportToPDF = (decisionTitle, criteria, results, aiSummary) => {
  try {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleDateString();

    // 1. Header & Title
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text("CLARITY ENGINE REPORT", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${timestamp}`, 14, 30);

    // 2. Winner Card Visualization
    doc.setDrawColor(79, 70, 229); // Indigo border
    doc.setFillColor(248, 250, 252); // Slate-50 background
    doc.rect(14, 35, 182, 30, 'FD');
    
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text("TOP RECOMMENDATION:", 20, 45);
    
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text(results[0]?.name || "N/A", 20, 55);
    doc.text(`${results[0]?.finalScore || 0}%`, 175, 55, { align: "right" });

    // 3. AI Analysis Section
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("STRATEGIC ANALYSIS:", 14, 78);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(71, 85, 105); // Slate-600
    const splitText = doc.splitTextToSize(aiSummary, 180);
    doc.text(splitText, 14, 85);

    // 4. Data Table
    const tableColumn = ["Option", ...criteria.map(c => c.name), "Risk", "Score"];
    const tableRows = results.map(res => [
      res.name,
      ...criteria.map(c => res.scores[c.id] || 0),
      res.isHighRisk ? "Yes" : "No",
      `${res.finalScore}%`
    ]);

    autoTable(doc, {
      startY: 105,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 }
    });

    // 5. Save the file
    doc.save(`${decisionTitle.replace(/\s+/g, '_')}_Clarity_Report.pdf`);
  } catch (err) {
    console.error("PDF generation error:", err);
    alert("Could not generate PDF. Check if jspdf-autotable is installed correctly.");
  }
};