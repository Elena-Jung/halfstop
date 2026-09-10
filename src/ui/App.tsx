import { ImagePlus } from 'lucide-react';
import { useRef, useState, useSyncExternalStore, type ChangeEvent } from 'react';
import { t } from '../i18n';
import { DropZone } from './DropZone';
import type { RailTab } from './groups';
import { MAX_PHOTOS } from './photos';
import { PhotoStrip } from './PhotoStrip';
import { Rail } from './Rail';
import { SettingsPanel } from './SettingsPanel';
import { ThemeToggle } from './ThemeToggle';
import { usePipeline } from './usePipeline';
import { useTheme } from './useTheme';

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
    photos,
    selected,
    toggleSelected,
    toggleAll,
    hasPreview,
    exportTargetName,
    frameText,
    presetId,
    setPreset,
    presetOptions,
    layout,
    arrangementId,
    setArrangement,
    exportSize,
    setExportSize,
  } = usePipeline(canvasRef);

  const orientation = useRailOrientation();
  const [tab, setTab] = useState<RailTab>('preset');
  const [theme, toggleTheme] = useTheme();

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    void load([...(event.target.files ?? [])]);
  };

  return (
    <DropZone disabled={busy} onFiles={load}>
      <main className="app">
        <div className="app-header">
          <h1 className="app-title">halfstop</h1>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        {/*
         * 사진을 불러오는 일은 한 번 하고 마는 부가 기능이고, 슬라이더를 만지며 결과를
         * 보는 것이 주 기능입니다. 사진이 있든 없든 이 줄은 늘 같은 한 줄이라 사진을
         * 넣어도 아래 미리보기가 밀려나지 않습니다.
         */}
        <div className="intake">
          <label className="file-picker" data-disabled={!ready || busy}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={onPick}
              disabled={!ready || busy}
              className="hs-radio-input"
            />
            <span>{t('action.pick')}</span>
          </label>

          {photos.length > 0 && (
            <PhotoStrip
              photos={photos}
              selected={selected}
              onToggle={toggleSelected}
              onToggleAll={toggleAll}
              disabled={busy}
            />
          )}

          {photos.length > 0 && (
            <span className="photo-count">{t('photos.count', { count: photos.length })}</span>
          )}

          <p role="status" className="status-line">
            {t(status.key, status.vars)}
          </p>
        </div>

        <div className="layout">
          <section className="preview-pane">
            {/*
             * 캔버스를 조건부로 빼지 않고 hidden 으로 감춥니다. usePipeline 이 ref 로 붙잡고
             * 있어 다시 붙일 때 컨텍스트를 새로 얻어야 하는데, 그럴 이유가 없습니다.
             * .preview-canvas 에 display: block 이 있으므로 아래 [hidden] 규칙이 반드시
             * 함께 있어야 실제로 감춰집니다.
             */}
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={
                hasPreview
                  ? t('canvas.withFrame', { text: frameText })
                  : photos.length === 0
                    ? t('canvas.empty')
                    : t('canvas.noSelection')
              }
              className="preview-canvas"
              hidden={photos.length === 0}
            />

            {photos.length === 0 && (
              <label className="preview-empty" data-disabled={!ready || busy}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={onPick}
                  disabled={!ready || busy}
                  className="hs-radio-input"
                />
                <ImagePlus aria-hidden="true" size={40} />
                <span className="preview-empty-main">{t('drop.empty')}</span>
                <span className="preview-empty-sub">
                  {t('drop.emptyDetail', { max: MAX_PHOTOS })}
                </span>
              </label>
            )}
          </section>

          <SettingsPanel
            tab={tab}
            presetId={presetId}
            setPreset={setPreset}
            presetOptions={presetOptions}
            options={options}
            setOption={setOption}
            layout={layout}
            arrangementId={arrangementId}
            setArrangement={setArrangement}
            exportSize={exportSize}
            setExportSize={setExportSize}
            onDownload={() => void download()}
            hasPhoto={hasPreview}
            exportTargetName={exportTargetName}
            busy={busy}
          />

          <Rail selected={tab} onSelect={setTab} orientation={orientation} disabled={busy} />
        </div>
      </main>
    </DropZone>
  );
}
