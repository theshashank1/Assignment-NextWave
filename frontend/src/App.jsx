import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, AlertCircle, Copy, Download, 
  Edit3, Check, FileText, Code2, Layers, Key, RefreshCw, 
  UploadCloud, ArrowRight
} from 'lucide-react';

export default function App() {
  const [material, setMaterial] = useState('');
  const [loadedFileName, setLoadedFileName] = useState('python_functions_sample.md');
  const [isDragging, setIsDragging] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasEnvKey, setHasEnvKey] = useState(false);
  const [activeModel, setActiveModel] = useState('');
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
    setTimeout(() => setToast(null), 3000);
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
        setHasEnvKey(Boolean(data.has_api_key));
        setActiveModel(data.active_model || 'gemini-3.5-flash');
        showToast('Sample material loaded (Python Functions)', 'success');
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
      showToast(`Loaded "${file.name}"`, 'success');
    };
    reader.readAsText(file);
  };

  // Handle file input change
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
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
    if (file) processFile(file);
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
      const isLive = data.mode === 'live_gemini';
      showToast(isLive ? 'Generated 5 questions using Live Gemini API!' : 'Generated 5 questions (Offline demo)', 'success');
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 100,
          backgroundColor: toast.type === 'error' ? '#dc2626' : toast.type === 'success' ? '#059669' : '#2563eb',
          color: '#ffffff',
          padding: '10px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          fontWeight: 500,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }} className="fade-in">
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header Bar */}
      <header style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '7px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--primary-border)'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                Question Workshop
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                padding: '1px 7px',
                borderRadius: '6px',
                border: '1px solid var(--primary-border)'
              }}>
                LangChain RAG
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Generate 5 grounded questions (2 Theory MCQ, 2 T/F, 1 Code Analysis)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Live Engine Status Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: (hasEnvKey || apiKey) ? '#059669' : '#64748b',
            backgroundColor: (hasEnvKey || apiKey) ? '#ecfdf5' : 'var(--bg-surface)',
            padding: '5px 10px',
            borderRadius: '6px',
            border: `1px solid ${(hasEnvKey || apiKey) ? '#a7f3d0' : 'var(--border)'}`,
            fontWeight: 500
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: (hasEnvKey || apiKey) ? '#10b981' : '#94a3b8',
              display: 'inline-block'
            }}></span>
            <span>{(hasEnvKey || apiKey) ? 'Gemini Live (gemini-3.5-flash)' : 'Offline Demo Mode'}</span>
          </div>

          {chunks.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-surface)',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)'
            }}>
              <Layers size={14} color="#2563eb" />
              <span><strong>{chunks.length}</strong> Chunks Indexed</span>
            </div>
          )}

          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: (apiKey || hasEnvKey) ? 'var(--success-bg)' : 'var(--bg-surface)',
              color: (apiKey || hasEnvKey) ? 'var(--success)' : 'var(--text-muted)',
              border: `1px solid ${(apiKey || hasEnvKey) ? 'var(--success-border)' : 'var(--border)'}`,
              fontWeight: 500
            }}
          >
            <Key size={13} />
            <span>{(apiKey || hasEnvKey) ? 'API Key Active' : 'API Key (Optional)'}</span>
          </button>
        </div>
      </header>

      {/* Optional API Key Drawer */}
      {showKeyInput && (
        <div style={{
          backgroundColor: '#eff6ff',
          borderBottom: '1px solid #bfdbfe',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px'
        }}>
          <Key size={15} color="#2563eb" />
          <span style={{ color: '#1e40af', fontWeight: 500 }}>Google Gemini Key:</span>
          <input
            type="password"
            placeholder="AIzaSy... (Leave empty for instant offline demo mode)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{
              flex: 1,
              maxWidth: '440px',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #93c5fd',
              color: 'var(--text-main)',
              fontSize: '12.5px'
            }}
          />
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Offline demo runs out-of-the-box without keys.
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
        height: 'calc(100vh - 65px)',
        overflow: 'hidden'
      }}>
        {/* LEFT PANEL: Reading Material Viewer & Generator */}
        <section style={{
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Panel Header */}
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="#2563eb" />
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Reading Material</h2>
              {loadedFileName && (
                <span style={{
                  fontSize: '11px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-mono)'
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
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                border: '1px solid var(--border)',
                fontWeight: 500
              }}>
                <UploadCloud size={13} />
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
                  padding: '5px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                  fontWeight: 500
                }}
              >
                <RefreshCw size={12} />
                <span>Reset Sample</span>
              </button>
            </div>
          </div>

          {/* Markdown Content Area with Minimal Drag & Drop Zone */}
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
              position: 'relative',
              backgroundColor: '#ffffff'
            }}
          >
            {isDragging && (
              <div style={{
                position: 'absolute',
                top: '12px',
                bottom: '12px',
                left: '12px',
                right: '12px',
                backgroundColor: 'rgba(239, 246, 255, 0.95)',
                border: '2px dashed #2563eb',
                borderRadius: '8px',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-main)',
                pointerEvents: 'none',
                gap: '10px'
              }} className="fade-in">
                <UploadCloud size={40} color="#2563eb" />
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1e40af' }}>Drop markdown file here</h3>
                <p style={{ fontSize: '12.5px', color: '#475569' }}>Release to immediately load and index for RAG generation</p>
              </div>
            )}

            <textarea
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Paste reading material here, or drop a .md file directly into this area..."
              style={{
                flex: 1,
                width: '100%',
                backgroundColor: '#ffffff',
                border: isDragging ? '1px dashed #2563eb' : '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                color: 'var(--text-main)',
                fontSize: '13px',
                lineHeight: 1.6,
                fontFamily: 'var(--font-mono)',
                resize: 'none'
              }}
            />
          </div>

          {/* Generate Button Bar */}
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              <span>Strict RAG: 2 Theory MCQ, 2 T/F, 1 Code Analysis</span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: loading ? '#94a3b8' : 'var(--primary)',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '13.5px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="spinner" />
                  <span>LangChain Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
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
            backgroundColor: '#ffffff'
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setActiveTab('review')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: activeTab === 'review' ? 'var(--primary-light)' : 'transparent',
                  color: activeTab === 'review' ? 'var(--primary)' : 'var(--text-muted)',
                  border: activeTab === 'review' ? '1px solid var(--primary-border)' : '1px solid transparent'
                }}
              >
                Review Questions ({questions.length})
              </button>

              <button
                onClick={() => setActiveTab('export')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: activeTab === 'export' ? 'var(--primary-light)' : 'transparent',
                  color: activeTab === 'export' ? 'var(--primary)' : 'var(--text-muted)',
                  border: activeTab === 'export' ? '1px solid var(--primary-border)' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Tagged Output</span>
                <span style={{
                  fontSize: '10px',
                  backgroundColor: 'var(--bg-surface)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  color: 'var(--text-dim)'
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
                      border: '1px solid var(--success-border)',
                      fontWeight: 500
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
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              {questions.length === 0 ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-dim)',
                  textAlign: 'center',
                  padding: '40px'
                }}>
                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: '16px',
                    borderRadius: '50%',
                    marginBottom: '16px'
                  }}>
                    <Layers size={32} color="#64748b" />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                    No Questions Generated Yet
                  </h3>
                  <p style={{ fontSize: '13px', maxWidth: '360px', marginBottom: '18px', color: 'var(--text-muted)' }}>
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
                      fontSize: '13px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    Generate Sample Questions Now
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {mode && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: mode === 'live_gemini' ? '#ecfdf5' : '#f8fafc',
                      border: `1px solid ${mode === 'live_gemini' ? '#a7f3d0' : 'var(--border)'}`,
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: mode === 'live_gemini' ? '#065f46' : 'var(--text-muted)'
                    }}>
                      <span><strong>Engine:</strong> {mode === 'live_gemini' ? 'Google Gemini API (gemini-3.5-flash)' : 'Built-in Demo Sample'}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>RAG Grounded: 5 Questions</span>
                    </div>
                  )}
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
            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Standardized Tagged Format</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
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
                      fontWeight: 500,
                      boxShadow: 'var(--shadow-sm)'
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
                      backgroundColor: '#ffffff',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border)',
                      fontWeight: 500,
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <Download size={14} />
                    <span>Download XML</span>
                  </button>
                </div>
              </div>

              <pre style={{
                flex: 1,
                backgroundColor: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                color: '#0369a1',
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

// Subcomponent: Individual Question Review Card (Light, Minimal Design)
function QuestionCard({ question, isEditing, onStartEdit, onCancelEdit, onSaveEdit, onToggleApprove }) {
  const [draft, setDraft] = useState({ ...question });

  useEffect(() => {
    setDraft({ ...question });
  }, [question]);

  const typeColorMap = {
    theory_mcq: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    true_false: { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
    code_analysis: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' }
  };

  const currentType = typeColorMap[question.type] || typeColorMap.theory_mcq;

  if (isEditing) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--primary)',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: 'var(--shadow-card)'
      }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
            Editing #{draft.id}: {draft.type_label}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onCancelEdit}
              style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '5px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveEdit(draft)}
              style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '5px', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 600 }}
            >
              Save Changes
            </button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: 500 }}>Question Prompt:</label>
          <textarea
            value={draft.prompt}
            onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px',
              fontSize: '13px',
              color: 'var(--text-main)',
              minHeight: '60px'
            }}
          />
        </div>

        {draft.type === 'code_analysis' && (
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: 500 }}>Code Snippet:</label>
            <textarea
              value={draft.code_snippet}
              onChange={(e) => setDraft({ ...draft, code_snippet: e.target.value })}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '12.5px',
                fontFamily: 'var(--font-mono)',
                color: '#0369a1',
                minHeight: '70px'
              }}
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: 500 }}>Options & Correct Answer:</label>
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
                <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '24px', color: 'var(--text-main)' }}>{opt.key}:</span>
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
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '12.5px',
                    color: 'var(--text-main)'
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: 500 }}>Explanation:</label>
          <textarea
            value={draft.explanation}
            onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px',
              fontSize: '12.5px',
              color: 'var(--text-main)',
              minHeight: '50px'
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: `1px solid ${question.is_approved ? 'var(--success-border)' : 'var(--border)'}`,
      borderLeft: question.is_approved ? '4px solid var(--success)' : '1px solid var(--border)',
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '11px',
      boxShadow: 'var(--shadow-card)'
    }} className="fade-in">
      {/* Top Header of Card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            padding: '2px 8px',
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
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success)',
            border: '1px solid var(--success-border)',
            fontWeight: 500
          }}>
            <CheckCircle2 size={12} />
            <span>Grounded via RAG</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              color: 'var(--text-muted)',
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
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '5px',
              backgroundColor: question.is_approved ? 'var(--success)' : '#ffffff',
              color: question.is_approved ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${question.is_approved ? 'var(--success)' : 'var(--border)'}`
            }}
          >
            <Check size={13} />
            <span>{question.is_approved ? 'Approved' : 'Approve'}</span>
          </button>
        </div>
      </div>

      {/* Prompt */}
      <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.5 }}>
        {question.prompt}
      </p>

      {/* Code Snippet if applicable */}
      {question.code_snippet && (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '10px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12.5px',
          color: '#0369a1',
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
              padding: '7px 12px',
              borderRadius: '6px',
              backgroundColor: opt.is_correct ? 'var(--success-bg)' : '#ffffff',
              border: `1px solid ${opt.is_correct ? 'var(--success-border)' : 'var(--border)'}`
            }}
          >
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: opt.is_correct ? 'var(--success)' : 'var(--bg-surface)',
              color: opt.is_correct ? '#ffffff' : 'var(--text-muted)'
            }}>
              {opt.key}
            </span>
            <span style={{ fontSize: '13px', color: opt.is_correct ? '#065f46' : 'var(--text-main)', flex: 1 }}>
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
          backgroundColor: 'var(--bg-surface)',
          padding: '8px 12px',
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
        backgroundColor: '#f8fafc',
        border: '1px solid var(--border)',
        padding: '7px 12px',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={13} color="#2563eb" />
          <strong style={{ color: 'var(--text-main)' }}>RAG Source Chunk:</strong> {question.source_chunk}
        </div>
        {question.source_quote && (
          <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
            "{question.source_quote}"
          </div>
        )}
      </div>
    </div>
  );
}
