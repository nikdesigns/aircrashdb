// pages/admin/new-report.tsx
import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import slugify from 'slugify';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { uploadToCloudinary } from '@/utils/uploadToCloudinary';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

type ImgItem = {
  url: string;
  caption?: string;
  credit?: string;
  order?: number;
};
type Attachment = {
  url: string;
  title?: string;
  type?: string;
  caption?: string;
};

function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [txt, setTxt] = useState('');
  function add() {
    const t = txt.trim();
    if (t && !value.includes(t)) {
      onChange([...value, t]);
      setTxt('');
    }
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-2">
        {value.map((t, i) => (
          <span
            key={t + i}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm"
          >
            <span>{t}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs text-slate-500"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
          placeholder="Add tag and press Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          className="rounded-md border px-3 py-2 text-sm w-full"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-md border px-3 py-2 text-sm"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function NewReportPage() {
  useAdminAuth();
  const router = useRouter();
  const quillRef = useRef<any>(null);

  const [form, setForm] = useState<any>({
    title: '',
    slug: '',
    status: 'draft',
    type: '',
    date: '',
    flightNumber: '',
    callsign: '',
    aircraft: '',
    registration: '',
    operator: '',
    origin: '',
    destination: '',
    route: '',
    site: '',
    region: '',
    fatalities: '',
    injuries: '',
    survivors: '',
    damage: '',
    investigationStatus: '',
    summary: '',
    content: '',
    contentHighlights: [] as string[],
    thumbnail: '',
    images: [] as ImgItem[],
    attachments: [] as Attachment[],
    videos: [] as string[],
    externalLinks: [] as string[],
    reportDocument: '',
    phaseOfFlight: '',
    probableCause: '',
    contributingFactors: [] as string[],
    safetyRecommendations: [] as {
      body: string;
      issuedTo?: string;
      status?: string;
    }[],
    investigationBodies: [] as string[],
    references: [] as {
      title?: string;
      url?: string;
      publisher?: string;
      date?: string;
    }[],
    tags: [] as string[],
    author: '',
    verified: false,
    views: 0,
    relatedReports: [] as string[],
    timeline: [] as { time?: string; title: string; detail?: string }[],
    geo: { lat: '', lng: '' },
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const modules = useMemo(
    () => ({
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
                  images: [
                    ...(p.images || []),
                    {
                      url,
                      caption: '',
                      credit: '',
                      order: (p.images || []).length,
                    },
                  ],
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
    }),
    []
  );

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

  function updateField(key: string, value: any) {
    setForm((p: any) => ({ ...p, [key]: value }));
  }

  function genSlugFromTitle() {
    if (!form.title) return;
    const base = slugify(form.title, { lower: true, strict: true }).slice(
      0,
      80
    );
    updateField('slug', base);
  }

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      updateField('thumbnail', url);
    } catch (err: any) {
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
      const uploaded: ImgItem[] = [];
      for (const f of files) {
        const url = await uploadToCloudinary(f);
        uploaded.push({
          url,
          caption: '',
          credit: '',
          order: (form.images || []).length + uploaded.length,
        });
      }
      updateField('images', [...(form.images || []), ...uploaded]);
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message ?? 'Gallery upload failed' });
    } finally {
      setUploading(false);
    }
  }

  async function handleAttachmentUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded: Attachment[] = [];
      for (const f of files) {
        const url = await uploadToCloudinary(f);
        uploaded.push({ url, title: f.name, type: f.type, caption: '' });
      }
      updateField('attachments', [...(form.attachments || []), ...uploaded]);
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err?.message ?? 'Attachment upload failed',
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleReportDocumentUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      updateField('reportDocument', url);
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err?.message ?? 'Report doc upload failed',
      });
    } finally {
      setUploading(false);
    }
  }

  function setImageCaption(i: number, caption: string) {
    setForm((p: any) => {
      const imgs = (p.images || []).slice();
      imgs[i] = { ...(imgs[i] || {}), caption };
      return { ...p, images: imgs };
    });
  }
  function setImageCredit(i: number, credit: string) {
    setForm((p: any) => {
      const imgs = (p.images || []).slice();
      imgs[i] = { ...(imgs[i] || {}), credit };
      return { ...p, images: imgs };
    });
  }
  function removeGalleryImage(i: number) {
    setForm((p: any) => ({
      ...p,
      images: (p.images || []).filter((_: any, idx: number) => idx !== i),
    }));
  }

  function setAttachmentCaption(i: number, caption: string) {
    setForm((p: any) => {
      const arr = (p.attachments || []).slice();
      arr[i] = { ...(arr[i] || {}), caption };
      return { ...p, attachments: arr };
    });
  }
  function removeAttachment(i: number) {
    setForm((p: any) => ({
      ...p,
      attachments: (p.attachments || []).filter(
        (_: any, idx: number) => idx !== i
      ),
    }));
  }

  function addRecommendation() {
    updateField('safetyRecommendations', [
      ...(form.safetyRecommendations || []),
      { body: '', issuedTo: '', status: 'open' },
    ]);
  }
  function setRecommendation(i: number, key: string, value: any) {
    setForm((p: any) => {
      const arr = (p.safetyRecommendations || []).slice();
      arr[i] = { ...(arr[i] || {}), [key]: value };
      return { ...p, safetyRecommendations: arr };
    });
  }
  function removeRecommendation(i: number) {
    setForm((p: any) => ({
      ...p,
      safetyRecommendations: (p.safetyRecommendations || []).filter(
        (_: any, idx: number) => idx !== i
      ),
    }));
  }

  // references
  function addReference() {
    updateField('references', [
      ...(form.references || []),
      { title: '', url: '', publisher: '', date: '' },
    ]);
  }
  function setReference(i: number, key: string, value: any) {
    setForm((p: any) => {
      const arr = (p.references || []).slice();
      arr[i] = { ...(arr[i] || {}), [key]: value };
      return { ...p, references: arr };
    });
  }
  function removeReference(i: number) {
    setForm((p: any) => ({
      ...p,
      references: (p.references || []).filter(
        (_: any, idx: number) => idx !== i
      ),
    }));
  }

  // timeline helpers
  function addTimelineItem() {
    updateField('timeline', [
      ...(form.timeline || []),
      { time: '', title: '', detail: '' },
    ]);
  }
  function setTimelineItem(i: number, key: string, value: any) {
    setForm((p: any) => {
      const arr = (p.timeline || []).slice();
      arr[i] = { ...(arr[i] || {}), [key]: value };
      return { ...p, timeline: arr };
    });
  }
  function removeTimelineItem(i: number) {
    setForm((p: any) => ({
      ...p,
      timeline: (p.timeline || []).filter((_: any, idx: number) => idx !== i),
    }));
  }

  function setGeoLat(v: string) {
    const lat = v === '' ? '' : Number(v);
    setForm((p: any) => ({ ...p, geo: { ...(p.geo || {}), lat } }));
  }
  function setGeoLng(v: string) {
    const lng = v === '' ? '' : Number(v);
    setForm((p: any) => ({ ...p, geo: { ...(p.geo || {}), lng } }));
  }
  function centerGeoToZero() {
    setForm((p: any) => ({ ...p, geo: { lat: 0, lng: 0 } }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const payload: any = {
        title: form.title,
        slug:
          form.slug ||
          (form.title
            ? slugify(form.title, { lower: true, strict: true }).slice(0, 80)
            : undefined),
        status: form.status,
        type: form.type,
        date: form.date || undefined,
        flightNumber: form.flightNumber,
        callsign: form.callsign,
        aircraft: form.aircraft,
        registration: form.registration,
        operator: form.operator,
        origin: form.origin,
        destination: form.destination,
        route: form.route,
        site: form.site,
        region: form.region,
        fatalities:
          form.fatalities === '' ? undefined : Number(form.fatalities),
        injuries: form.injuries === '' ? undefined : Number(form.injuries),
        survivors: form.survivors === '' ? undefined : Number(form.survivors),
        damage: form.damage,
        investigationStatus: form.investigationStatus,
        summary: form.summary,
        content: form.content,
        contentHighlights: form.contentHighlights || [],
        thumbnail: form.thumbnail,
        images: (form.images || []).map((it: any) => ({
          url: it.url,
          caption: it.caption || '',
          credit: it.credit || '',
          order: typeof it.order === 'number' ? it.order : undefined,
        })),
        attachments: (form.attachments || []).map((it: any) => ({
          url: it.url,
          title: it.title || '',
          type: it.type || '',
          caption: it.caption || '',
        })),
        videos: form.videos || [],
        externalLinks: form.externalLinks || [],
        reportDocument: form.reportDocument || '',
        phaseOfFlight: form.phaseOfFlight,
        probableCause: form.probableCause,
        contributingFactors: form.contributingFactors || [],
        safetyRecommendations: (form.safetyRecommendations || []).map(
          (r: any) => ({
            body: r.body || '',
            issuedTo: r.issuedTo || '',
            status: r.status || 'open',
          })
        ),
        investigationBodies: form.investigationBodies || [],
        references: (form.references || []).map((r: any) => ({
          title: r.title || '',
          url: r.url || '',
          publisher: r.publisher || '',
          date: r.date || null,
        })),
        tags: form.tags || [],
        author: form.author || '',
        verified: !!form.verified,
        views:
          typeof form.views === 'number' ? form.views : Number(form.views) || 0,
        relatedReports: form.relatedReports || [],
        timeline: (form.timeline || []).map((t: any) => ({
          time: t.time || '',
          title: t.title || '',
          detail: t.detail || '',
        })),
        // send geo as GeoJSON Point if valid
        geo:
          form.geo &&
          typeof form.geo.lat === 'number' &&
          Number.isFinite(form.geo.lat) &&
          typeof form.geo.lng === 'number' &&
          Number.isFinite(form.geo.lng)
            ? {
                type: 'Point',
                coordinates: [Number(form.geo.lng), Number(form.geo.lat)],
              }
            : null,
      };

      // remove undefined props
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
      });

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Server ${res.status}`);
      }

      const json = await res.json();
      setMsg({ type: 'success', text: 'Report created.' });
      router.push(`/admin/edit/${json.id ?? json._id}`);
    } catch (err: any) {
      console.error('create failed', err);
      setMsg({ type: 'error', text: err?.message ?? 'Create failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">New Report</h1>
        <p className="text-sm text-slate-500">
          Create a detailed report record.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        {msg && (
          <div
            className={`p-3 rounded ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
          >
            {msg.text}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">Title</label>
          <div className="mt-1 flex gap-2">
            <input
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="flex-1 rounded-md border px-3 py-2"
            />
            <button
              type="button"
              onClick={genSlugFromTitle}
              className="rounded-md border px-3 py-2 text-sm"
            >
              Gen slug
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Slug (editable)</label>
          <input
            value={form.slug}
            onChange={(e) => updateField('slug', e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
            className="rounded-md border px-3 py-2"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="review">Review</option>
            <option value="archived">Archived</option>
          </select>

          <input
            value={form.type}
            onChange={(e) => updateField('type', e.target.value)}
            placeholder="Type (accident / incident)"
            className="rounded-md border px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <input
            type="date"
            value={form.date}
            onChange={(e) => updateField('date', e.target.value)}
            className="rounded-md border px-3 py-2"
          />
          <input
            value={form.operator}
            onChange={(e) => updateField('operator', e.target.value)}
            placeholder="Operator"
            className="rounded-md border px-3 py-2"
          />
          <input
            value={form.flightNumber}
            onChange={(e) => updateField('flightNumber', e.target.value)}
            placeholder="Flight number"
            className="rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Summary</label>
          <textarea
            value={form.summary}
            onChange={(e) => updateField('summary', e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border px-3 py-2"
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
                className="w-28 h-16 object-cover rounded"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Gallery images</label>
          <div className="mt-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
            />
            {form.images && form.images.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {form.images.map((it: ImgItem, i: number) => (
                  <div key={it.url + i} className="rounded border p-2 bg-white">
                    <img
                      src={it.url}
                      className="w-full h-36 object-cover rounded"
                    />
                    <input
                      type="text"
                      placeholder="Caption"
                      value={it.caption ?? ''}
                      onChange={(e) => setImageCaption(i, e.target.value)}
                      className="mt-2 w-full rounded border px-2 py-1 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Credit"
                      value={it.credit ?? ''}
                      onChange={(e) => setImageCredit(i, e.target.value)}
                      className="mt-2 w-full rounded border px-2 py-1 text-sm"
                    />
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-xs text-slate-400">
                        Order:{' '}
                        <input
                          type="number"
                          value={it.order ?? i}
                          onChange={(e) => {
                            const order =
                              e.target.value === ''
                                ? undefined
                                : Number(e.target.value);
                            setForm((p: any) => {
                              const imgs = (p.images || []).slice();
                              imgs[i] = { ...imgs[i], order };
                              return { ...p, images: imgs };
                            });
                          }}
                          className="inline-block w-16 ml-2 rounded border px-2 py-1 text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(i)}
                        className="text-sm text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Attachments (PDFs, docs)
          </label>
          <div className="mt-2">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              multiple
              onChange={handleAttachmentUpload}
            />
            {form.attachments && form.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {form.attachments.map((a: Attachment, i: number) => (
                  <div
                    key={a.url + i}
                    className="flex items-center justify-between gap-2 rounded border p-2"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {a.title || `Attachment ${i + 1}`}
                      </div>
                      <div className="text-xs text-slate-500">
                        {a.type || 'file'}
                      </div>
                      <input
                        type="text"
                        value={a.caption ?? ''}
                        onChange={(e) =>
                          setAttachmentCaption(i, e.target.value)
                        }
                        placeholder="Caption"
                        className="mt-1 rounded border px-2 py-1 text-sm w-full"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-600"
                      >
                        Open
                      </a>
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="text-sm text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Report document (official PDF)
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="file"
              accept=".pdf"
              onChange={handleReportDocumentUpload}
            />
            {form.reportDocument && (
              <a
                href={form.reportDocument}
                className="text-sm text-slate-600"
                target="_blank"
                rel="noreferrer"
              >
                View document
              </a>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Full content</label>
          <div className="mt-1">
            <ReactQuill
              ref={quillRef}
              value={form.content}
              onChange={(v) => updateField('content', v)}
              modules={modules}
              formats={formats}
              theme="snow"
              style={{ minHeight: 300 }}
            />
            <div className="text-xs text-slate-400 mt-1">
              Use the editor to write the full report. Use the image button to
              upload images to the content (they will also be added to the
              gallery).
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.aircraft}
            onChange={(e) => updateField('aircraft', e.target.value)}
            placeholder="Aircraft"
            className="rounded-md border px-3 py-2"
          />
          <input
            value={form.registration}
            onChange={(e) => updateField('registration', e.target.value)}
            placeholder="Registration"
            className="rounded-md border px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-4 gap-3">
          <input
            value={form.origin}
            onChange={(e) => updateField('origin', e.target.value)}
            placeholder="Origin"
            className="rounded-md border px-3 py-2"
          />
          <input
            value={form.destination}
            onChange={(e) => updateField('destination', e.target.value)}
            placeholder="Destination"
            className="rounded-md border px-3 py-2"
          />
          <input
            value={form.site}
            onChange={(e) => updateField('site', e.target.value)}
            placeholder="Site / location"
            className="rounded-md border px-3 py-2"
          />
          <input
            value={form.region}
            onChange={(e) => updateField('region', e.target.value)}
            placeholder="Region"
            className="rounded-md border px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <input
            type="number"
            value={form.fatalities}
            onChange={(e) => updateField('fatalities', e.target.value)}
            placeholder="Fatalities"
            className="rounded-md border px-3 py-2"
          />
          <input
            type="number"
            value={form.injuries}
            onChange={(e) => updateField('injuries', e.target.value)}
            placeholder="Injuries"
            className="rounded-md border px-3 py-2"
          />
          <input
            type="number"
            value={form.survivors}
            onChange={(e) => updateField('survivors', e.target.value)}
            placeholder="Survivors"
            className="rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Damage</label>
          <textarea
            value={form.damage}
            onChange={(e) => updateField('damage', e.target.value)}
            rows={3}
            placeholder="Describe damage (brief summary or details)"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Safety recommendations
          </label>
          <div className="mt-2 space-y-2">
            {(form.safetyRecommendations || []).map((r: any, i: number) => (
              <div key={i} className="rounded border p-2">
                <textarea
                  value={r.body}
                  onChange={(e) => setRecommendation(i, 'body', e.target.value)}
                  placeholder="Recommendation"
                  className="w-full rounded border px-2 py-1"
                />
                <div className="mt-2 flex gap-2">
                  <input
                    value={r.issuedTo}
                    onChange={(e) =>
                      setRecommendation(i, 'issuedTo', e.target.value)
                    }
                    placeholder="Issued to"
                    className="rounded-md border px-2 py-1"
                  />
                  <select
                    value={r.status}
                    onChange={(e) =>
                      setRecommendation(i, 'status', e.target.value)
                    }
                    className="rounded-md border px-2 py-1"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In progress</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeRecommendation(i)}
                    className="text-sm text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div>
              <button
                type="button"
                onClick={addRecommendation}
                className="rounded border px-3 py-1 text-sm"
              >
                Add recommendation
              </button>
            </div>
          </div>
        </div>

        {/* Timeline UI */}
        <div>
          <label className="block text-sm font-medium">Timeline</label>
          <div className="mt-2 space-y-2">
            {(form.timeline || []).map((t: any, i: number) => (
              <div key={i} className="rounded border p-2">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    value={t.time || ''}
                    onChange={(e) => setTimelineItem(i, 'time', e.target.value)}
                    placeholder="Time (e.g. 10:23 UTC / 2024-12-29 10:23)"
                    className="rounded border px-2 py-1"
                  />
                  <input
                    value={t.title || ''}
                    onChange={(e) =>
                      setTimelineItem(i, 'title', e.target.value)
                    }
                    placeholder="Title (short)"
                    className="rounded border px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeTimelineItem(i)}
                    className="text-sm text-rose-600"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={t.detail || ''}
                  onChange={(e) => setTimelineItem(i, 'detail', e.target.value)}
                  placeholder="Detail (expand on what happened)"
                  className="mt-2 w-full rounded border px-2 py-1"
                  rows={3}
                />
              </div>
            ))}
            <div>
              <button
                type="button"
                onClick={addTimelineItem}
                className="rounded border px-3 py-1 text-sm"
              >
                Add timeline item
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Geo coordinates</label>
          <div className="mt-2 grid grid-cols-3 gap-3 items-center">
            <input
              value={form.geo?.lat ?? ''}
              onChange={(e) => setGeoLat(e.target.value)}
              placeholder="Latitude"
              className="rounded-md border px-3 py-2"
            />
            <input
              value={form.geo?.lng ?? ''}
              onChange={(e) => setGeoLng(e.target.value)}
              placeholder="Longitude"
              className="rounded-md border px-3 py-2"
            />
            <div>
              <button
                type="button"
                onClick={centerGeoToZero}
                className="rounded border px-3 py-2 text-sm"
              >
                Set 0,0 (quick)
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Investigation bodies (comma-separated)
          </label>
          <input
            value={(form.investigationBodies || []).join(', ')}
            onChange={(e) =>
              updateField(
                'investigationBodies',
                e.target.value
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              )
            }
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Contributing factors (comma-separated)
          </label>
          <input
            value={(form.contributingFactors || []).join(', ')}
            onChange={(e) =>
              updateField(
                'contributingFactors',
                e.target.value
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              )
            }
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Tags</label>
          <div className="mt-2">
            <TagInput
              value={form.tags || []}
              onChange={(v) => updateField('tags', v)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.verified}
              onChange={(e) => updateField('verified', e.target.checked)}
            />
            <span className="text-sm">Verified</span>
          </label>

          <div className="ml-auto flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-slate-700 px-4 py-2 text-white"
            >
              {loading ? 'Saving…' : 'Create report'}
            </button>
            <Link href="/admin" className="rounded border px-3 py-2">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}
