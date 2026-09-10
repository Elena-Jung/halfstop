import { useRef, useState, useSyncExternalStore, type ChangeEvent } from 'react';
import { t } from '../i18n';
import { DropZone } from './DropZone';
import type { RailTab } from './groups';
import { Rail } from './Rail';
import { SettingsPanel } from './SettingsPanel';
import { usePipeline } from './usePipeline';

const WIDE_QUERY = '(min-width: 768px)';

/**
 * 767px 이하는 가로 탭 바(레일 아래), 768px 이상은 세로 레일(오른쪽)입니다. 레일의
 * aria-orientation 과 화살표 방향이 실제 배치와 어긋나지 않도록 CSS 와 같은 값을 씁니다.
 */
function subscribeToWideQuery(callback: () => void): () => void {
  const mql = window.matchMedia(WIDE_QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function readIsWide(): boolean {
  return window.matchMedia(WIDE_QUERY).matches;
}

function useRailOrientation(): 'vertical' | 'horizontal' {
  const isWide = useSyncExternalStore(subscribeToWideQuery, readIsWide);
  return isWide ? 'vertical' : 'horizontal';
}

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
    exportSize,
    setExportSize,
  } = usePipeline(canvasRef);

  const orientation = useRailOrientation();
  const [tab, setTab] = useState<RailTab>('preset');

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    void load([...(event.target.files ?? [])]);
  };

  return (
    <DropZone disabled={busy} onFiles={load}>
      <main className="app">
        <h1 className="app-title">halfstop</h1>

        <div className="intake">
          <p role="status" className="status-line">
            {t(status.key, status.vars)}
          </p>
          <p className="hint">{t('drop.hint')}</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPick}
            disabled={!ready || busy}
          />
        </div>

        <div className="layout">
          <section className="preview-pane">
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={hasPhoto ? t('canvas.withFrame', { text: frameText }) : t('canvas.empty')}
              className="preview-canvas"
            />
          </section>

          <SettingsPanel
            tab={tab}
            presetId={presetId}
            setPreset={setPreset}
            presetOptions={presetOptions}
            options={options}
            setOption={setOption}
            exportSize={exportSize}
            setExportSize={setExportSize}
            onDownload={() => void download()}
            hasPhoto={hasPhoto}
            busy={busy}
          />

          <Rail selected={tab} onSelect={setTab} orientation={orientation} disabled={busy} />
        </div>
      </main>
    </DropZone>
  );
}
