import type { OptionValue } from '../core/layout/options';
import { PRESETS } from '../core/layout/presets';
import type { ExportPreset } from '../core/export/resolution';
import { t, type MessageKey } from '../i18n';
import { groupOptions, railPanelId, railTabId, type RailTab } from './groups';
import { OptionField } from './OptionField';
import type { PresetOption } from '../core/layout/options';

const EXPORT_SIZES: readonly ExportPreset[] = ['original', '4k', '2k', 'sns'];

/**
 * 고른 레일 칸에 맞는 내용을 그립니다. 어느 칸이든 바깥 요소는 tabpanel 이고
 * 이를 연 탭 단추를 aria-labelledby 로 가리킵니다.
 */
export function SettingsPanel(props: {
  tab: RailTab;
  presetId: string;
  setPreset: (id: string) => void;
  presetOptions: readonly PresetOption[];
  options: ReadonlyMap<string, OptionValue>;
  setOption: (id: string, value: OptionValue) => void;
  exportSize: ExportPreset;
  setExportSize: (size: ExportPreset) => void;
  onDownload: () => void;
  hasPhoto: boolean;
  busy: boolean;
}) {
  const {
    tab,
    presetId,
    setPreset,
    presetOptions,
    options,
    setOption,
    exportSize,
    setExportSize,
    onDownload,
    hasPhoto,
    busy,
  } = props;

  const grouped = groupOptions(presetOptions);
  const mode = options.get('MODE');

  const renderOptions = (group: readonly PresetOption[]) =>
    group
      // split 배치는 좌우가 이미 정해져 정렬 옵션이 뜻이 없습니다.
      .filter((option) => option.id !== 'ALIGN' || mode !== 'split')
      .map((option) => (
        <OptionField
          key={option.id}
          option={option}
          value={options.get(option.id) ?? option.default}
          disabled={busy}
          onChange={(value) => setOption(option.id, value)}
        />
      ));

  const content = () => {
    switch (tab) {
      case 'preset':
        return (
          <fieldset className="preset-list" disabled={busy}>
            <legend>{t('rail.preset')}</legend>
            {PRESETS.map((preset) => (
              <label key={preset.id} className="preset-item">
                <input
                  type="radio"
                  name="preset"
                  value={preset.id}
                  checked={presetId === preset.id}
                  onChange={() => setPreset(preset.id)}
                  disabled={busy}
                />
                {t(preset.labelKey as MessageKey)}
              </label>
            ))}
          </fieldset>
        );
      case 'frame':
        return <div className="field-list">{renderOptions(grouped.frame)}</div>;
      case 'text':
        return <div className="field-list">{renderOptions(grouped.text)}</div>;
      case 'export':
        return (
          <div className="field-list">
            <label className="field">
              <span>{t('export.size')}</span>
              <select
                value={exportSize}
                onChange={(e) => setExportSize(e.target.value as ExportPreset)}
                disabled={busy}
              >
                {EXPORT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {t(`export.size.${size}` as MessageKey)}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={onDownload} disabled={!hasPhoto || busy}>
              {busy ? t('action.downloading') : t('action.download')}
            </button>
          </div>
        );
    }
  };

  return (
    <div
      role="tabpanel"
      id={railPanelId(tab)}
      aria-labelledby={railTabId(tab)}
      tabIndex={0}
      className="settings-panel"
    >
      {content()}
    </div>
  );
}
