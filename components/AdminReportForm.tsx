// components/AdminReportForm.tsx
import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false }); // WYSIWYG
import 'react-quill/dist/quill.snow.css';

type ReportFormValues = {
  title?: string;
  slug?: string;
  date?: string;
  type?: string;
  summary?: string;
  content?: string;
  thumbnail?: string | null;
  images?: { url: string; caption?: string }[];
  damage?: string | null;
  // ...add other fields you need
};

export default function AdminReportForm({
  initial,
  onSave,
}: {
  initial?: ReportFormValues;
  onSave: (values: ReportFormValues) => Promise<void> | void;
}) {
  const [values, setValues] = useState<ReportFormValues>({
    title: '',
    slug: '',
    date: '',
    type: '',
    summary: '',
    content: '',
    thumbnail: null,
    images: [],
    damage: '',
    ...(initial ?? {}),
  });

  const [uploadingThumb, setUploadingThumb] = useState(false);
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UP_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const handleField = useCallback((k: keyof ReportFormValues, v: any) => {
    setValues((s) => ({ ...s, [k]: v }));
  }, []);

  async function handleThumbFile(file?: File) {
    if (!file) return;
    if (!CLOUD_NAME || !UP_PRESET) {
      alert('Cloudinary client config missing (NEXT_PUBLIC_* env vars).');
      return;
    }
    setUploadingThumb(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UP_PRESET);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: fd,
        }
      );
      const json = await res.json();
      if (json?.secure_url) {
        setValues((s) => ({ ...s, thumbnail: json.secure_url }));
      } else {
        console.error('Cloudinary response', json);
        alert('Thumbnail upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Thumbnail upload error');
    } finally {
      setUploadingThumb(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Basic validation could go here
    onSave(values);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-xs text-slate-500">Title</div>
          <input
            value={values.title ?? ''}
            onChange={(e) => handleField('title', e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block">
          <div className="text-xs text-slate-500">Slug</div>
          <input
            value={values.slug ?? ''}
            onChange={(e) => handleField('slug', e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block">
          <div className="text-xs text-slate-500">Date</div>
          <input
            type="date"
            value={values.date ?? ''}
            onChange={(e) => handleField('date', e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block">
          <div className="text-xs text-slate-500">Type</div>
          <input
            value={values.type ?? ''}
            onChange={(e) => handleField('type', e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
      </div>

      <label className="block">
        <div className="text-xs text-slate-500">Summary</div>
        <textarea
          value={values.summary ?? ''}
          onChange={(e) => handleField('summary', e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
          rows={3}
        />
      </label>

      {/* Damage field */}
      <label className="block">
        <div className="text-xs text-slate-500">Damage (short)</div>
        <input
          value={values.damage ?? ''}
          onChange={(e) => handleField('damage', e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
          placeholder="e.g. Substantial, Destroyed, Minor"
        />
        <p className="text-xs text-slate-400 mt-1">
          Short tag describing damage level or type.
        </p>
      </label>

      {/* Thumbnail uploader */}
      <div className="flex items-start gap-4">
        <div>
          <div className="text-xs text-slate-500">Thumbnail</div>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleThumbFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => {
                setValues((s) => ({ ...s, thumbnail: null }));
              }}
              className="rounded border px-3 py-1 text-sm"
            >
              Remove
            </button>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {uploadingThumb
              ? 'Uploading...'
              : values.thumbnail
                ? 'Uploaded'
                : 'No thumbnail'}
          </div>
        </div>

        {values.thumbnail ? (
          <div className="w-36 h-20 rounded overflow-hidden bg-slate-50">
            <img
              src={values.thumbnail}
              alt="thumb"
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}
      </div>

      {/* WYSIWYG (bigger editor) */}
      <label>
        <div className="text-xs text-slate-500">Full content</div>
        <div className="mt-2">
          <ReactQuill
            value={values.content ?? ''}
            onChange={(v) => handleField('content', v)}
            theme="snow"
            style={{ minHeight: 300 }}
          />
        </div>
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded bg-slate-900 text-white px-4 py-2"
        >
          Save
        </button>
        <button
          type="button"
          className="rounded border px-4 py-2"
          onClick={() => {
            /* you can call a cancel handler */
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
