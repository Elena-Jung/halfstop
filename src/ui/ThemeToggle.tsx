import { Moon, Sun } from 'lucide-react';
import { t } from '../i18n';
import type { Theme } from './useTheme';

/**
 * 우상단의 밝기 선택기입니다. 단추 하나로 토글하고, 이름표가 "밝은 테마로 바꿉니다"
 * 처럼 눌렀을 때 일어날 일을 그대로 말합니다. 화면 낭독기 사용자는 이 문장만으로
 * 지금이 반대 테마임을 알 수 있습니다. 아이콘은 지금 테마가 아니라 눌렀을 때 옮겨갈
 * 테마를 가리킵니다(어두운 테마에서는 해, 밝은 테마에서는 달).
 *
 * 내보내는 동안(busy)에도 잠그지 않습니다. 테마는 프레임에 그려지는 결과물과
 * 무관해서 잠글 이유가 없습니다.
 */
export function ThemeToggle(props: { theme: Theme; onToggle: () => void }) {
  const { theme, onToggle } = props;
  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? t('theme.toLight') : t('theme.toDark');

  return (
    <button type="button" className="theme-toggle" aria-label={label} onClick={onToggle}>
      <Icon aria-hidden="true" size={20} />
    </button>
  );
}
