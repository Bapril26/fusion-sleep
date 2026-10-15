import { useEffect, useState } from 'react';
import { STORY_CATEGORIES } from '../data/stories';
import { store, useStore, toast } from '../state/store';
import { generateStory, cancelGeneration, findExisting, generationsLeft, dailyStoryLimit, allowedMinutes, GenerationError, type StoryRequest } from '../state/generate';
import { openStory, playStory } from '../state/stories';
import { narrator, type NarratorVoice } from '../audio/narrator';
import { storyServerConfigured } from '../config/storyServer';
import { Icon } from '../components/Icon';
import { BrandFooter } from '../components/BrandFooter';

type AdultCategory = 'romantic' | 'peaceful' | 'dream' | 'mystery';
const SETTINGS: Record<AdultCategory, string[]> = {
  romantic: ['A seaside town', 'A vineyard at harvest', 'A rainy city café', 'A mountain lodge', 'A night train'],
  peaceful: ['A cosy cabin in the rain', 'A luxury sleeper train', 'A quiet beach at dusk', 'A forest village', 'A lake at night'],
  dream: ['A floating island', 'A garden of glass flowers', 'A sky full of lanterns', 'A library under the sea', 'A desert of soft stars'],
  mystery: ['An old seaside hotel', 'A lighthouse', 'A country bookshop', 'A sleepy harbour', 'A manor in the snow'],
};
const MOODS = ['Calm', 'Cosy', 'Hopeful', 'Tender', 'Dreamy', 'Nostalgic', 'Serene', 'Warm', 'Curious', 'Magical'];
const LENGTHS: StoryRequest['minutes'][] = [5, 10, 20, 30];

export function CreateStory() {
  const page = useStore((s) => s.page);
  const prefVoice = useStore((s) => s.narrator.voiceId);
  const kidsMode = useStore((s) => s.kidsMode);
  const online = useOnline();
  const [category, setCategory] = useState<AdultCategory>('peaceful');
  const [setting, setSetting] = useState(SETTINGS.peaceful[0]);
  const [customSetting, setCustomSetting] = useState('');
  const [mood, setMood] = useState('Calm');
  const [minutes, setMinutes] = useState<StoryRequest['minutes']>(10);
  const [description, setDescription] = useState('');
  const [voiceId, setVoiceId] = useState<string | null>(prefVoice);
  const [voices, setVoices] = useState<NarratorVoice[]>([]);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (page === 'createStory') narrator.voices().then((r) => setVoices(r.voices)).catch(() => setVoices([])); }, [page]);
  if (page !== 'createStory' || kidsMode) return null;

  const configured = storyServerConfigured();
  const left = generationsLeft();
  const req: StoryRequest = { category, setting: customSetting.trim() || setting, mood, minutes, description, voiceId };
  const existing = findExisting(req);

  const close = () => { if (busy) cancelGeneration(); store.set({ page: null }); };

  const create = async (force = false) => {
    if (busy) return;
    if (existing && !force) { openStory(existing.id); return; }
    setBusy(true); setError(null); setPreview('');
    try {
      const story = await generateStory(req, (t) => setPreview(t.replace(/^\s*TITLE:.*$/m, '').trimStart()));
      toast(`“${story.title}” is ready and saved to My stories`, 'success', 4500);
      store.set({ storyFilter: 'mine' });
      playStory(story.id);
    } catch (e) {
      const msg = e instanceof GenerationError ? e.message : 'Something went wrong while writing the story. Please try again.';
      if (!(e instanceof GenerationError && e.code === 'cancelled')) setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const blocked = !configured || !online || left <= 0;

  return (
    <div className="create" role="dialog" aria-label="Create my own story">
      <div className="sp-inner">
        <div className="sp-top">
          <button className="icon-btn" onClick={close} aria-label="Back"><Icon name="chevronLeft" /></button>
          <span className="eyebrow">Create my own story</span>
          <span style={{ width: 44 }} />
        </div>
        <h1 className="display" style={{ fontSize: 30, marginTop: 16 }}>A story written for tonight</h1>
        <p className="muted" style={{ marginTop: 8 }}>Tell us what you'd like to hear. A new, original story is written for you, saved on your phone, and read aloud by your narrator.</p>

        {!configured && (
          <div className="notice warn">
            <Icon name="info" size={18} />
            <span><b style={{ color: 'var(--text)' }}>Personalised stories need setting up.</b> This feature uses an AI story server that hasn't been connected to this version of the app yet. The 12 stories in the library work normally, offline.</span>
          </div>
        )}
        {configured && !online && (
          <div className="notice warn"><Icon name="wifiOff" size={18} /><span>You're offline. Connect to the internet to create a new story. Stories you've already created still play offline.</span></div>
        )}

        <label className="field-label">Type of story</label>
        <div className="cat-pick" role="radiogroup" aria-label="Type of story">
          {STORY_CATEGORIES.map((c) => (
            <button key={c.id} role="radio" aria-checked={category === c.id} className={category === c.id ? 'on' : ''}
              onClick={() => { setCategory(c.id as AdultCategory); setSetting(SETTINGS[c.id as AdultCategory][0]); }} disabled={busy}>
              <Icon name={c.icon} size={20} /><b>{c.short}</b><span>{c.blurb}</span>
            </button>
          ))}
        </div>

        <label className="field-label">Setting</label>
        <div className="wrap-chips">
          {SETTINGS[category].map((x) => (
            <button key={x} className={`chip ${!customSetting && setting === x ? 'on' : ''}`} onClick={() => { setSetting(x); setCustomSetting(''); }} disabled={busy}>{x}</button>
          ))}
        </div>
        <input id="custom-setting" className="text-input" style={{ marginTop: 10 }} placeholder="Or type your own setting (optional)" maxLength={80}
          value={customSetting} onChange={(e) => setCustomSetting(e.target.value)} disabled={busy} aria-label="Your own setting" />

        <label className="field-label">Mood</label>
        <div className="wrap-chips">
          {MOODS.map((m) => <button key={m} className={`chip ${mood === m ? 'on' : ''}`} onClick={() => setMood(m)} disabled={busy}>{m}</button>)}
        </div>

        <label className="field-label">Length</label>
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {LENGTHS.map((m) => {
            const pro = !allowedMinutes().includes(m);
            return (
              <button key={m} className={`preset ${minutes === m ? 'on' : ''}`} disabled={busy}
                onClick={() => (pro ? store.set({ sheet: 'premium', premiumFocus: null }) : setMinutes(m))} aria-label={`${m} minutes${pro ? ' (Pro)' : ''}`}>
                <b>{m}</b><span>{pro ? <><Icon name="crown" size={10} stroke={2.2} /> Pro</> : 'minutes'}</span>
              </button>
            );
          })}
        </div>

        <label className="field-label" htmlFor="story-idea">Your idea <span className="dim" style={{ fontWeight: 400 }}>(optional)</span></label>
        <textarea id="story-idea" className="textarea" maxLength={500} disabled={busy} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="For example: two old friends meet again at a quiet harbour café and talk until the stars come out." />
        <p className="dim tiny" style={{ textAlign: 'right', marginTop: 4 }}>{description.length}/500</p>

        <label className="field-label" htmlFor="voice-pick">Narrator voice</label>
        <select id="voice-pick" className="select" value={voiceId ?? ''} onChange={(e) => setVoiceId(e.target.value || null)} disabled={busy}>
          <option value="">Default voice</option>
          {voices.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>

        {existing && !busy && (
          <div className="notice"><Icon name="info" size={18} /><span>You already have a story for exactly these choices: “{existing.title}”. Open it for free, or write a new version.</span></div>
        )}

        <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
          {busy ? (
            <button className="btn ghost block" onClick={cancelGeneration}><Icon name="x" size={18} />Cancel</button>
          ) : existing ? (
            <>
              <button className="btn block" onClick={() => create(false)}><Icon name="book" size={18} />Open “{existing.title}”</button>
              <button className="btn ghost block" onClick={() => create(true)} disabled={blocked}><Icon name="pen" size={18} />Write a new version</button>
            </>
          ) : (
            <button className="btn block" onClick={() => create()} disabled={blocked}><Icon name="sparkles" size={18} />Write my story</button>
          )}
        </div>
        {configured && <p className="dim tiny" style={{ textAlign: 'center', marginTop: 10 }}>{Math.max(0, left)} of {dailyStoryLimit()} personalised {dailyStoryLimit() === 1 ? 'story' : 'stories'} left today</p>}

        {busy && (
          <div className="gen-status" role="status"><div className="spinner" />Writing your story… this can take up to a minute.</div>
        )}
        {preview && <div className="gen-preview" aria-live="polite">{preview}</div>}
        {error && <div className="notice warn" role="alert"><Icon name="info" size={18} /><span>{error}</span></div>}

        <p className="dim tiny" style={{ marginTop: 18 }}>Stories are written by AI, are for adults, and stay gentle and non-explicit. Your choices and idea are sent to the Fusion Sleep story server and its AI service only to write the story. The finished story is saved on this phone.</p>

        <BrandFooter />
      </div>
    </div>
  );
}

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}
