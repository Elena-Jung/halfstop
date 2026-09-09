import { useRef, type ChangeEvent, type DragEvent } from 'react';
import type { PresetOption } from '../core/layout/options';
import { INFO_BAR_OPTIONS } from '../core/layout/presets/infoBar';
import { fontById } from '../core/paint/fontFamilies';
import { usePipeline } from './usePipeline';

/** 서체 선택만 id 대신 사람이 읽는 이름을 보여줍니다. */
function optionLabel(optionId: string, value: string): string {
  return optionId === 'FONT_FAMILY' ? fontById(value).label : value;
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { status, options, setOption, load, download, busy, ready, hasPhoto } =
    usePipeline(canvasRef);

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) void load(file);
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void load(file);
  };

  const field = (option: PresetOption) => {
    const value = options.get(option.id);
    switch (option.type) {
      case 'color':
        return (
          <input
            type="color"
            value={String(value)}
            onChange={(e) => setOption(option.id, e.target.value)}
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => setOption(option.id, e.target.checked)}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={Number(value)}
            onChange={(e) => setOption(option.id, Number(e.target.value))}
          />
        );
      case 'range':
        return (
          <input
            type="range"
            min={option.min}
            max={option.max}
            step={option.step}
            value={Number(value)}
            onChange={(e) => setOption(option.id, Number(e.target.value))}
          />
        );
      case 'select':
        return (
          <select value={String(value)} onChange={(e) => setOption(option.id, e.target.value)}>
            {option.options.map((choice) => (
              <option key={choice} value={choice}>
                {optionLabel(option.id, choice)}
              </option>
            ))}
          </select>
        );
      case 'text':
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => setOption(option.id, e.target.value)}
          />
        );
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>halfstop</h1>

      <div
        onDrop={onDrop}
        onDragOver={(event) => event.preventDefault()}
        style={{ border: '2px dashed #bbb', borderRadius: 12, padding: 24, marginBottom: 16 }}
      >
        <p style={{ margin: '0 0 12px' }}>{status}</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPick}
          disabled={!ready}
        />
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <canvas
          ref={canvasRef}
          style={{ maxWidth: '100%', flex: 1, background: '#f4f4f4', minHeight: 200 }}
        />

        <aside style={{ width: 260, display: 'grid', gap: 8 }}>
          {INFO_BAR_OPTIONS.map((option) => (
            <label key={option.id} style={{ display: 'grid', gap: 4, fontSize: 13 }}>
              <span>{option.id}</span>
              {field(option)}
            </label>
          ))}
          <button type="button" onClick={() => void download()} disabled={!hasPhoto || busy}>
            {busy ? '만드는 중' : '내려받기'}
          </button>
        </aside>
      </div>
    </main>
  );
}
