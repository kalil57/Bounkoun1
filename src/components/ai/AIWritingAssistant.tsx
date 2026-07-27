import React, { useState } from 'react';
import { Sparkles, Bot, Check, ArrowRight, X, ShieldAlert, FileSearch, Lightbulb, RefreshCw, Send } from 'lucide-react';

interface AIWritingAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertText: (text: string) => void;
  selectedText?: string;
}

export const AIWritingAssistant: React.FC<AIWritingAssistantProps> = ({
  isOpen,
  onClose,
  onInsertText,
  selectedText = ''
}) => {
  const [activeTab, setActiveTab] = useState<'draft' | 'critique' | 'paraphrase' | 'ask'>('critique');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (mode: 'draft' | 'critique' | 'paraphrase' | 'ask') => {
    setLoading(true);
    setResult(null);

    // Simulate intelligent academic response or call backend / Gemini
    setTimeout(() => {
      setLoading(false);
      if (mode === 'critique') {
        setResult(`### Academic Research Critique & Literature Alignment

**1. Structural & Conceptual Strengths:**
- The economic dilemma regarding Guinea's mineral endowments vs. local economic integration is clearly articulated.
- Addison et al. (2024) provides strong theoretical backing regarding the "enclave economy" effect in extractive industries.

**2. Key Critique & Suggested Enhancements:**
- **Empirical Grounding:** Include specific macroeconomic figures (e.g., FDI growth percentages vs. local mining employment rates in Guinea between 2018–2024).
- **Causal Connection:** Deepen the analysis on institutional bottlenecks (e.g., local content regulations, infrastructure deficits).
- **Citation Precision:** Integrate Camara & Diallo (2022) to support arguments regarding regional labor spillovers.`);
      } else if (mode === 'paraphrase') {
        setResult(`Guinea holds some of the world's most significant bauxite deposits; however, converting these immense natural resources into sustained, broad-based employment remains a structural socioeconomic challenge. Although Foreign Direct Investment (FDI) serves as the primary capital catalyst for the mining sector, anticipated labor market benefits are frequently constrained by institutional frictions and resource enclave dynamics (Addison et al., 2024; World Bank, 2023).`);
      } else if (mode === 'draft') {
        setResult(`To resolve the persistent disconnect between foreign capital inflows and domestic employment creation, Guinean industrial policy must prioritize strategic local content frameworks. Enclave developments in resource-rich nations tend to remain isolated from local supply chains unless flanked by mandatory skill-transfer incentives and regional infrastructure networks (World Bank, 2023). Consequently, policy interventions should aim to transform foreign direct investment into integrated backward and forward linkages within the domestic workforce.`);
      } else {
        setResult(`Bounkoun Academic Assistant:

Based on Guinean economic literature, foreign capital in the bauxite corridor produces low labor intensity due to mechanized extraction methods. To strengthen this section of your paper, consider comparing Guinea's local content laws (2014 Mining Code) with those of Ghana or Botswana.`);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#FAF8F5] border-l border-[#E5DEC9] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-[#F3ECE0] border-b border-[#E5DEC9] flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#3D352E]">
          <div className="p-1.5 bg-[#8C7A6B] text-white rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-sm leading-tight">Bounkoun AI Co-Author</h2>
            <p className="text-[11px] text-[#756C63]">Academic Writing & Research Critic</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-md text-[#8C7A6B] hover:text-[#1A1817] hover:bg-[#E8DFD1] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-4 border-b border-[#E5DEC9] bg-[#FAF8F5] p-1 gap-1">
        <button
          onClick={() => { setActiveTab('critique'); handleGenerate('critique'); }}
          className={`py-2 px-1 text-[11px] font-medium rounded-lg flex flex-col items-center gap-1 transition-all ${
            activeTab === 'critique'
              ? 'bg-white text-[#1A1817] border border-[#DCD3C1] shadow-xs font-semibold'
              : 'text-[#756C63] hover:bg-[#F3ECE0]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#8C7A6B]" />
          Critique
        </button>
        <button
          onClick={() => { setActiveTab('paraphrase'); handleGenerate('paraphrase'); }}
          className={`py-2 px-1 text-[11px] font-medium rounded-lg flex flex-col items-center gap-1 transition-all ${
            activeTab === 'paraphrase'
              ? 'bg-white text-[#1A1817] border border-[#DCD3C1] shadow-xs font-semibold'
              : 'text-[#756C63] hover:bg-[#F3ECE0]'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#8C7A6B]" />
          Polish
        </button>
        <button
          onClick={() => { setActiveTab('draft'); handleGenerate('draft'); }}
          className={`py-2 px-1 text-[11px] font-medium rounded-lg flex flex-col items-center gap-1 transition-all ${
            activeTab === 'draft'
              ? 'bg-white text-[#1A1817] border border-[#DCD3C1] shadow-xs font-semibold'
              : 'text-[#756C63] hover:bg-[#F3ECE0]'
          }`}
        >
          <FileSearch className="w-3.5 h-3.5 text-[#8C7A6B]" />
          Draft
        </button>
        <button
          onClick={() => { setActiveTab('ask'); }}
          className={`py-2 px-1 text-[11px] font-medium rounded-lg flex flex-col items-center gap-1 transition-all ${
            activeTab === 'ask'
              ? 'bg-white text-[#1A1817] border border-[#DCD3C1] shadow-xs font-semibold'
              : 'text-[#756C63] hover:bg-[#F3ECE0]'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-[#8C7A6B]" />
          Ask Bounkoun
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedText && (
          <div className="bg-[#F3ECE0]/70 border border-[#E5DEC9] rounded-xl p-3 text-xs">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8C7A6B] block mb-1">Target Context</span>
            <p className="text-[#3D352E] italic line-clamp-3 font-serif">"{selectedText}"</p>
          </div>
        )}

        {activeTab === 'ask' && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#665D55]">Ask Bounkoun a Research Question:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., How does FDI in Guinea compare to Botswana?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate('ask')}
                className="flex-1 bg-white border border-[#DCD3C1] px-3 py-2 text-xs rounded-lg text-[#1A1817] focus:outline-none focus:ring-1 focus:ring-[#8C7A6B]"
              />
              <button
                onClick={() => handleGenerate('ask')}
                className="bg-[#8C7A6B] text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-[#736355] transition-colors flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#8C7A6B] space-y-3">
            <Sparkles className="w-6 h-6 animate-spin text-[#8C7A6B]" />
            <p className="text-xs font-medium animate-pulse">Analyzing academic literature & context...</p>
          </div>
        ) : result ? (
          <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-2">
              <span className="text-xs font-semibold text-[#8C7A6B] flex items-center gap-1.5">
                <Bot className="w-4 h-4" /> AI Suggestion
              </span>
              <button
                onClick={() => handleGenerate(activeTab)}
                className="text-[11px] text-[#756C63] hover:text-[#1A1817] flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            </div>

            <div className="text-xs text-[#2C2A29] leading-relaxed font-sans whitespace-pre-line space-y-2">
              {result}
            </div>

            {activeTab !== 'critique' && (
              <div className="pt-3 border-t border-[#F3ECE0] flex justify-end gap-2">
                <button
                  onClick={() => onInsertText(result)}
                  className="bg-[#8C7A6B] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#736355] transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Insert into Document
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
