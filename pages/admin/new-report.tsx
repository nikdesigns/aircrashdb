// pages/admin/new-report.tsx
import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { uploadToCloudinary } from '@/utils/uploadToCloudinary';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function NewReportPage() {
  const router = useRouter();
  const quillRef = useRef<any>(null);

  const [form, setForm] = useState<any>({
    title: '',
    type: '',
    date: '',
    summary: '',
    site: '',
    aircraft: '',
    operator: '',
    fatalities: '',
    injuries: '',
    survivors: '',
    origin: '',
    destination: '',
    thumbnail: '',
    images: [] as string[],
    content: '',
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // stable modules and formats so the editor doesn't remount while typing
  const modules = useMemo(() => {
    return {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['link', 'image', 'blockquote', 'code-block'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
        ],
        handlers: {
          image: function () {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;
              try {
                setUploading(true);
                const url = await uploadToCloudinary(file);
                const quill =
                  quillRef.current?.getEditor?.() || (this as any).quill;
                const range = quill.getSelection(true);
                quill.insertEmbed(range.index, 'image', url);
                quill.setSelection(range.index + 1);
                setForm((p: any) => ({
                  ...p,
                  images: [...(p.images || []), url],
                }));
              } catch (err: any) {
                console.error('Editor upload', err);
                setMsg({
                  type: 'error',
                  text: err?.message ?? 'Editor image upload failed',
                });
              } finally {
                setUploading(false);
              }
            };
          },
        },
      },
    };
  }, []); // empty deps

  const formats = useMemo(
    () => [
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'blockquote',
      'code-block',
      'list',
      'bullet',
      'link',
      'image',
      'align',
    ],
    []
  );

  // small helpers
  function onChangeInput(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setForm((p: any) => ({ ...p, [name]: value }));
  }

  function onChangeContent(value: string) {
    setForm((p: any) => ({ ...p, content: value ?? '' }));
  }

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm((p: any) => ({ ...p, thumbnail: url }));
    } catch (err: any) {
      console.error('Thumb upload', err);
      setMsg({
        type: 'error',
        text: err?.message ?? 'Thumbnail upload failed',
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const url = await uploadToCloudinary(f);
        urls.push(url);
      }
      setForm((p: any) => ({ ...p, images: [...(p.images || []), ...urls] }));
    } catch (err: any) {
      console.error('Gallery upload', err);
      setMsg({ type: 'error', text: err?.message ?? 'Gallery upload failed' });
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    if (!form.title || !form.summary) {
      setMsg({
        type: 'error',
        text: 'Please provide at least title and summary.',
      });
      setLoading(false);
      return;
    }

    const payload = {
      ...form,
      fatalities: form.fatalities === '' ? undefined : Number(form.fatalities),
      injuries: form.injuries === '' ? undefined : Number(form.injuries),
      survivors: form.survivors === '' ? undefined : Number(form.survivors),
    };

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Server ${res.status}`);
      }
      const data = await res.json();
      setMsg({ type: 'success', text: 'Report created.' });
      router.push(`/admin/edit/${data._id ?? data.id ?? ''}`);
    } catch (err: any) {
      console.error('Create error', err);
      setMsg({ type: 'error', text: err?.message ?? 'Create failed' });
    } finally {
      setLoading(false);
    }
  }

  const removeGalleryImage = (url: string) => {
    setForm((p: any) => ({
      ...p,
      images: (p.images || []).filter((u: string) => u !== url),
    }));
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">New Report</h1>
        <p className="text-sm text-slate-600">
          Create a new report with rich content and images.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        {msg && (
          <div
            className={`p-3 rounded ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
          >
            {msg.text}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={onChangeInput}
            className="mt-1 block w-full rounded-md border p-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            name="type"
            placeholder="Type"
            value={form.type}
            onChange={onChangeInput}
            className="mt-1 block w-full rounded-md border p-2"
          />
          <input
            name="date"
            placeholder="YYYY-MM-DD"
            value={form.date}
            onChange={onChangeInput}
            className="mt-1 block w-full rounded-md border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Summary</label>
          <textarea
            name="summary"
            value={form.summary}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, summary: e.target.value }))
            }
            rows={3}
            className="mt-1 block w-full rounded-md border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Thumbnail</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
            />
            {uploading && (
              <div className="text-sm text-slate-500">Uploading…</div>
            )}
            {form.thumbnail && (
              <img
                src={form.thumbnail}
                alt="thumbnail"
                className="w-24 h-14 object-cover rounded"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Gallery (multiple)
          </label>
          <div className="mt-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
            />
            {form.images && form.images.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {form.images.map((u: string) => (
                  <div key={u} className="relative">
                    <img src={u} className="w-28 h-20 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(u)}
                      className="absolute top-1 right-1 bg-white rounded-full px-1 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Full content</label>
          <div className="mt-1">
            <ReactQuill
              ref={quillRef}
              value={form.content}
              onChange={onChangeContent}
              modules={modules}
              formats={formats}
              placeholder="Write the full report here..."
              theme="snow"
              className="rounded-lg"
              style={{ minHeight: 320 }}
            />
            <div className="text-xs text-slate-400 mt-1">
              Tip: use the image button to upload images directly into the
              article.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            name="site"
            placeholder="Site"
            value={form.site}
            onChange={onChangeInput}
            className="rounded-md border p-2"
          />
          <input
            name="aircraft"
            placeholder="Aircraft"
            value={form.aircraft}
            onChange={onChangeInput}
            className="rounded-md border p-2"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <input
            name="operator"
            placeholder="Operator"
            value={form.operator}
            onChange={onChangeInput}
            className="rounded-md border p-2"
          />
          <input
            name="origin"
            placeholder="Origin"
            value={form.origin}
            onChange={onChangeInput}
            className="rounded-md border p-2"
          />
          <input
            name="destination"
            placeholder="Destination"
            value={form.destination}
            onChange={onChangeInput}
            className="rounded-md border p-2"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <input
            type="number"
            name="fatalities"
            placeholder="Fatalities"
            value={form.fatalities}
            onChange={onChangeInput}
            className="rounded-md border p-2"
          />
          <input
            type="number"
            name="injuries"
            placeholder="Injuries"
            value={form.injuries}
            onChange={onChangeInput}
            className="rounded-md border p-2"
          />
          <input
            type="number"
            name="survivors"
            placeholder="Survivors"
            value={form.survivors}
            onChange={onChangeInput}
            className="rounded-md border p-2"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Create report'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="rounded border px-3 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
