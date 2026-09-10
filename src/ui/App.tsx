import { useRef, type ChangeEvent } from 'react';
import { PRESETS } from '../core/layout/presets';
import { t, type MessageKey } from '../i18n';
import { DropZone } from './DropZone';
import { OptionField } from './OptionField';
import { usePipeline } from './usePipeline';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    status,
    options,
    setOption,
    load,
    download,
    busy,
    ready,
    hasPhoto,
    frameText,
    presetId,
    setPreset,
    presetOptions,
  } = usePipeline(canvasRef);

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    void load([...(event.target.files ?? [])]);
  };

  return (
    <DropZone disabled={busy} onFiles={load}>
      <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>halfstop</h1>

        <div
          style={{
            border: '2px dashed #bbb',
            borderRadius: 12,
            padding: 24,
            marginBottom: 16,
          }}
        >
          <p role="status" style={{ margin: '0 0 12px' }}>
            {t(status.key, status.vars)}
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.75 }}>
            {t('drop.hint')}
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPick}
            disabled={!ready || busy}
          />
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={hasPhoto ? t('canvas.withFrame', { text: frameText }) : t('canvas.empty')}
            style={{ maxWidth: '100%', flex: 1, background: '#f4f4f4', minHeight: 200 }}
          />

          <aside style={{ width: 260, display: 'grid', gap: 8 }}>
            <label style={{ display: 'grid', gap: 4, fontSize: 13, marginBottom: 8 }}>
              <span>{t('rail.preset')}</span>
              <select value={presetId} onChange={(e) => setPreset(e.target.value)} disabled={busy}>
                {PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {t(preset.labelKey as MessageKey)}
                  </option>
                ))}
              </select>
            </label>
            {presetOptions.map((option) => (
              <OptionField
                key={option.id}
                option={option}
                value={options.get(option.id) ?? option.default}
                disabled={busy}
                onChange={(value) => setOption(option.id, value)}
              />
            ))}
            <button type="button" onClick={() => void download()} disabled={!hasPhoto || busy}>
              {busy ? t('action.downloading') : t('action.download')}
            </button>
          </aside>
        </div>
      </main>
    </DropZone>
  );
}
