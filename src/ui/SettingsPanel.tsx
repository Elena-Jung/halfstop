import type { OptionValue } from '../core/layout/options';
import { PRESETS } from '../core/layout/presets';
import type { ExportFormatId } from '../core/export/formats';
import type { ExportPreset } from '../core/export/resolution';
import { t, type MessageKey } from '../i18n';
import { Listbox, type ListboxOption } from './controls/Listbox';
import { arrangementsForLayout, groupOptions, railPanelId, railTabId, RAIL_TABS, type RailTab } from './groups';
import type { UnitMode } from './unitScale';
import { OptionField } from './OptionField';
import type { PresetOption } from '../core/layout/options';
import { usePresetThumbnails } from './presetThumbnails';

const EXPORT_SIZES: readonly ExportPreset[] = ['original', '4k', '2k', 'sns'];

/** 배경색과 글자색은 서로의 대비를 보여야 뜻이 있는 짝입니다. 두 레이아웃 모두 이 둘을
 * 함께 선언하므로 여기서 짝을 고정해 둡니다. */
function contrastPairId(optionId: string): string | undefined {
  if (optionId === 'BACKGROUND') return 'TEXT_COLOR';
  if (optionId === 'TEXT_COLOR') return 'BACKGROUND';
  return undefined;
}

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
  layout: 'bar' | 'matte';
  arrangementId: string;
  setArrangement: (id: string) => void;
  exportSize: ExportPreset;
  setExportSize: (size: ExportPreset) => void;
  exportFormat: ExportFormatId;
  setExportFormat: (format: ExportFormatId) => void;
  /** 이 브라우저가 실제로 만들 수 있는 형식만 들어 있습니다. */
  exportFormats: readonly ExportFormatId[];
  onDownload: () => void;
  hasPhoto: boolean;
  exportTargetName: string | null;
  busy: boolean;
  /** 숫자 칸이 값을 보여 주고 받는 단위입니다. 칸마다 따로 두지 않고 하나를 함께 씁니다. */
  unitMode: UnitMode;
  setUnitMode: (mode: UnitMode) => void;
  /** 1u 가 내보낼 파일에서 몇 픽셀인지입니다. 환산할 수 없으면 null 입니다. */
  pxPerUnit: number | null;
}) {
  const {
    tab,
    presetId,
    setPreset,
    presetOptions,
    options,
    setOption,
    layout,
    arrangementId,
    setArrangement,
    exportSize,
    setExportSize,
    exportFormat,
    setExportFormat,
    exportFormats,
    onDownload,
    hasPhoto,
    exportTargetName,
    busy,
    unitMode,
    setUnitMode,
    pxPerUnit,
  } = props;

  const grouped = groupOptions(presetOptions);
  const mode = options.get('MODE');
  const logoSource = options.get('LOGO_SOURCE');
  const presetThumbnails = usePresetThumbnails(PRESETS);
  // 고른 사진이 없으면 미리보기에 그릴 것도, 값을 적용할 대상도 없습니다. busy 와
  // 마찬가지로 패널 전체를 잠급니다.
  const locked = busy || !hasPhoto;

  const renderOptions = (group: readonly PresetOption[]) =>
    group
      // MODE 는 배치 카드가 통째로 정합니다. 개별 옵션으로 따로 보이면 카드가
      // 고른 값과 어긋날 수 있습니다.
      .filter((option) => option.id !== 'MODE')
      // split 배치는 좌우가 이미 정해져 정렬 옵션이 뜻이 없습니다.
      .filter((option) => option.id !== 'ALIGN' || mode !== 'split')
      // 한 덩이는 PRIMARY 슬롯만 그립니다. 오른쪽 줄 입력을 남겨 두면 고쳐도 미리보기가
      // 그대로라 고장으로 읽힙니다. poster 는 두 슬롯을 다 쓰므로 여기 걸리지 않습니다.
      .filter(
        (option) =>
          (option.id !== 'SECONDARY_MAIN' && option.id !== 'SECONDARY_SUB') || mode !== 'single',
      )
      // 로고 자체를 안 그리면 어느 쪽에 붙일지도 뜻이 없습니다.
      .filter((option) => option.id !== 'LOGO_SIDE' || logoSource !== 'none')
      .map((option) => {
        const pairId = contrastPairId(option.id);
        const pairValue = pairId ? options.get(pairId) : undefined;
        // exactOptionalPropertyTypes 라 contrastAgainst 에 undefined 를 명시적으로
        // 넘길 수 없습니다. 값이 있을 때만 속성 자체를 붙입니다.
        const contrastProps = typeof pairValue === 'string' ? { contrastAgainst: pairValue } : {};
        return (
          <OptionField
            key={option.id}
            option={option}
            value={options.get(option.id) ?? option.default}
            disabled={locked}
            onChange={(value) => setOption(option.id, value)}
            unitMode={unitMode}
            pxPerUnit={pxPerUnit}
            onToggleUnit={() => setUnitMode(unitMode === 'u' ? 'px' : 'u')}
            {...contrastProps}
          />
        );
      });

  const contentFor = (tabValue: RailTab) => {
    switch (tabValue) {
      case 'preset':
        return (
          <fieldset className="preset-grid" disabled={locked}>
            <legend>{t('rail.preset')}</legend>
            {PRESETS.map((preset) => {
              const isSelected = presetId === preset.id;
              const thumbnail = presetThumbnails.get(preset.id);
              // 아직 그려지지 않았으면(서체 대기 등) src 자체를 생략합니다. undefined 를
              // 그대로 넘기면 exactOptionalPropertyTypes 에 걸립니다.
              const imageProps = thumbnail
                ? { src: thumbnail.src, width: thumbnail.width, height: thumbnail.height }
                : {};
              return (
                <label key={preset.id} className="preset-card" data-selected={isSelected}>
                  <input
                    type="radio"
                    name="preset"
                    value={preset.id}
                    checked={isSelected}
                    onChange={() => setPreset(preset.id)}
                    disabled={locked}
                    className="hs-radio-input"
                  />
                  <span className="hs-radio-box" aria-hidden="true" />
                  {/* 장식용 예시 그림입니다. 이름이 바로 이어지는 글자로 있으므로 alt 를
                   * 비워 화면 낭독기가 같은 말을 두 번 읽지 않게 합니다. */}
                  <img alt="" className="preset-card-image" {...imageProps} />
                  <span className="preset-card-name">{t(preset.labelKey as MessageKey)}</span>
                </label>
              );
            })}
          </fieldset>
        );
      case 'frame':
        return <div className="field-list">{renderOptions(grouped.frame)}</div>;
      case 'arrangement':
        return (
          <div className="field-list">
            <fieldset className="preset-list" disabled={locked}>
              <legend>{t('rail.arrangement')}</legend>
              {arrangementsForLayout(layout).map((arrangement) => {
                const isSelected = arrangementId === arrangement.id;
                return (
                  <label key={arrangement.id} className="preset-item" data-selected={isSelected}>
                    <input
                      type="radio"
                      name="arrangement"
                      value={arrangement.id}
                      checked={isSelected}
                      onChange={() => setArrangement(arrangement.id)}
                      disabled={locked}
                      className="hs-radio-input"
                    />
                    <span className="hs-radio-box" aria-hidden="true" />
                    {t(arrangement.labelKey as MessageKey)}
                  </label>
                );
              })}
            </fieldset>
            {renderOptions(grouped.arrangement)}
          </div>
        );
      case 'export': {
        const exportOptions: ListboxOption<ExportPreset>[] = EXPORT_SIZES.map((size) => ({
          value: size,
          label: t(`export.size.${size}` as MessageKey),
        }));
        // 키를 단언 없이 조립합니다. 세 형식 중 하나라도 사전에 없으면 tsc 가 잡습니다.
        const formatOptions: ListboxOption<ExportFormatId>[] = exportFormats.map((format) => ({
          value: format,
          label: t(`export.format.${format}`),
        }));
        return (
          <div className="field-list">
            <div className="hs-field">
              <label htmlFor="export-size">{t('export.size')}</label>
              <Listbox
                id="export-size"
                label={t('export.size')}
                value={exportSize}
                options={exportOptions}
                disabled={locked}
                onChange={setExportSize}
              />
            </div>
            <div className="hs-field">
              <label htmlFor="export-format">{t('export.format')}</label>
              <Listbox
                id="export-format"
                label={t('export.format')}
                value={exportFormat}
                options={formatOptions}
                disabled={locked}
                onChange={setExportFormat}
              />
            </div>
            <button type="button" className="hs-button" onClick={onDownload} disabled={!hasPhoto || busy}>
              {busy ? t('action.downloading') : t('action.download')}
            </button>
            {exportTargetName && <p className="hint">{t('export.target', { name: exportTargetName })}</p>}
          </div>
        );
      }
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
