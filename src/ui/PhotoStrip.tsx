import { Eraser, Trash2 } from 'lucide-react';
import { t } from '../i18n';
import type { Loaded } from './usePipeline';

/**
 * 불러온 사진을 작은 썸네일로 늘어놓고 여러 장을 고를 수 있게 합니다. 프리셋 고르기
 * (SettingsPanel 의 .preset-item)와 같은 시각 언어를 씁니다. 실제 체크박스를 sr-only 로
 * 감추고 옆의 표시자로 상태를 그리는 방식도 같아서, 사용자가 두 가지 고르는 방식을
 * 따로 배우지 않아도 됩니다.
 *
 * fieldset 이 disabled 이면 그 안의 모든 입력과 단추(전체 선택, 선택 삭제, 전체 삭제
 * 포함)가 함께 잠깁니다. preset-list 가 이미 쓰는 방식과 같습니다.
 *
 * 줄의 왼쪽 끝은 썸네일이고 장수와 세 단추는 오른쪽 한 덩이로 모읍니다. 단추가 낱개로
 * 흩어져 있던 때는 묶음 폭이 230px 인데 높이가 24px 이라 비율이 어그러져 보였습니다.
 * 이제 세 단추가 테두리를 나눠 쓰는 40px 짜리 한 덩이입니다.
 *
 * 전체 선택과 전체 해제만 글자로 둡니다. 아이콘으로는 뜻이 통하지 않는다고 사용자가
 * 짚었습니다. 지우는 단추 둘은 아이콘이라 aria-label 과 title 이 유일한 이름입니다.
 */
export function PhotoStrip(props: {
  photos: readonly Loaded[];
  selected: ReadonlySet<number>;
  onToggle: (index: number) => void;
  onToggleAll: () => void;
  onRemoveSelected: () => void;
  onRemoveAll: () => void;
  disabled: boolean;
}) {
  const { photos, selected, onToggle, onToggleAll, onRemoveSelected, onRemoveAll, disabled } = props;

  if (photos.length === 0) return null;

  const allSelected = photos.length > 0 && selected.size === photos.length;

  return (
    <fieldset className="photo-strip" disabled={disabled}>
      <legend className="sr-only">{t('photos.legend')}</legend>
      <div className="photo-grid">
        {photos.map((photo, index) => {
          const isSelected = selected.has(index);
          return (
            <label
              key={photo.thumbUrl}
              className="photo-item"
              data-selected={isSelected}
              title={photo.file.name}
            >
              <div className="photo-thumb-wrap">
                {/*
                 * 파일 이름을 글자로 두면 썸네일마다 한 줄이 더 붙어 불러오기 칸이 세로로
                 * 길어집니다. 이름은 aria-label 로 옮겨 화면 낭독기에는 그대로 읽히게 하고,
                 * 눈으로는 title 로 확인합니다.
                 */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(index)}
                  aria-label={photo.file.name}
                  className="hs-radio-input"
                />
                <span className="hs-radio-box" aria-hidden="true" />
                <img src={photo.thumbUrl} alt="" className="photo-thumb" />
              </div>
            </label>
          );
        })}
      </div>

      <div className="photo-tools">
        <span className="photo-count">{t('photos.count', { count: photos.length })}</span>
        <div className="photo-actions">
          <button type="button" className="photo-select-all" onClick={onToggleAll}>
            {allSelected ? t('photos.deselectAll') : t('photos.selectAll')}
          </button>
          <button
            type="button"
            className="photo-delete-selected"
            onClick={onRemoveSelected}
            disabled={selected.size === 0}
            aria-label={t('photos.deleteSelected')}
            title={t('photos.deleteSelected')}
          >
            <Trash2 aria-hidden="true" size={16} />
          </button>
          <button
            type="button"
            className="photo-delete-all"
            onClick={onRemoveAll}
            aria-label={t('photos.deleteAll')}
            title={t('photos.deleteAll')}
          >
            <Eraser aria-hidden="true" size={16} />
          </button>
        </div>
      </div>
    </fieldset>
  );
}
