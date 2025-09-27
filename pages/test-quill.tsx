// pages/test-quill.tsx
import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function TestQuill() {
  const [value, setValue] = useState('');
  const quillRef = useRef<any>(null);

  const modules = useMemo(
    () => ({
      toolbar: [
        ['bold', 'italic'],
        ['link', 'image'],
      ],
    }),
    []
  );
  const formats = useMemo(() => ['bold', 'italic', 'link', 'image'], []);

  return (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-medium">Quill test</h2>
      <ReactQuill
        ref={quillRef}
        value={value}
        onChange={(v) => setValue(v ?? '')}
        modules={modules}
        formats={formats}
        style={{ minHeight: 360 }}
      />
      <div className="mt-6">
        <h3 className="mb-2">HTML output</h3>
        <div className="prose max-w-none border p-3">
          {value ? (
            <div dangerouslySetInnerHTML={{ __html: value }} />
          ) : (
            <em>Empty</em>
          )}
        </div>
      </div>
    </div>
  );
}
