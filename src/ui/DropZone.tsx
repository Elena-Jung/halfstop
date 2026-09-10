import { useEffect, useRef, useState, type ReactNode } from 'react';
import { t } from '../i18n';

/**
 * 창 어디에 떨어뜨려도 받습니다. 점선 상자를 조준하게 만들 이유가 없고,
 * 빗나가면 브라우저가 그 파일로 이동해 작업이 날아갑니다.
 */
export function DropZone(props: {
  disabled: boolean;
  onFiles: (files: readonly File[]) => void;
  children: ReactNode;
}) {
  const { disabled, onFiles, children } = props;
  const [dragging, setDragging] = useState(false);

  // 내보내는 동안 열린 파일이 바뀌면 지금 보는 미리보기와 받는 파일이 달라집니다.
  // 창 드롭 핸들러에는 disabled 속성이 없으므로 최신 disabled 값을 ref 로 들고 봅니다.
  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    // dragleave 는 자식 요소 사이를 지날 때도 발생합니다. 들어온 횟수를 세어
    // 창을 실제로 벗어났을 때만 표시를 끕니다.
    let depth = 0;

    const carriesFiles = (event: globalThis.DragEvent) =>
      event.dataTransfer?.types.includes('Files') ?? false;

    const onEnter = (event: globalThis.DragEvent) => {
      if (disabledRef.current) return;
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth += 1;
      setDragging(true);
    };

    const onOver = (event: globalThis.DragEvent) => {
      if (disabledRef.current) return;
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
      if (disabledRef.current) return;
      event.preventDefault();
      depth = 0;
      setDragging(false);
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) onFiles([...files]);
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
  }, [onFiles]);

  return (
    <>
      {dragging && (
        <div aria-hidden="true" className="hs-drop-overlay">
          {t('drop.active')}
        </div>
      )}
      {children}
    </>
  );
}
