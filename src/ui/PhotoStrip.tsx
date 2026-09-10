import { t } from '../i18n';
import type { Loaded } from './usePipeline';

/**
 * 불러온 사진을 작은 썸네일로 늘어놓고 여러 장을 고를 수 있게 합니다. 프리셋 고르기
 * (SettingsPanel 의 .preset-item)와 같은 시각 언어를 씁니다. 실제 체크박스를 sr-only 로
 * 감추고 옆의 표시자로 상태를 그리는 방식도 같아서, 사용자가 두 가지 고르는 방식을
 * 따로 배우지 않아도 됩니다.
 *
 * fieldset 이 disabled 이면 그 안의 모든 입력과 단추(전체 선택 포함)가 함께 잠깁니다.
 * preset-list 가 이미 쓰는 방식과 같습니다.
 */
export function PhotoStrip(props: {
  photos: readonly Loaded[];
  selected: ReadonlySet<number>;
  onToggle: (index: number) => void;
  onToggleAll: () => void;
  disabled: boolean;
}) {
  const { photos, selected, onToggle, onToggleAll, disabled } = props;

  if (photos.length === 0) return null;

  const allSelected = photos.length > 0 && selected.size === photos.length;

  return (
    <fieldset className="photo-strip" disabled={disabled}>
      <legend>{t('photos.legend')}</legend>
      <button type="button" className="photo-select-all" onClick={onToggleAll}>
        {allSelected ? t('photos.deselectAll') : t('photos.selectAll')}
      </button>
      <div className="photo-grid">
        {photos.map((photo, index) => {
          const isSelected = selected.has(index);
          return (
            <label key={photo.thumbUrl} className="photo-item" data-selected={isSelected}>
              <div className="photo-thumb-wrap">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(index)}
                  className="hs-radio-input"
                />
                <span className="hs-radio-box" aria-hidden="true" />
                <img src={photo.thumbUrl} alt="" className="photo-thumb" />
              </div>
              <span className="photo-name">{photo.file.name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
