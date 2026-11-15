'use client'

import { LoaderCircle, Plus, Save, Send, Trash2 } from 'lucide-react'
import { useActionState, useState } from 'react'
import { initialStudioState, saveProject } from '../../actions'

export default function ProjectEditor({
  project,
}: {
  project: {
    id: string
    slug: string
    status: string
    template: string
    brandKit: string
    brandKits: Array<{ id: string; name: string }>
    sections: Array<{
      type: 'hero' | 'text' | 'features' | 'quote' | 'cta'
      eyebrow?: string
      heading: string
      body: string
      ctaLabel?: string
      ctaHref?: string
    }>
  }
}) {
  const [state, action, pending] = useActionState(saveProject, initialStudioState)
  const [sections, setSections] = useState(project.sections)
  const update = (index: number, field: keyof (typeof sections)[number], value: string) =>
    setSections((current) =>
      current.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section,
      ),
    )
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={project.id} />
      <input type="hidden" name="sections" value={JSON.stringify(sections)} />
      <label className="block text-xs font-extrabold text-white/60">
        Public URL
        <input
          name="slug"
          required
          defaultValue={project.slug}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          name="template"
          defaultValue={project.template}
          className="rounded-xl bg-[#123450] px-4 py-3 text-sm"
        >
          {['editorial', 'immersive', 'minimal', 'campaign'].map((template) => (
            <option key={template}>{template}</option>
          ))}
        </select>
        <select
          name="brandKit"
          defaultValue={project.brandKit}
          className="rounded-xl bg-[#123450] px-4 py-3 text-sm"
        >
          <option value="">Masidy default</option>
          {project.brandKits.map((kit) => (
            <option key={kit.id} value={kit.id}>
              {kit.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={index} className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <select
                value={section.type}
                onChange={(event) => update(index, 'type', event.target.value)}
                className="rounded-lg bg-[#123450] px-3 py-2 text-xs font-bold"
              >
                {['hero', 'text', 'features', 'quote', 'cta'].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setSections((current) => current.filter((_, itemIndex) => itemIndex !== index))
                  }
                  aria-label="Remove section"
                  className="text-rose-300"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <input
              value={section.eyebrow ?? ''}
              onChange={(event) => update(index, 'eyebrow', event.target.value)}
              placeholder="Eyebrow (optional)"
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            />
            <input
              value={section.heading}
              onChange={(event) => update(index, 'heading', event.target.value)}
              placeholder="Section heading"
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white"
            />
            <textarea
              value={section.body}
              onChange={(event) => update(index, 'body', event.target.value)}
              rows={6}
              placeholder="Section body"
              className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-white"
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={section.ctaLabel ?? ''}
                onChange={(event) => update(index, 'ctaLabel', event.target.value)}
                placeholder="CTA label"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
              <input
                value={section.ctaHref ?? ''}
                onChange={(event) => update(index, 'ctaHref', event.target.value)}
                placeholder="CTA URL"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          setSections((current) => [
            ...current,
            {
              type: 'text',
              heading: 'New section',
              body: 'Add production-ready section content here.',
            },
          ])
        }
        className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-extrabold text-white/70"
      >
        <Plus size={15} /> Add section
      </button>
      <div className="overflow-hidden rounded-[24px] bg-[#f8f8f5] text-[#0b2944]">
        <p className="border-b border-slate-200 px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">
          Live page preview
        </p>
        {sections.map((section, index) => (
          <section
            key={`preview-${index}`}
            className={index === 0 ? 'bg-[#0b2e4a] px-6 py-12 text-white' : 'px-6 py-10'}
          >
            {section.eyebrow && (
              <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#42bcc8]">
                {section.eyebrow}
              </p>
            )}
            <h2 className="mt-2 text-3xl font-black tracking-[-.05em]">{section.heading}</h2>
            <p
              className={`mt-4 whitespace-pre-wrap text-sm leading-6 ${
                index === 0 ? 'text-white/60' : 'text-slate-500'
              }`}
            >
              {section.body}
            </p>
            {section.ctaLabel && (
              <span className="mt-5 inline-flex rounded-full bg-[#ff654c] px-4 py-2 text-xs font-extrabold text-white">
                {section.ctaLabel}
              </span>
            )}
          </section>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          name="publish"
          value="false"
          disabled={pending}
          className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-xs font-extrabold"
        >
          <Save size={15} /> Save version
        </button>
        <button
          name="publish"
          value="true"
          disabled={pending}
          className="flex items-center gap-2 rounded-xl bg-[#ff654c] px-5 py-3 text-xs font-extrabold"
        >
          <Send size={15} /> Publish page
        </button>
        {pending && <LoaderCircle className="animate-spin" size={18} />}
      </div>
      {state.status !== 'idle' && (
        <p className="rounded-xl bg-white/10 p-3 text-sm font-bold">{state.message}</p>
      )}
    </form>
  )
}
