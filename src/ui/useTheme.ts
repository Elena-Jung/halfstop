import { useCallback, useState } from 'react';
import { writeTheme, type Theme } from '../platform/themeStore';

export type { Theme };

const ATTRIBUTE = 'data-theme';

/**
 * 어두운 테마가 기본이라 :root 에 이미 그 값이 있습니다. 밝은 테마일 때만 속성을 올려
 * [data-theme='light'] 블록이 아홉 토큰을 덮어쓰게 하고, 어두운 테마로 돌아오면
 * 속성을 지워 :root 값이 그대로 드러나게 합니다.
 */
function applyTheme(theme: Theme): void {
  if (theme === 'light') {
    document.documentElement.setAttribute(ATTRIBUTE, 'light');
  } else {
    document.documentElement.removeAttribute(ATTRIBUTE);
  }
}

/**
 * index.html 의 인라인 스크립트가 React 가 그리기 전에 이미 이 속성을 올려 두었습니다.
 * 여기서 localStorage 를 다시 읽지 않고 지금 문서에 올라 있는 속성을 그대로 읽는
 * 이유는, 둘이 어긋나면 첫 렌더에서 반대 테마가 번쩍이기 때문입니다.
 */
function initialTheme(): Theme {
  return document.documentElement.getAttribute(ATTRIBUTE) === 'light' ? 'light' : 'dark';
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      writeTheme(next);
      return next;
    });
  }, []);

  return [theme, toggle];
}
