import { useState, useRef, useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  testId?: string;
}

export default function RichTextEditor({ value, onChange, testId }: RichTextEditorProps) {
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState(value);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sourceMode && editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value, sourceMode]);

  function execCommand(command: string, val?: string) {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }

  function handleBold() {
    execCommand("bold");
  }

  function handleItalic() {
    execCommand("italic");
  }

  function handleUnderline() {
    execCommand("underline");
  }

  function handleLink() {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
    }
  }

  function handleHeading() {
    execCommand("formatBlock", "h2");
  }

  function handleInput() {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }

  function toggleSource() {
    if (sourceMode) {
      if (editorRef.current) {
        editorRef.current.innerHTML = sourceValue;
        onChange(sourceValue);
      }
      setSourceMode(false);
    } else {
      if (editorRef.current) {
        setSourceValue(editorRef.current.innerHTML);
      }
      setSourceMode(true);
    }
  }

  function handleSourceChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setSourceValue(e.target.value);
    onChange(e.target.value);
  }

  const toolbarButtonClass =
    "bg-navy-800 text-muted hover:text-warm-white px-2 py-1 text-xs tracking-wider uppercase";

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {!sourceMode && (
          <>
            <button type="button" className={toolbarButtonClass} onClick={handleBold} data-testid="rte-bold">
              Bold
            </button>
            <button type="button" className={toolbarButtonClass} onClick={handleItalic} data-testid="rte-italic">
              Italic
            </button>
            <button type="button" className={toolbarButtonClass} onClick={handleUnderline} data-testid="rte-underline">
              Underline
            </button>
            <button type="button" className={toolbarButtonClass} onClick={handleLink} data-testid="rte-link">
              Link
            </button>
            <button type="button" className={toolbarButtonClass} onClick={handleHeading} data-testid="rte-heading">
              Heading
            </button>
          </>
        )}
        <button type="button" className={toolbarButtonClass} onClick={toggleSource} data-testid="rte-source">
          Source
        </button>
      </div>

      {sourceMode ? (
        <textarea
          value={sourceValue}
          onChange={handleSourceChange}
          rows={5}
          className="w-full bg-surface border border-navy-600 px-4 py-3 text-sm text-warm-white focus:border-gold-500 focus:outline-none transition-colors font-mono resize-none"
          data-testid={testId}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="w-full bg-surface border border-navy-600 px-4 py-3 text-sm text-warm-white focus:border-gold-500 focus:outline-none transition-colors min-h-[120px]"
          data-testid="rte-editor"
        />
      )}
    </div>
  );
}
