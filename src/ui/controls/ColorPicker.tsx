import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { contrastRatio } from '../contrast';
import { clampHsv, hexToHsv, hsvToHex, type Hsv } from '../colorSpace';
import { t } from '../../i18n';
import { wrapIndex } from './listboxLogic';
import { Slider } from './Slider';
import { TextField } from './TextField';

/** 창 안에서 Tab 을 가둘 때 훑는 조작 요소입니다. 판(.hs-colorpicker-pad)은 button 도
 * input 도 아니라 이 목록에 걸리지 않습니다. */
const FOCUSABLE_SELECTOR = 'button:not(:disabled), input:not(:disabled)';

/** 본문 글자의 WCAG 2.2 AA 최소 대비입니다. */
const AA_TEXT_CONTRAST = 4.5;

/**
 * `input[type=color]` 를 대체합니다. 견본 단추를 누르면 우리가 그린 창이 뜹니다.
 *
 * 색상과 채도를 2차원 판으로만 고르게 하면 키보드 사용자가 색을 정할 수 없습니다(ARIA 에
 * 2차원 슬라이더가 없습니다). 그래서 길을 둘로 둡니다. 판은 마우스 편의용으로
 * aria-hidden 이고, 색상·채도·명도 슬라이더 셋과 16진수 입력칸이 접근 가능한 경로입니다.
 * 판을 끌면 슬라이더가 따라오고 슬라이더를 만지면 판의 표시가 따라오도록 둘 다 같은
 * `hsv` 상태 하나를 읽고 씁니다.
 *
 * `hsv` 는 `value`(부모의 #rrggbb) 에서 매번 다시 뽑지 않고 창이 열릴 때만 한 번
 * 읽습니다. 채도가 0인 회색을 지나는 동안 매번 다시 뽑으면 색상각 정보가 사라져,
 * 판을 눌러 회색을 지나쳐 다시 색이 있는 쪽으로 끌 때 색상이 튀기 때문입니다.
 */
export function ColorPicker(props: {
  id?: string;
  /** 견본 단추의 접근 가능한 이름에 쓸, 이미 번역된 필드 이름입니다(예: "배경색"). */
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  /** 대비를 비교할 상대 색입니다(예: 프레임 배경색). 생략하면 대비를 보이지 않습니다. */
  contrastAgainst?: string;
}) {
  const { id, label, value, disabled = false, onChange, contrastAgainst } = props;

  const autoId = useId();
  const swatchId = id ?? autoId;
  const titleId = `${swatchId}-title`;

  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value) ?? { h: 0, s: 0, v: 0 });
  const [hexDraft, setHexDraft] = useState(value);

  const panelRef = useRef<HTMLDivElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 창이 열릴 때만 부모 값을 다시 읽습니다. 아래 이유로 value 를 의존성에 넣지 않습니다.
  useEffect(() => {
    if (!open) return;
    setHsv(hexToHsv(value) ?? { h: 0, s: 0, v: 0 });
    setHexDraft(value);
    // eslint 설정이 없는 저장소라 별도 억제 주석 없이, 의도적으로 open 만 의존성에 둡니다.
  }, [open]);

  // 창이 열리면 첫 조작 요소(색상 슬라이더)로 초점을 옮기고, 닫히면 열기 전 자리로
  // 되돌립니다. 문서 처음으로 튀면 키보드 사용자가 길을 잃기 때문입니다.
  useEffect(() => {
    if (open) {
      const firstControl = panelRef.current?.querySelector<HTMLElement>('input[type="range"]');
      firstControl?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [open]);

  const openPicker = () => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  };

  const close = () => setOpen(false);

  const commit = (next: Hsv) => {
    const clamped = clampHsv(next);
    setHsv(clamped);
    const hex = hsvToHex(clamped);
    setHexDraft(hex);
    onChange(hex);
  };

  const onHexInput = (text: string) => {
    setHexDraft(text);
    const parsed = hexToHsv(text);
    if (!parsed) return;
    setHsv(parsed);
    onChange(hsvToHex(clampHsv(parsed)));
  };

  const handlePad = (event: PointerEvent<HTMLDivElement>) => {
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const s = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const v = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    commit({ ...hsv, s, v });
  };

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) return;
    const current = document.activeElement as HTMLElement | null;
    const currentIndex = current ? focusable.indexOf(current) : -1;
    const nextIndex = wrapIndex(currentIndex, focusable.length, event.shiftKey ? -1 : 1);
    event.preventDefault();
    if (nextIndex !== null) focusable[nextIndex]?.focus();
  };

  const openLabel = t('colorPicker.pick', { label });
  const ratio = contrastAgainst ? contrastRatio(value, contrastAgainst) : null;

  // 판의 배경입니다. 왼쪽에서 오른쪽으로 흰색에서 지금 색상각의 순색으로(채도),
  // 위에서 아래로 투명에서 검정으로(명도) 겹칩니다. 사용자가 고르는 임의의 색을
  // 그리는 자리라 ui.css 의 :root 토큰이 아니라 hsl() 을 직접 씁니다.
  const padBackground = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))`;

  return (
    <div className="hs-colorpicker">
      <button
        type="button"
        id={swatchId}
        className="hs-colorpicker-swatch"
        style={{ backgroundColor: value }}
        aria-label={openLabel}
        disabled={disabled}
        onClick={() => (open ? close() : openPicker())}
      />
      <span className="hs-colorpicker-value" aria-hidden="true">
        {value}
      </span>
      {open && (
        <div className="hs-colorpicker-backdrop" onMouseDown={close}>
          <div
            ref={panelRef}
            className="hs-colorpicker-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={onPanelKeyDown}
          >
            <div className="hs-colorpicker-header">
              <span id={titleId} className="hs-colorpicker-title">
                {openLabel}
              </span>
              <button
                type="button"
                className="hs-colorpicker-close"
                aria-label={t('colorPicker.close')}
                onClick={close}
              >
                <X aria-hidden="true" size={16} />
              </button>
            </div>

            <div
              ref={padRef}
              className="hs-colorpicker-pad"
              aria-hidden="true"
              style={{ background: padBackground }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                handlePad(event);
              }}
              onPointerMove={(event) => {
                if (event.buttons !== 1) return;
                handlePad(event);
              }}
            >
              <div
                className="hs-colorpicker-pad-thumb"
                style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
              />
            </div>

            <label className="hs-field">
              <span>{t('colorPicker.hue')}</span>
              <Slider
                value={Math.round(hsv.h)}
                min={0}
                max={360}
                step={1}
                unit="°"
                onChange={(next) => commit({ ...hsv, h: next })}
              />
            </label>

            <label className="hs-field">
              <span>{t('colorPicker.saturation')}</span>
              <Slider
                value={Math.round(hsv.s * 100)}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(next) => commit({ ...hsv, s: next / 100 })}
              />
            </label>

            <label className="hs-field">
              <span>{t('colorPicker.brightness')}</span>
              <Slider
                value={Math.round(hsv.v * 100)}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(next) => commit({ ...hsv, v: next / 100 })}
              />
            </label>

            <label className="hs-field">
              <span>{t('colorPicker.hex')}</span>
              <TextField value={hexDraft} onChange={onHexInput} />
            </label>

            {ratio !== null && (
              <p className="hs-colorpicker-contrast" data-insufficient={ratio < AA_TEXT_CONTRAST}>
                {t('colorPicker.contrastRatio', { ratio: ratio.toFixed(2) })}{' '}
                {ratio >= AA_TEXT_CONTRAST
                  ? t('colorPicker.contrastPass')
                  : t('colorPicker.contrastFail')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
