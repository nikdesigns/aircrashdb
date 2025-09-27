// pages/admin/edit/[id].tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { uploadToCloudinary } from '@/utils/uploadToCloudinary';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function EditReportPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const quillRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
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
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/${id}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setForm({
          title: data.title ?? '',
          type: data.type ?? '',
          date: data.date ?? '',
          summary: data.summary ?? '',
          site: data.site ?? '',
          aircraft: data.aircraft ?? '',
          operator: data.operator ?? '',
          fatalities: data.fatalities ?? '',
          injuries: data.injuries ?? '',
          survivors: data.survivors ?? '',
          origin: data.origin ?? '',
          destination: data.destination ?? '',
          thumbnail: data.thumbnail ?? '',
          images: data.images ?? [],
          content: data.content ?? '',
        });
      } catch (err: any) {
        setError(err?.message ?? 'Load failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
                setError(err?.message ?? 'Editor image upload failed');
              } finally {
                setUploading(false);
              }
            };
          },
        },
      },
    };
  }, []);

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

  async function onSave() {
    setFormLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        fatalities:
          form.fatalities === '' ? undefined : Number(form.fatalities),
        injuries: form.injuries === '' ? undefined : Number(form.injuries),
        survivors: form.survivors === '' ? undefined : Number(form.survivors),
      };
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Save failed ${res.status}`);
      }
      alert('Saved');
      router.push('/admin');
    } catch (err: any) {
      setError(err?.message ?? 'Save failed');
      console.error('save error', err);
    } finally {
      setFormLoading(false);
    }
  }

  async function onDelete() {
    if (!confirm('Delete this report permanently?')) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/admin');
    } catch (err: any) {
      alert('Delete failed: ' + (err?.message ?? 'unknown'));
    }
  }

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm((p: any) => ({ ...p, thumbnail: url }));
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Thumbnail upload failed');
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
      console.error(err);
      setError(err?.message ?? 'Gallery upload failed');
    } finally {
      setUploading(false);
    }
  }

  const removeGalleryImage = (url: string) =>
    setForm((p: any) => ({
      ...p,
      images: (p.images || []).filter((u: string) => u !== url),
    }));

  if (loading) return <div className="p-8">Loading…</div>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit report</h1>
          <p className="text-sm text-slate-600">ID: {id}</p>
          {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="rounded border px-3 py-2">
            Back
          </Link>
          <button
            onClick={onDelete}
            className="rounded border px-3 py-2 text-rose-600"
          >
            Delete
          </button>
        </div>
      </header>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, title: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border p-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            name="type"
            value={form.type}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, type: e.target.value }))
            }
            className="rounded-md border p-2"
          />
          <input
            name="date"
            value={form.date}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, date: e.target.value }))
            }
            className="rounded-md border p-2"
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
          <label className="block text-sm font-medium">Gallery</label>
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
              onChange={(v) =>
                setForm((p: any) => ({ ...p, content: v ?? '' }))
              }
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

        <div className="grid grid-cols-3 gap-3">
          <input
            name="site"
            value={form.site}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, site: e.target.value }))
            }
            placeholder="Site"
            className="rounded-md border p-2"
          />
          <input
            name="aircraft"
            value={form.aircraft}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, aircraft: e.target.value }))
            }
            placeholder="Aircraft"
            className="rounded-md border p-2"
          />
          <input
            name="operator"
            value={form.operator}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, operator: e.target.value }))
            }
            placeholder="Operator"
            className="rounded-md border p-2"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <input
            type="number"
            name="fatalities"
            value={form.fatalities}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, fatalities: e.target.value }))
            }
            placeholder="Fatalities"
            className="rounded-md border p-2"
          />
          <input
            type="number"
            name="injuries"
            value={form.injuries}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, injuries: e.target.value }))
            }
            placeholder="Injuries"
            className="rounded-md border p-2"
          />
          <input
            type="number"
            name="survivors"
            value={form.survivors}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, survivors: e.target.value }))
            }
            placeholder="Survivors"
            className="rounded-md border p-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            name="origin"
            value={form.origin}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, origin: e.target.value }))
            }
            placeholder="Origin"
            className="rounded-md border p-2"
          />
          <input
            name="destination"
            value={form.destination}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, destination: e.target.value }))
            }
            placeholder="Destination"
            className="rounded-md border p-2"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={formLoading}
            className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {formLoading ? 'Saving...' : 'Save'}
          </button>
          <Link href="/admin" className="rounded border px-3 py-2">
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}
