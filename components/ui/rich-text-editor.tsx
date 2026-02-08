'use client';

import { useMemo, useState, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

// CKEditor types are complex and dynamic imports make type inference difficult
// Using explicit type assertions for editor callbacks
interface EditorInstance {
  ui?: { view?: { editable?: { element?: HTMLElement } } };
  getData: () => string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter description...',
  id,
}: RichTextEditorProps) {
  const [editorLoaded, setEditorLoaded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [EditorComponents, setEditorComponents] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      import('@ckeditor/ckeditor5-react'),
      import('@ckeditor/ckeditor5-build-classic'),
    ]).then(([ckEditorModule, classicEditorModule]) => {
      setEditorComponents({
        CKEditor: ckEditorModule.CKEditor,
        ClassicEditor: classicEditorModule.default,
      });
      setEditorLoaded(true);
    });
  }, []);

  // Memoize config to prevent unnecessary re-renders and crashes
  const editorConfig = useMemo(
    () => ({
      placeholder,
      toolbar: [
        'heading',
        '|',
        'bold',
        'italic',
        '|',
        'link',
        'blockQuote',
        '|',
        'insertTable',
        'mediaEmbed',
        '|',
        'bulletedList',
        'numberedList',
        '|',
        'undo',
        'redo',
      ],
    }),
    [placeholder]
  );

  const handleReady = (editor: EditorInstance) => {
    const editable = editor.ui?.view?.editable?.element;
    if (editable) {
      editable.classList.add(
        'prose',
        'prose-sm',
        'max-w-none',
        'min-h-[80px]',
        'px-3',
        'py-2',
        'focus:outline-none'
      );
    }
  };

  const handleChange = (_event: unknown, editor: EditorInstance) => {
    onChange(editor.getData());
  };

  if (!editorLoaded || !EditorComponents) {
    return <div className="min-h-[80px] border border-input rounded-md bg-muted/20 animate-pulse" />;
  }

  const { CKEditor, ClassicEditor } = EditorComponents;

  return (
    <div
      id={id}
      role="textbox"
      aria-multiline="true"
      aria-labelledby={id ? `${id}-label` : undefined}
      className="rich-text-editor border border-input rounded-md overflow-hidden bg-background shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 transition-[color,box-shadow] duration-200"
    >
      <CKEditor
        editor={ClassicEditor}
        data={value || ''}
        config={editorConfig}
        onReady={handleReady}
        onChange={handleChange}
      />
    </div>
  );
}
