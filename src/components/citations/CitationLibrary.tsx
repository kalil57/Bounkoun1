import React, { useState } from 'react';
import { BookMarked, Plus, Search, Check, Quote, X, FileText } from 'lucide-react';

export interface CitationItem {
  id: string;
  authors: string;
  year: string;
  title: string;
  journal: string;
  volume?: string;
  doi?: string;
  citationKey: string;
}

export const INITIAL_CITATIONS: CitationItem[] = [
  {
    id: 'cit-1',
    authors: 'Addison, T., Ndikumana, L., & Sen, K.',
    year: '2024',
    title: 'Extractive Sectors and Development Enclaves in Resource-Rich Developing Nations',
    journal: 'Journal of Development Economics',
    volume: '162, 103189',
    doi: '10.1016/j.jdeveco.2023.103189',
    citationKey: 'Addison et al., 2024'
  },
  {
    id: 'cit-2',
    authors: 'World Bank',
    year: '2023',
    title: 'Guinea Economic Update: Navigating Mineral Endowments and Economic Diversification',
    journal: 'World Bank Group Reports',
    volume: 'DC-2023-04',
    doi: '10.1596/978-1-4648-1920-0',
    citationKey: 'World Bank, 2023'
  },
  {
    id: 'cit-3',
    authors: 'Camara, M., & Diallo, A. O.',
    year: '2022',
    title: 'Bauxite Reserves and Local Employment Spillovers in Mining Regions of Guinea',
    journal: 'African Development Review',
    volume: '34(2), 215-230',
    doi: '10.1111/1467-8268.12640',
    citationKey: 'Camara & Diallo, 2022'
  },
  {
    id: 'cit-4',
    authors: 'International Monetary Fund',
    year: '2023',
    title: 'Guinea: Article IV Consultation and Macroeconomic Structural Challenges',
    journal: 'IMF Country Report',
    volume: 'No. 23/118',
    citationKey: 'IMF, 2023'
  }
];

interface CitationLibraryProps {
  onInsertCitation: (citationText: string) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export const CitationLibrary: React.FC<CitationLibraryProps> = ({ onInsertCitation, onClose, isOpen }) => {
  const [citations, setCitations] = useState<CitationItem[]>(INITIAL_CITATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'APA' | 'MLA' | 'Chicago' | 'Harvard'>('APA');
  const [showAddModal, setShowAddModal] = useState(false);
  const [insertedId, setInsertedId] = useState<string | null>(null);

  // New citation form state
  const [newAuthors, setNewAuthors] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newJournal, setNewJournal] = useState('');

  if (!isOpen) return null;

  const filtered = citations.filter(c => 
    c.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.year.includes(searchQuery)
  );

  const formatInTextCitation = (cit: CitationItem) => {
    if (selectedFormat === 'APA') {
      return `(${cit.citationKey})`;
    } else if (selectedFormat === 'MLA') {
      const firstAuthorLastName = cit.authors.split(',')[0] || cit.authors;
      return `(${firstAuthorLastName} ${cit.year})`;
    } else if (selectedFormat === 'Chicago') {
      return `(${cit.citationKey})`;
    } else {
      return `(${cit.citationKey})`;
    }
  };

  const handleInsert = (cit: CitationItem) => {
    const formatted = formatInTextCitation(cit);
    onInsertCitation(formatted);
    setInsertedId(cit.id);
    setTimeout(() => setInsertedId(null), 1500);
  };

  const handleAddCitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthors || !newTitle) return;

    const firstLastName = newAuthors.split(',')[0] || newAuthors;
    const isMultiple = newAuthors.includes(',') || newAuthors.includes('&') || newAuthors.includes('and');
    const key = `${firstLastName}${isMultiple ? ' et al.' : ''}, ${newYear || 'n.d.'}`;

    const newCit: CitationItem = {
      id: `cit-${Date.now()}`,
      authors: newAuthors,
      year: newYear || '2024',
      title: newTitle,
      journal: newJournal || 'Academic Publication',
      citationKey: key
    };

    setCitations([newCit, ...citations]);
    setNewAuthors('');
    setNewYear('');
    setNewTitle('');
    setNewJournal('');
    setShowAddModal(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#FAF8F5] border-l border-[#E5DEC9] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-[#F3ECE0] border-b border-[#E5DEC9] flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#3D352E]">
          <BookMarked className="w-5 h-5 text-[#8C7A6B]" />
          <h2 className="font-semibold text-base">Citation Library</h2>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-[#8C7A6B] hover:text-[#1A1817] hover:bg-[#E8DFD1] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Style Selector & Search */}
      <div className="p-4 border-b border-[#E5DEC9] space-y-3 bg-[#FAF8F5]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-[#665D55] tracking-wider">Citation Style</span>
          <div className="flex bg-[#EFE9DD] p-0.5 rounded-lg text-xs font-medium border border-[#DCD3C1]">
            {(['APA', 'MLA', 'Chicago', 'Harvard'] as const).map(fmt => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  selectedFormat === fmt
                    ? 'bg-[#8C7A6B] text-white shadow-sm font-semibold'
                    : 'text-[#665D55] hover:text-[#1A1817]'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C7A6B]" />
          <input
            type="text"
            placeholder="Search references by author, title, year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#DCD3C1] pl-9 pr-3 py-1.5 text-xs rounded-lg text-[#1A1817] placeholder-[#A3988C] focus:outline-none focus:ring-1 focus:ring-[#8C7A6B]"
          />
        </div>
      </div>

      {/* Citations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#756C63]">{filtered.length} references found</span>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs font-medium text-[#8C7A6B] hover:text-[#1A1817] flex items-center gap-1 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Reference
          </button>
        </div>

        {filtered.map((cit) => (
          <div 
            key={cit.id}
            className="bg-white border border-[#E5DEC9] rounded-xl p-3.5 shadow-sm hover:border-[#8C7A6B] transition-all group relative"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="font-semibold text-xs text-[#1A1817] leading-snug">{cit.authors} ({cit.year})</span>
              <span className="text-[10px] bg-[#F3ECE0] text-[#756C63] px-1.5 py-0.5 rounded font-mono font-medium">
                {cit.citationKey}
              </span>
            </div>
            
            <p className="text-xs italic text-[#4A433D] mb-1.5 line-clamp-2 leading-relaxed">
              "{cit.title}"
            </p>

            <p className="text-[11px] text-[#756C63] mb-3">
              {cit.journal} {cit.volume ? `• ${cit.volume}` : ''}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-[#F3ECE0]">
              <span className="text-[10px] text-[#8C7A6B] font-mono">
                In-text: <strong className="text-[#3D352E]">{formatInTextCitation(cit)}</strong>
              </span>

              <button
                onClick={() => handleInsert(cit)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-all ${
                  insertedId === cit.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#FAF8F5] text-[#3D352E] border border-[#DCD3C1] hover:bg-[#8C7A6B] hover:text-white hover:border-[#8C7A6B]'
                }`}
              >
                {insertedId === cit.id ? (
                  <>
                    <Check className="w-3 h-3" /> Inserted
                  </>
                ) : (
                  <>
                    <Quote className="w-3 h-3" /> Insert Citation
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Reference Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddCitation}
            className="bg-white border border-[#E5DEC9] rounded-xl p-5 shadow-2xl w-full max-w-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-2">
              <h3 className="font-semibold text-sm text-[#1A1817]">Add Reference</h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-[#8C7A6B] hover:text-[#1A1817]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#665D55] mb-1">Authors (e.g. Addison, T., et al.)</label>
              <input 
                type="text"
                required
                value={newAuthors}
                onChange={e => setNewAuthors(e.target.value)}
                placeholder="Author Name(s)"
                className="w-full text-xs p-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8C7A6B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-[#665D55] mb-1">Year</label>
                <input 
                  type="text"
                  value={newYear}
                  onChange={e => setNewYear(e.target.value)}
                  placeholder="2024"
                  className="w-full text-xs p-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8C7A6B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#665D55] mb-1">Journal / Publisher</label>
                <input 
                  type="text"
                  value={newJournal}
                  onChange={e => setNewJournal(e.target.value)}
                  placeholder="Journal Name"
                  className="w-full text-xs p-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8C7A6B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#665D55] mb-1">Title</label>
              <input 
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Article / Book Title"
                className="w-full text-xs p-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8C7A6B]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#F3ECE0]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-[#665D55] hover:bg-[#F3ECE0] rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs bg-[#8C7A6B] text-white rounded-md hover:bg-[#736355] font-medium"
              >
                Save Reference
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
