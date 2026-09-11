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
    removeSelected,
    removeAll,
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
        {/*
         * 전용 헤더를 두지 않습니다. 이름과 테마 단추 둘이서 세로 68px 을 썼는데, 그
         * 자리는 이 도구의 주 기능인 미리보기에 돌려주는 편이 낫습니다. 마크는 레일 위로,
         * 테마 단추는 레일 아래로 갔습니다.
         *
         * 제목은 화면에서만 감춥니다. 문서에 h1 이 하나는 있어야 하고 화면 낭독기가
         * 그것으로 페이지를 알립니다. 눈으로는 레일 위 마크와 브라우저 탭 제목이 같은
         * 일을 합니다.
         */}
        <h1 className="sr-only">halfstop</h1>

        {/*
         * 사진을 불러오는 일은 한 번 하고 마는 부가 기능이고, 슬라이더를 만지며 결과를
         * 보는 것이 주 기능입니다. 사진이 있든 없든 이 줄은 늘 같은 한 줄이라 사진을
         * 넣어도 아래 미리보기가 밀려나지 않습니다.
         */}
        <div className="intake">
          {photos.length > 0 && (
            <>
              <PhotoStrip
                photos={photos}
                selected={selected}
                onToggle={toggleSelected}
                onToggleAll={toggleAll}
                onRemoveSelected={removeSelected}
                onRemoveAll={removeAll}
                disabled={busy}
              />

              {/*
               * 사진을 더 넣는 길입니다. 레일에도 같은 일을 하는 단추가 있었는데 한 가지
               * 일에 두 자리를 두면 어느 쪽이 무엇인지 사용자가 매번 다시 판단해야 하므로
               * 레일 쪽을 걷어내고 이 줄로 모았습니다.
               *
               * 눈에 보이는 글자는 `추가` 한 낱말입니다. 옆의 그림이 이미 이미지를 뜻하므로
               * 글자가 그것을 되풀이할 이유가 없습니다. 다만 화면 낭독기 사용자는 그림을
               * 보지 못하므로 aria-label 은 무엇을 더하는지 밝히는 action.pick 을 씁니다.
               */}
              <label className="photo-add" data-disabled={!ready || busy}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={onPick}
                  disabled={!ready || busy}
                  aria-label={t('action.pick')}
                  className="hs-radio-input"
                />
                <ImagePlus aria-hidden="true" size={20} />
                <span>{t('action.add')}</span>
              </label>
            </>
          )}

          {/*
           * 할 말이 없으면 내용만 비웁니다. 요소를 통째로 빼면 화면 낭독기가 나중 변화를
           * 읽지 못합니다. 이 줄이 모든 오류가 사용자에게 닿는 유일한 자리입니다.
           */}
          <p role="status" className="status-line">
            {status === null ? '' : t(status.key, status.vars)}
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
                <span className="preview-empty-detail">
                  <span>{t('drop.emptyFormats')}</span>
                  <span>{t('drop.emptyMax', { max: MAX_PHOTOS })}</span>
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

          {/*
           * 파일 고르기는 레일에 두지 않습니다. 사진이 있을 때는 윗줄의 `추가` 가, 없을
           * 때는 미리보기 칸 전체를 덮는 점선 상자가 그 일을 합니다. 레일 위쪽에는
           * 마크만 남습니다.
           */}
          <Rail
            selected={tab}
            onSelect={setTab}
            orientation={orientation}
            disabled={busy}
            themeToggle={<ThemeToggle theme={theme} onToggle={toggleTheme} />}
          />
        </div>
      </main>
    </DropZone>
  );
}
