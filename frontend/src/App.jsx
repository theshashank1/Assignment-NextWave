import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, AlertCircle, Copy, Download, 
  Edit3, Check, FileText, Code2, Layers, Key, RefreshCw, 
  UploadCloud, ExternalLink, HelpCircle
} from 'lucide-react';

export default function App() {
  const [material, setMaterial] = useState('');
  const [loadedFileName, setLoadedFileName] = useState('python_functions_sample.md');
  const [isDragging, setIsDragging] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [chunks, setChunks] = useState([]);
  const [mode, setMode] = useState('');
  const [activeTab, setActiveTab] = useState('review'); // 'review' | 'export'
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);

  // Show temporary toast message
  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch sample reading material on initial load
  useEffect(() => {
    fetchSample();
  }, []);

  const fetchSample = async () => {
    try {
      const res = await fetch('/api/sample');
      if (res.ok) {
        const data = await res.json();
        setMaterial(data.material);
        setChunks(data.chunks || []);
        setLoadedFileName('python_functions_sample.md');
        showToast('Sample reading material on Python Functions loaded!', 'success');
      }
    } catch (e) {
      console.error('Failed to fetch sample:', e);
    }
  };

  // Helper to read and load a file (from drop or file picker)
  const processFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      showToast('Please upload a markdown (.md) or text (.txt) file.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setMaterial(event.target.result);
      setLoadedFileName(file.name);
      showToast(`Loaded "${file.name}" successfully!`, 'success');
    };
    reader.readAsText(file);
  };

  // Handle file input change
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = ''; // reset input so same file can be reloaded if needed
  };

  // Handle drag and drop events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Trigger RAG Generation
  const handleGenerate = async () => {
    if (!material.trim()) {
      showToast('Please enter or load reading material first.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material, api_key: apiKey || null })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to generate questions');
      }

      const data = await res.json();
      setQuestions(data.questions || []);
      setChunks(data.chunks || []);
      setMode(data.mode);
      setActiveTab('review');
      showToast(`Generated 5 questions using LangChain RAG! (${data.mode})`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle approval state of a question
  const toggleApprove = (id) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, is_approved: !q.is_approved };
      }
      return q;
    }));
  };

  // Approve all questions
  const approveAll = () => {
    setQuestions(prev => prev.map(q => ({ ...q, is_approved: true })));
    showToast('All 5 questions approved!', 'success');
  };

  // Save edits to a question
  const handleSaveEdit = (updatedQ) => {
    setQuestions(prev => prev.map(q => (q.id === updatedQ.id ? updatedQ : q)));
    setEditingId(null);
    showToast(`Updated Question #${updatedQ.id}`, 'info');
  };

  // Count approved questions
  const approvedCount = questions.filter(q => q.is_approved).length;

  // Build the live tagged XML export
  const buildTaggedXml = () => {
    if (!questions.length) return '';
    const lines = [];
    lines.push('<question_group topic="Python Functions Assessment" total_questions="' + questions.length + '">');
    questions.forEach(q => {
      lines.push(`  <question id="${q.id}" type="${q.type}" status="${q.is_approved ? 'approved' : 'draft'}">`);
      lines.push(`    <prompt>${q.prompt}</prompt>`);
      if (q.code_snippet) {
        lines.push(`    <code_snippet><![CDATA[\n${q.code_snippet}\n    ]]></code_snippet>`);
      }
      lines.push('    <options>');
      (q.options || []).forEach(opt => {
        lines.push(`      <option key="${opt.key}" correct="${opt.is_correct ? 'true' : 'false'}">${opt.text}</option>`);
      });
      lines.push('    </options>');
      lines.push(`    <correct_answer>${q.correct_answer}</correct_answer>`);
      lines.push(`    <explanation>${q.explanation}</explanation>`);
      lines.push(`    <source_chunk>${q.source_chunk || ''}</source_chunk>`);
      lines.push(`    <source_quote>${q.source_quote || ''}</source_quote>`);
      lines.push('  </question>');
    });
    lines.push('</question_group>');
    return lines.join('\n');
  };

  const copyToClipboard = () => {
    const xml = buildTaggedXml();
    navigator.clipboard.writeText(xml);
    setCopied(true);
    showToast('Tagged XML copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadXml = () => {
    const xml = buildTaggedXml();
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assessment_questions.xml';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded assessment_questions.xml', 'success');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 100,
          backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#3b82f6',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.4)',
          fontWeight: 500,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }} className="fade-in">
          {toast.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header Bar */}
      <header style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)'
          }}>
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              AI Question Workshop
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                padding: '2px 8px',
                borderRadius: '999px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                LangChain RAG
              </span>
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Turns reading material into 5 grounded questions (2 Theory MCQ, 2 T/F, 1 Code Analysis)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {chunks.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-primary)',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)'
            }}>
              <Layers size={14} color="#3b82f6" />
              <span><strong>{chunks.length}</strong> Chunks Indexed</span>
            </div>
          )}

          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              padding: '7px 12px',
              borderRadius: '6px',
              backgroundColor: apiKey ? 'var(--success-bg)' : 'var(--bg-surface)',
              color: apiKey ? 'var(--success)' : 'var(--text-main)',
              border: `1px solid ${apiKey ? 'var(--success)' : 'var(--border)'}`
            }}
          >
            <Key size={14} />
            <span>{apiKey ? 'API Key Configured' : 'Configure Gemini Key (Optional)'}</span>
          </button>
        </div>
      </header>

      {/* Optional API Key Drawer */}
      {showKeyInput && (
        <div style={{
          backgroundColor: '#172554',
          borderBottom: '1px solid #1e40af',
          padding: '12px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px'
        }}>
          <Key size={16} color="#60a5fa" />
          <span style={{ color: '#93c5fd', minWidth: '150px' }}>Google Gemini API Key:</span>
          <input
            type="password"
            placeholder="AIzaSy... (Leave empty for instant offline Demo Mode)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{
              flex: 1,
              maxWidth: '460px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid #2563eb',
              color: '#ffffff',
              fontSize: '13px'
            }}
          />
          <span style={{ fontSize: '12px', color: '#93c5fd' }}>
            Works 100% offline with pre-compiled sample if blank.
          </span>
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1px',
        backgroundColor: 'var(--border)',
        height: 'calc(100vh - 75px)',
        overflow: 'hidden'
      }}>
        {/* LEFT PANEL: Reading Material Viewer & Generator */}
        <section style={{
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Panel Header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-secondary)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#3b82f6" />
              <h2 style={{ fontSize: '15px', fontWeight: 600 }}>Reading Material (.md)</h2>
              {loadedFileName && (
                <span style={{
                  fontSize: '11px',
                  backgroundColor: 'var(--bg-surface)',
                  color: '#93c5fd',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)'
                }}>
                  {loadedFileName}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                border: '1px solid var(--border)'
              }}>
                <UploadCloud size={14} />
                <span>Upload / Drop .md</span>
                <input type="file" accept=".md,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              <button
                onClick={fetchSample}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)'
                }}
              >
                <RefreshCw size={13} />
                <span>Reset Sample</span>
              </button>
            </div>
          </div>

          {/* Markdown Content Area with Drag & Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ 
              flex: 1, 
              padding: '16px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {isDragging && (
              <div style={{
                position: 'absolute',
                top: '16px',
                bottom: '16px',
                left: '16px',
                right: '16px',
                backgroundColor: 'rgba(30, 58, 138, 0.92)',
                border: '2px dashed #60a5fa',
                borderRadius: '8px',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                pointerEvents: 'none',
                gap: '12px'
              }} className="fade-in">
                <UploadCloud size={48} color="#93c5fd" />
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Drop your markdown (.md) file here</h3>
                <p style={{ fontSize: '13px', color: '#bfdbfe' }}>Release to immediately load and index for RAG generation</p>
              </div>
            )}

            <textarea
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Paste markdown reading material here, or drop a .md file directly into this area..."
              style={{
                flex: 1,
                width: '100%',
                backgroundColor: 'var(--bg-secondary)',
                border: isDragging ? '1px dashed #60a5fa' : '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                color: '#e2e8f0',
                fontSize: '13.5px',
                lineHeight: 1.6,
                fontFamily: 'var(--font-mono)',
                resize: 'none'
              }}
            />
          </div>

          {/* Generate Button Bar */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Rule: Produces 2 Theory MCQ, 2 T/F, 1 Code Analysis strictly grounded via RAG</span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: loading ? 'var(--text-dim)' : 'var(--primary)',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spinner" />
                  <span>LangChain RAG Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate 5 Questions</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* RIGHT PANEL: Reviewer Workspace & Tagged Output */}
        <section style={{
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Panel Tabs Header */}
          <div style={{
            padding: '10px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('review')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: activeTab === 'review' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'review' ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                Review Questions ({questions.length})
              </button>

              <button
                onClick={() => setActiveTab('export')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: activeTab === 'export' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'export' ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Tagged Output</span>
                <span style={{
                  fontSize: '10px',
                  backgroundColor: 'var(--bg-primary)',
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  XML
                </span>
              </button>
            </div>

            {questions.length > 0 && activeTab === 'review' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: approvedCount === 5 ? 'var(--success)' : 'var(--warning)'
                }}>
                  {approvedCount} / 5 Approved
                </span>
                {approvedCount < 5 && (
                  <button
                    onClick={approveAll}
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '5px',
                      backgroundColor: 'var(--success-bg)',
                      color: 'var(--success)',
                      border: '1px solid var(--success)'
                    }}
                  >
                    Approve All
                  </button>
                )}
              </div>
            )}
          </div>

          {/* TAB 1: REVIEW QUESTIONS WORKSPACE */}
          {activeTab === 'review' && (
            <div style={{ flex: 1, padding: '18px', overflowY: 'auto' }}>
              {questions.length === 0 ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: '40px'
                }}>
                  <Layers size={48} color="#475569" style={{ marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                    No Questions Generated Yet
                  </h3>
                  <p style={{ fontSize: '13px', maxWidth: '380px', marginBottom: '20px' }}>
                    Click <strong>"Generate 5 Questions"</strong> on the left. The LangChain RAG pipeline will extract chunks, create 2 Theory MCQs, 2 True/False, and 1 Code Analysis question with source citations.
                  </p>
                  <button
                    onClick={handleGenerate}
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '13px'
                    }}
                  >
                    Generate Sample Questions Now
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {questions.map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      isEditing={editingId === q.id}
                      onStartEdit={() => setEditingId(q.id)}
                      onCancelEdit={() => setEditingId(null)}
                      onSaveEdit={handleSaveEdit}
                      onToggleApprove={() => toggleApprove(q.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TAGGED XML EXPORT */}
          {activeTab === 'export' && (
            <div style={{ flex: 1, padding: '18px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Standardized Tagged Format</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Export formatted question group ready for assessment ingestion
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={copyToClipboard}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: copied ? 'var(--success)' : 'var(--primary)',
                      color: '#ffffff',
                      fontWeight: 500
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy XML'}</span>
                  </button>

                  <button
                    onClick={downloadXml}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <Download size={14} />
                    <span>Download XML</span>
                  </button>
                </div>
              </div>

              <pre style={{
                flex: 1,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '12.5px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5
              }}>
                {buildTaggedXml()}
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Subcomponent: Individual Question Review Card
function QuestionCard({ question, isEditing, onStartEdit, onCancelEdit, onSaveEdit, onToggleApprove }) {
  const [draft, setDraft] = useState({ ...question });

  useEffect(() => {
    setDraft({ ...question });
  }, [question]);

  const typeColorMap = {
    theory_mcq: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
    true_false: { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },
    code_analysis: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' }
  };

  const currentType = typeColorMap[question.type] || typeColorMap.theory_mcq;

  if (isEditing) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--primary)',
        borderRadius: '10px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
            Editing #{draft.id}: {draft.type_label}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onCancelEdit}
              style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '5px', backgroundColor: 'var(--bg-surface)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveEdit(draft)}
              style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '5px', backgroundColor: 'var(--success)', color: '#fff', fontWeight: 600 }}
            >
              Save Changes
            </button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Question Prompt:</label>
          <textarea
            value={draft.prompt}
            onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px',
              fontSize: '13px',
              color: '#fff',
              minHeight: '60px'
            }}
          />
        </div>

        {draft.type === 'code_analysis' && (
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Code Snippet:</label>
            <textarea
              value={draft.code_snippet}
              onChange={(e) => setDraft({ ...draft, code_snippet: e.target.value })}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '12.5px',
                fontFamily: 'var(--font-mono)',
                color: '#38bdf8',
                minHeight: '70px'
              }}
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Options & Correct Answer:</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {draft.options?.map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name={`correct_${draft.id}`}
                  checked={opt.is_correct}
                  onChange={() => {
                    const updatedOptions = draft.options.map((o, i) => ({
                      ...o,
                      is_correct: i === idx
                    }));
                    setDraft({ ...draft, options: updatedOptions, correct_answer: opt.key });
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '24px' }}>{opt.key}:</span>
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => {
                    const newOptions = [...draft.options];
                    newOptions[idx].text = e.target.value;
                    setDraft({ ...draft, options: newOptions });
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '12.5px'
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Explanation:</label>
          <textarea
            value={draft.explanation}
            onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px',
              fontSize: '12.5px',
              color: '#fff',
              minHeight: '50px'
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      border: `1px solid ${question.is_approved ? 'var(--success)' : 'var(--border)'}`,
      borderRadius: '10px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      position: 'relative'
    }} className="fade-in">
      {/* Top Header of Card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: currentType.bg,
            color: currentType.text,
            border: `1px solid ${currentType.border}`
          }}>
            {question.type_label}
          </span>

          <span style={{
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontWeight: 500
          }}>
            <CheckCircle2 size={12} />
            <span>Grounded via RAG</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onStartEdit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '5px',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-main)',
              border: '1px solid var(--border)'
            }}
          >
            <Edit3 size={12} />
            <span>Edit</span>
          </button>

          <button
            onClick={onToggleApprove}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '5px',
              backgroundColor: question.is_approved ? 'var(--success)' : 'var(--bg-surface)',
              color: question.is_approved ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${question.is_approved ? 'var(--success)' : 'var(--border)'}`
            }}
          >
            <Check size={14} />
            <span>{question.is_approved ? 'Approved' : 'Approve'}</span>
          </button>
        </div>
      </div>

      {/* Prompt */}
      <p style={{ fontSize: '14px', fontWeight: 500, color: '#f1f5f9', lineHeight: 1.5 }}>
        {question.prompt}
      </p>

      {/* Code Snippet if applicable */}
      {question.code_snippet && (
        <div style={{
          backgroundColor: '#090d16',
          border: '1px solid #1e293b',
          borderRadius: '6px',
          padding: '10px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12.5px',
          color: '#38bdf8',
          whiteSpace: 'pre-wrap'
        }}>
          {question.code_snippet}
        </div>
      )}

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
        {question.options?.map((opt) => (
          <div
            key={opt.key}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: opt.is_correct ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-primary)',
              border: `1px solid ${opt.is_correct ? 'rgba(16, 185, 129, 0.4)' : 'var(--border)'}`
            }}
          >
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: opt.is_correct ? 'var(--success)' : 'var(--bg-surface)',
              color: '#ffffff'
            }}>
              {opt.key}
            </span>
            <span style={{ fontSize: '13px', color: opt.is_correct ? '#34d399' : 'var(--text-main)', flex: 1 }}>
              {opt.text}
            </span>
            {opt.is_correct && (
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--success)' }}>
                Correct Answer
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Explanation */}
      {question.explanation && (
        <div style={{
          fontSize: '12.5px',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-primary)',
          padding: '10px 12px',
          borderRadius: '6px',
          borderLeft: '3px solid var(--primary)'
        }}>
          <strong>Explanation:</strong> {question.explanation}
        </div>
      )}

      {/* RAG Source Citation */}
      <div style={{
        fontSize: '11.5px',
        color: 'var(--text-dim)',
        backgroundColor: '#0c1322',
        padding: '8px 12px',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={13} color="#38bdf8" />
          <strong style={{ color: '#93c5fd' }}>RAG Source Chunk:</strong> {question.source_chunk}
        </div>
        {question.source_quote && (
          <div style={{ fontStyle: 'italic', color: '#cbd5e1' }}>
            "{question.source_quote}"
          </div>
        )}
      </div>
    </div>
  );
}

