import { describe, expect, it } from 'vitest';
import { buildScene, type SceneRequest } from './buildScene';
import { BAR_OPTIONS, barLayout } from '../layout/layouts/bar';
import { defaultValues } from '../layout/options';
import type { LayoutServices, SceneNode } from '../layout/types';

const services: LayoutServices = {
  measureText: (text, style) => text.length * style.size * 0.5,
  hasLogo: () => false,
};

const FIELDS = {
  MAKER: 'Canon',
  BODY: 'EOS R6',
  MM: '50mm',
  F: 'f/2.8',
  SEC: '1/250s',
  ISO: 'ISO 400',
};

function requestFor(photoPx: { width: number; height: number }): SceneRequest {
  return {
    photoPx,
    fields: FIELDS,
    logoId: undefined,
    layout: barLayout,
    options: defaultValues(BAR_OPTIONS),
    services,
  };
}

/** 노드 종류마다 비교할 수치 필드만 뽑습니다. */
function numeric(node: SceneNode): number[] {
  switch (node.kind) {
    case 'image':
    case 'rect':
    case 'logo':
      return [node.x, node.y, node.w, node.h];
    case 'text':
      return [node.x, node.y];
  }
}

describe('buildScene', () => {
  it('사진의 짧은 변이 1000 디자인 단위에 대응합니다', () => {
    // barLayout의 캔버스 높이는 사진 높이(가로 사진에서는 짧은 변)에 바 높이(기본 120)를
    // 더한 값이므로, 바 높이를 빼면 사진의 짧은 변만 남습니다.
    const wide = buildScene(requestFor({ width: 6000, height: 4000 }));
    expect(wide.height - 120).toBe(1000);

    // 세로 사진에서는 짧은 변이 너비 쪽입니다. barLayout은 너비를 그대로 사진
    // 너비로 두므로 여기서는 바 높이를 빼지 않아도 됩니다.
    const tall = buildScene(requestFor({ width: 4000, height: 6000 }));
    expect(tall.width).toBe(1000);
  });

  it('미리보기 크기와 전체 해상도 크기가 같은 노드 구조와 가까운 좌표를 냅니다', () => {
    // 6000x4000(3:2) 원본을 브라우저가 긴 변 1600으로 축소 디코딩하면 세로는
    // 4000*1600/6000 = 1066.667을 반올림한 1067이 됩니다. 정확히 같은 비율이
    // 아니므로 미세한 반올림 오차가 남습니다. 이 오차가 미리보기와 결과물의
    // 노드 구조 자체를 바꾸지는 않는다는 것이 이 테스트의 핵심입니다.
    const full = buildScene(requestFor({ width: 6000, height: 4000 }));
    const preview = buildScene(requestFor({ width: 1600, height: 1067 }));

    expect(preview.nodes.map((n) => n.kind)).toEqual(full.nodes.map((n) => n.kind));
    expect(preview.nodes.filter((n) => n.kind === 'text').map((n) => n.text)).toEqual(
      full.nodes.filter((n) => n.kind === 'text').map((n) => n.text),
    );

    for (let i = 0; i < full.nodes.length; i += 1) {
      const a = numeric(full.nodes[i]!);
      const b = numeric(preview.nodes[i]!);
      for (let k = 0; k < a.length; k += 1) {
        expect(Math.abs(a[k]! - b[k]!)).toBeLessThan(1);
      }
    }
    expect(Math.abs(full.width - preview.width)).toBeLessThan(1);
    expect(Math.abs(full.height - preview.height)).toBeLessThan(1);
  });

  it('실제 카메라 해상도 중 어긋남이 큰 경우에도 1 디자인 단위 안에 머무릅니다', () => {
    // 6048x4024는 3:2에 아주 가깝지만 정확히 3:2는 아닌 해상도입니다(일부 니콘
    // 기종). 반올림이 나쁜 방향으로 겹쳐 실측한 어긋남 중 큰 축에 듭니다.
    const full = buildScene(requestFor({ width: 6048, height: 4024 }));
    const preview = buildScene(requestFor({ width: 1600, height: 1065 }));
    const drift = Math.abs(full.width - preview.width);
    expect(drift).toBeLessThan(1);
    expect(drift).toBeGreaterThan(0.5);
  });
});
