import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Icon } from './Icon';
import { PixelButton } from './PixelButton';

export interface CodeEditorProps {
  root?: string;
  filePath?: string | null;
  initialContent?: string;
  onSave?: (content: string) => void | Promise<void>;
  readOnly?: boolean;
  onOpenInIde?: () => void;
  onCopyPath?: () => void;
}

interface LanguageMeta {
  name: string;
  badgeColor: string;
  textColor: string;
}

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp']);

function getExtension(filePath?: string | null): string {
  if (!filePath) return '';
  const parts = filePath.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function isImageFile(filePath?: string | null): boolean {
  return IMAGE_EXTENSIONS.has(getExtension(filePath));
}

function getLanguageMeta(filePath?: string | null): LanguageMeta {
  const ext = getExtension(filePath);
  switch (ext) {
    case 'ts':
      return { name: 'TypeScript', badgeColor: '#3178c6', textColor: '#ffffff' };
    case 'tsx':
      return { name: 'React TSX', badgeColor: '#2b7489', textColor: '#61dafb' };
    case 'js':
      return { name: 'JavaScript', badgeColor: '#f7df1e', textColor: '#000000' };
    case 'jsx':
      return { name: 'React JSX', badgeColor: '#20232a', textColor: '#61dafb' };
    case 'json':
      return { name: 'JSON', badgeColor: '#cbcb41', textColor: '#1a191e' };
    case 'html':
      return { name: 'HTML5', badgeColor: '#e34f26', textColor: '#ffffff' };
    case 'css':
      return { name: 'CSS3', badgeColor: '#563d7c', textColor: '#ffffff' };
    case 'scss':
    case 'sass': 
      return { name: 'SCSS', badgeColor: '#c6538c', textColor: '#ffffff' };
    case 'py':
      return { name: 'Python', badgeColor: '#3572A5', textColor: '#ffffff' };
    case 'md':
      return { name: 'Markdown', badgeColor: '#083fa1', textColor: '#ffffff' };
    case 'sql':
      return { name: 'SQL', badgeColor: '#e38c00', textColor: '#ffffff' };
    case 'sh':
    case 'bash':
      return { name: 'Shell', badgeColor: '#4eaa25', textColor: '#ffffff' };
    case 'yaml':
    case 'yml':
      return { name: 'YAML', badgeColor: '#cb171e', textColor: '#ffffff' };
    case 'rs':
      return { name: 'Rust', badgeColor: '#dea584', textColor: '#000000' };
    case 'go':
      return { name: 'Go', badgeColor: '#00ADD8', textColor: '#ffffff' };
    case 'java':
      return { name: 'Java', badgeColor: '#b07219', textColor: '#ffffff' };
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
      return { name: 'C/C++', badgeColor: '#f34b7d', textColor: '#ffffff' };
    default:
      return { name: ext ? ext.toUpperCase() : 'Plain Text', badgeColor: '#3a344d', textColor: '#ded7ec' };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CodeEditor({
  root,
  filePath,
  initialContent = '',
  onSave,
  readOnly = false,
  onOpenInIde,
  onCopyPath
}: CodeEditorProps) {
  const [content, setContent] = useState<string>(initialContent);
  const [savedContent, setSavedContent] = useState<string>(initialContent);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copied, setCopied] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });
  const [imageZoom, setImageZoom] = useState<'fit' | '100%' | '200%'>('fit');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  const isDirty = useMemo(() => content !== savedContent, [content, savedContent]);
  const isImage = useMemo(() => isImageFile(filePath), [filePath]);
  const langMeta = useMemo(() => getLanguageMeta(filePath), [filePath]);

  // Total lines count
  const linesCount = useMemo(() => {
    return content.split('\n').length;
  }, [content]);

  // Load file content whenever root or filePath changes
  const loadFile = useCallback(async () => {
    if (!filePath) {
      setContent(initialContent);
      setSavedContent(initialContent);
      setLoadError(null);
      return;
    }

    if (isImage) {
      setLoading(false);
      setLoadError(null);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      if (typeof window !== 'undefined' && window.cth?.readFile) {
        const res = await window.cth.readFile(root || '', filePath);
        if (res.ok && typeof res.content === 'string') {
          setContent(res.content);
          setSavedContent(res.content);
          setLoading(false);
          return;
        } else if (!res.ok && res.error) {
          throw new Error(res.error);
        }
      }

      // Fallback: direct API call
      const query = new URLSearchParams({ root: root || '', rel: filePath });
      const resp = await fetch(`/api/office/read-file?${query.toString()}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.ok && typeof data.content === 'string') {
          setContent(data.content);
          setSavedContent(data.content);
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Failed to read file from server');
      }

      // Default to initial content if provided
      setContent(initialContent);
      setSavedContent(initialContent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoadError(msg);
      setContent(initialContent);
      setSavedContent(initialContent);
    } finally {
      setLoading(false);
    }
  }, [filePath, root, initialContent, isImage]);

  useEffect(() => {
    void loadFile();
  }, [loadFile]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (readOnly || saveStatus === 'saving') return;
    setSaveStatus('saving');

    try {
      // 1. Trigger custom onSave callback if provided
      if (onSave) {
        await Promise.resolve(onSave(content));
      }

      // 2. Persist to disk via bridge or API
      if (filePath) {
        if (typeof window !== 'undefined' && window.cth?.writeFile) {
          const res = await window.cth.writeFile(root || '', filePath, content);
          if (!res.ok) {
            throw new Error(res.error || 'Save failed');
          }
        } else {
          const resp = await fetch('/api/office/write-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ root: root || '', rel: filePath, content })
          });
          const res = await resp.json();
          if (!res.ok) {
            throw new Error(res.error || 'Server save failed');
          }
        }
      }

      setSavedContent(content);
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2500);
    } catch (err: unknown) {
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3500);
    }
  }, [readOnly, saveStatus, onSave, filePath, root, content]);

  // Revert changes back to last saved
  const handleRevert = useCallback(() => {
    setContent(savedContent);
  }, [savedContent]);

  // Copy path handler with clipboard feedback
  const handleCopyPath = useCallback(() => {
    if (onCopyPath) {
      onCopyPath();
    } else if (filePath) {
      const full = root ? `${root}/${filePath}` : filePath;
      void navigator.clipboard?.writeText(full);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopyPath, filePath, root]);

  // Synchronize scrolling between textarea and line numbers gutter
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  }, []);

  // Update cursor line and column position
  const updateCursorPos = useCallback((el: HTMLTextAreaElement) => {
    const pos = el.selectionStart || 0;
    const textBefore = el.value.substring(0, pos);
    const lines = textBefore.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  }, []);

  // Keyboard navigation & shortcuts (Ctrl+S / Tab / Shift+Tab)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+S / Cmd+S: Save
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      void handleSave();
      return;
    }

    // Tab key: Insert 2 spaces indentation
    if (e.key === 'Tab' && !readOnly) {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;

      if (e.shiftKey) {
        // Shift+Tab: unindent 2 spaces
        if (start >= 2 && val.substring(start - 2, start) === '  ') {
          const next = val.substring(0, start - 2) + val.substring(end);
          setContent(next);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start - 2;
            updateCursorPos(target);
          }, 0);
        }
      } else {
        // Tab: indent 2 spaces
        const next = val.substring(0, start) + '  ' + val.substring(end);
        setContent(next);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 2;
          updateCursorPos(target);
        }, 0);
      }
    }
  }, [readOnly, handleSave, updateCursorPos]);

  // Image URL resolver
  const imageUrl = useMemo(() => {
    if (!filePath || !isImage) return '';
    const q = new URLSearchParams({ root: root || '', rel: filePath });
    return `/api/office/raw-file?${q.toString()}`;
  }, [filePath, root, isImage]);

  // Empty state when no file is selected
  if (!filePath) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: '#15121e',
        color: '#9e91b8',
        padding: 24,
        textAlign: 'center',
        fontFamily: 'var(--cth-font-ui, system-ui, sans-serif)',
        userSelect: 'none'
      }}>
        <div style={{
          width: 54,
          height: 54,
          borderRadius: 8,
          background: '#231d33',
          border: '1px solid #3d2f54',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <Icon name="code" size={2} />
        </div>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: 16,
          fontWeight: 600,
          color: '#f0ebff',
          letterSpacing: '0.02em'
        }}>
          MAHR Code & File Inspector
        </h3>
        <p style={{
          maxWidth: 380,
          margin: '0 0 20px 0',
          fontSize: 13,
          lineHeight: 1.5,
          color: '#8e82a6'
        }}>
          Select any file from the explorer on the left to inspect, edit, or synchronize changes with your active workspace.
        </p>
        <div style={{
          display: 'inline-flex',
          gap: 16,
          fontSize: 12,
          padding: '8px 16px',
          background: '#1c1729',
          borderRadius: 6,
          border: '1px solid #2e2440',
          color: '#b6a9cf',
          fontFamily: '"JetBrains Mono", monospace'
        }}>
          <span><kbd style={{ background: '#2f2444', padding: '2px 5px', borderRadius: 3 }}>Ctrl+S</kbd> Save</span>
          <span><kbd style={{ background: '#2f2444', padding: '2px 5px', borderRadius: 3 }}>Tab</kbd> Indent 2sp</span>
          <span><kbd style={{ background: '#2f2444', padding: '2px 5px', borderRadius: 3 }}>Shift+Tab</kbd> Outdent</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      background: '#15121e',
      color: '#f0ebff',
      fontFamily: '"JetBrains Mono", monospace'
    }}>
      {/* ─── Header Toolbar ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: '#100d17',
        borderBottom: '1px solid #2b2138',
        fontSize: 12,
        flexShrink: 0,
        gap: 8
      }}>
        {/* Left: Path, dirty indicator & language tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', minWidth: 0 }}>
          <Icon name={isImage ? 'image' : 'code'} />
          <span
            title={filePath}
            style={{
              fontWeight: 500,
              color: '#e4ddf2',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {filePath}
          </span>

          {/* Dirty status dot */}
          {isDirty && !readOnly && (
            <span
              title="Unsaved changes"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '1px 6px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                background: '#452a12',
                color: '#ffb366',
                border: '1px solid #73451e'
              }}
            >
              ● Modified
            </span>
          )}

          {/* Language badge */}
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 3,
              fontSize: 10,
              fontWeight: 600,
              background: langMeta.badgeColor,
              color: langMeta.textColor,
              letterSpacing: '0.04em'
            }}
          >
            {langMeta.name}
          </span>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Copy path button */}
          <PixelButton
            size="sm"
            variant="ghost"
            title="Copy path to clipboard"
            onClick={handleCopyPath}
          >
            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 11 }}>
              <Icon name="ledger" />
              {copied ? 'Copied!' : 'Copy Path'}
            </span>
          </PixelButton>

          {/* Open in IDE button */}
          {onOpenInIde && (
            <PixelButton
              size="sm"
              variant="secondary"
              title="Open full file in MAHR IDE workspace"
              onClick={onOpenInIde}
            >
              <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 11 }}>
                <Icon name="code" /> IDE
              </span>
            </PixelButton>
          )}

          {/* Revert button when dirty */}
          {isDirty && !readOnly && !isImage && (
            <PixelButton
              size="sm"
              variant="ghost"
              title="Discard unsaved changes"
              onClick={handleRevert}
            >
              <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 11 }}>
                Revert
              </span>
            </PixelButton>
          )}

          {/* Save button */}
          {!readOnly && !isImage && (
            <PixelButton
              size="sm"
              variant={isDirty ? 'primary' : 'ghost'}
              disabled={!isDirty && saveStatus !== 'saving'}
              onClick={() => void handleSave()}
              title="Save changes (Ctrl+S)"
            >
              <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 11 }}>
                <Icon name="check" />
                {saveStatus === 'saving'
                  ? 'Saving...'
                  : saveStatus === 'saved'
                  ? 'Saved ✓'
                  : saveStatus === 'error'
                  ? 'Error ✕'
                  : 'Save'}
              </span>
            </PixelButton>
          )}
        </div>
      </div>

      {/* ─── Editor Main View ─────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', background: '#15121e' }}>
        {/* Loading overlay */}
        {loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(21, 18, 30, 0.85)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: 13,
            color: '#c4b5de'
          }}>
            <Icon name="clock" /> Loading file content...
          </div>
        )}

        {/* Load Error View */}
        {loadError && !loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            background: '#15121e',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center'
          }}>
            <div style={{
              padding: '16px 20px',
              background: '#2c141d',
              border: '1px solid #632236',
              borderRadius: 6,
              maxWidth: 460
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#ff7b92', fontSize: 14 }}>Unable to read file</h4>
              <p style={{ margin: '0 0 16px 0', color: '#e8c0cb', fontSize: 12, lineHeight: 1.4 }}>
                {loadError}
              </p>
              <PixelButton size="sm" variant="secondary" onClick={() => void loadFile()}>
                <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                  <Icon name="sparkle" /> Retry
                </span>
              </PixelButton>
            </div>
          </div>
        )}

        {/* Image Preview View */}
        {isImage ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'repeating-conic-gradient(#1e1a29 0% 25%, #181423 0% 50%) 50% / 16px 16px',
            overflow: 'auto',
            padding: 20
          }}>
            <div style={{
              marginBottom: 12,
              display: 'flex',
              gap: 6,
              background: '#110d18',
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid #2f2540'
            }}>
              <button
                onClick={() => setImageZoom('fit')}
                style={{
                  background: imageZoom === 'fit' ? '#3d2e54' : 'transparent',
                  color: imageZoom === 'fit' ? '#fff' : '#8f83a8',
                  border: 'none',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                Fit
              </button>
              <button
                onClick={() => setImageZoom('100%')}
                style={{
                  background: imageZoom === '100%' ? '#3d2e54' : 'transparent',
                  color: imageZoom === '100%' ? '#fff' : '#8f83a8',
                  border: 'none',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                100%
              </button>
              <button
                onClick={() => setImageZoom('200%')}
                style={{
                  background: imageZoom === '200%' ? '#3d2e54' : 'transparent',
                  color: imageZoom === '200%' ? '#fff' : '#8f83a8',
                  border: 'none',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                200%
              </button>
            </div>
            <img
              src={imageUrl}
              alt={filePath || 'Preview'}
              style={{
                maxWidth: imageZoom === 'fit' ? '90%' : 'none',
                maxHeight: imageZoom === 'fit' ? '80%' : 'none',
                transform: imageZoom === '200%' ? 'scale(2)' : 'none',
                transformOrigin: 'center center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                border: '1px solid #3c2f52',
                imageRendering: 'pixelated'
              }}
            />
          </div>
        ) : (
          /* Code / Text Dual-Column View (Gutter + TextArea) */
          <div style={{ flex: 1, display: 'flex', height: '100%', minHeight: 0, overflow: 'hidden' }}>
            {/* Synchronized Line Numbers Gutter */}
            <div
              ref={gutterRef}
              style={{
                width: 48,
                flexShrink: 0,
                background: '#100d18',
                borderRight: '1px solid #231a30',
                color: '#524569',
                paddingTop: 12,
                paddingBottom: 12,
                fontSize: 13,
                lineHeight: '22px',
                textAlign: 'right',
                paddingRight: 10,
                userSelect: 'none',
                overflow: 'hidden'
              }}
            >
              {Array.from({ length: Math.max(linesCount, 1) }, (_, i) => i + 1).map((n) => {
                const isCurrent = n === cursorPos.line;
                return (
                  <div
                    key={n}
                    style={{
                      height: 22,
                      color: isCurrent ? '#c4b5de' : '#4d4063',
                      fontWeight: isCurrent ? 600 : 400
                    }}
                  >
                    {n}
                  </div>
                );
              })}
            </div>

            {/* Code Text Area */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setContent(e.target.value);
                updateCursorPos(e.currentTarget);
              }}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              onClick={(e: React.MouseEvent<HTMLTextAreaElement>) => updateCursorPos(e.currentTarget)}
              onKeyUp={(e: React.KeyboardEvent<HTMLTextAreaElement>) => updateCursorPos(e.currentTarget)}
              onSelect={(e: React.SyntheticEvent<HTMLTextAreaElement>) => updateCursorPos(e.currentTarget)}
              readOnly={readOnly}
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
                background: '#15121e',
                color: '#f0ebff',
                fontFamily: '"JetBrains Mono", "Cascadia Code", "Fira Code", monospace',
                fontSize: 13,
                lineHeight: '22px',
                border: 'none',
                outline: 'none',
                paddingTop: 12,
                paddingBottom: 12,
                paddingLeft: 12,
                paddingRight: 12,
                resize: 'none',
                whiteSpace: 'pre',
                overflowWrap: 'normal',
                overflowX: 'auto',
                overflowY: 'auto',
                tabSize: 2
              }}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />
          </div>
        )}
      </div>

      {/* ─── Footer Status Bar ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '3px 12px',
        background: '#0d0b13',
        borderTop: '1px solid #231a30',
        fontSize: 11,
        color: '#7b6e94',
        flexShrink: 0,
        userSelect: 'none'
      }}>
        {/* Left: Position & metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {!isImage && (
            <>
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span>{linesCount} {linesCount === 1 ? 'line' : 'lines'}</span>
              <span>{content.length} chars</span>
              <span>{formatBytes(new Blob([content]).size)}</span>
            </>
          )}
          {isImage && (
            <span>Image Asset</span>
          )}
          {readOnly && (
            <span style={{ color: '#ffaa66' }}>[Read Only]</span>
          )}
        </div>

        {/* Right: Encoding & shortcuts hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>UTF-8</span>
          <span>Tab: 2 spaces</span>
        </div>
      </div>
    </div>
  );
}
