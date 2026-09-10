import type { OptionValue } from '../core/layout/options';
import { PRESETS } from '../core/layout/presets';
import type { ExportPreset } from '../core/export/resolution';
import { t, type MessageKey } from '../i18n';
import { groupOptions, railPanelId, railTabId, RAIL_TABS, type RailTab } from './groups';
import { OptionField } from './OptionField';
import type { PresetOption } from '../core/layout/options';

const EXPORT_SIZES: readonly ExportPreset[] = ['original', '4k', '2k', 'sns'];

/**
 * 레일 칸 넷 각각에 맞는 tabpanel 을 모두 그리고, 고르지 않은 것은 hidden 속성으로
 * 감춥니다. WAI-ARIA APG 의 탭 패턴대로입니다. 패널을 고른 것 하나만 그리면 나머지
 * 탭의 aria-controls 가 존재하지 않는 id 를 가리켜 화면 낭독기에서 연결이 끊깁니다.
 * hidden 은 초점도 함께 막으므로 탭 순서가 어지러워지지 않습니다.
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

  const contentFor = (tabValue: RailTab) => {
    switch (tabValue) {
      case 'preset':
        return (
          <fieldset className="preset-list" disabled={busy}>
            <legend>{t('rail.preset')}</legend>
            {PRESETS.map((preset) => {
              const isSelected = presetId === preset.id;
              return (
                <label key={preset.id} className="preset-item" data-selected={isSelected}>
                  <input
                    type="radio"
                    name="preset"
                    value={preset.id}
                    checked={isSelected}
                    onChange={() => setPreset(preset.id)}
                    disabled={busy}
                    className="hs-radio-input"
                  />
                  <span className="hs-radio-box" aria-hidden="true" />
                  {t(preset.labelKey as MessageKey)}
                </label>
              );
            })}
          </fieldset>
        );
      case 'frame':
        return <div className="field-list">{renderOptions(grouped.frame)}</div>;
      case 'text':
        return <div className="field-list">{renderOptions(grouped.text)}</div>;
      case 'export':
        return (
          <div className="field-list">
            <label className="hs-field">
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
    <>
      {RAIL_TABS.map((tabValue) => (
        <div
          key={tabValue}
          role="tabpanel"
          id={railPanelId(tabValue)}
          aria-labelledby={railTabId(tabValue)}
          tabIndex={0}
          hidden={tabValue !== tab}
          className="settings-panel"
        >
          {contentFor(tabValue)}
        </div>
      ))}
    </>
  );
}
