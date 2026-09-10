import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { PresetOption } from '../core/layout/options';
import { PRESETS } from '../core/layout/presets';
import { fontById } from '../core/paint/fontFamilies';
import { usePipeline } from './usePipeline';

/** 서체 선택만 id 대신 사람이 읽는 이름을 보여줍니다. */
function optionLabel(optionId: string, value: string): string {
  return optionId === 'FONT_FAMILY' ? fontById(value).label : value;
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { status, options, setOption, load, download, busy, ready, hasPhoto, presetId, setPreset, presetOptions } =
    usePipeline(canvasRef);

  const [dragging, setDragging] = useState(false);

  // 내보내는 동안 열린 파일이 바뀌면 지금 보는 미리보기와 받는 파일이 달라집니다.
  // 창 드롭 핸들러에는 disabled 속성이 없으므로 최신 busy 값을 ref 로 들고 봅니다.
  const busyRef = useRef(busy);
  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  // 창 어디에 떨어뜨려도 받습니다. 점선 상자를 조준하게 만들 이유가 없고,
  // 빗나가면 브라우저가 그 파일로 이동해 작업이 날아갑니다.
  useEffect(() => {
    // dragleave 는 자식 요소 사이를 지날 때도 발생합니다. 들어온 횟수를 세어
    // 창을 실제로 벗어났을 때만 표시를 끕니다.
    let depth = 0;

    const carriesFiles = (event: globalThis.DragEvent) =>
      event.dataTransfer?.types.includes('Files') ?? false;

    const onEnter = (event: globalThis.DragEvent) => {
      if (busyRef.current) return;
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth += 1;
      setDragging(true);
    };

    const onOver = (event: globalThis.DragEvent) => {
      if (busyRef.current) return;
      if (!carriesFiles(event)) return;
      // 이것을 막지 않으면 drop 이 아예 발생하지 않습니다.
      event.preventDefault();
    };

    const onLeave = () => {
      depth -= 1;
      if (depth <= 0) {
        depth = 0;
        setDragging(false);
      }
    };

    const onWindowDrop = (event: globalThis.DragEvent) => {
      if (busyRef.current) return;
      event.preventDefault();
      depth = 0;
      setDragging(false);
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) void load([...files]);
    };

    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragover', onOver);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('drop', onWindowDrop);
    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('drop', onWindowDrop);
    };
  }, [load]);

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    void load([...(event.target.files ?? [])]);
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
            disabled={busy}
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => setOption(option.id, e.target.checked)}
            disabled={busy}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            min={option.min}
            max={option.max}
            value={Number(value)}
            onChange={(e) => setOption(option.id, Number(e.target.value))}
            disabled={busy}
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
            disabled={busy}
          />
        );
      case 'select':
        return (
          <select
            value={String(value)}
            onChange={(e) => setOption(option.id, e.target.value)}
            disabled={busy}
          >
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
            disabled={busy}
          />
        );
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>halfstop</h1>

      {dragging && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10,
            border: '3px dashed #4a9eff',
            background: 'rgba(74, 158, 255, 0.12)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 18,
            pointerEvents: 'none',
          }}
        >
          여기에 놓으십시오
        </div>
      )}

      <div
        style={{
          border: '2px dashed #bbb',
          borderRadius: 12,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <p role="status" style={{ margin: '0 0 12px' }}>
          {status}
        </p>
        <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.75 }}>
          창 어디에나 사진을 끌어다 놓을 수 있습니다
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
          aria-label={hasPhoto ? '프레임을 씌운 사진 미리보기입니다' : '아직 불러온 사진이 없습니다'}
          style={{ maxWidth: '100%', flex: 1, background: '#f4f4f4', minHeight: 200 }}
        />

        <aside style={{ width: 260, display: 'grid', gap: 8 }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 13, marginBottom: 8 }}>
            <span>프리셋</span>
            <select value={presetId} onChange={(e) => setPreset(e.target.value)} disabled={busy}>
              {PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.id}
                </option>
              ))}
            </select>
          </label>
          {presetOptions.map((option) => (
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
