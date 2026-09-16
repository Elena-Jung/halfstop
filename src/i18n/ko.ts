/**
 * 한국어 사전입니다. 키와 문자열의 유일한 출처이고, 영어는 나중에 이 모양의 파일을 하나 더
 * 두면 됩니다. 라이브러리를 쓰지 않는 이유는 키가 백 개 남짓이라 타입이 붙은 사전 하나로
 * 충분하고, 그래야 키 오타를 컴파일 시점에 잡을 수 있기 때문입니다.
 */
export const ko = {
  // 테마 선택기
  'theme.toLight': '밝은 테마로 바꿉니다',
  'theme.toDark': '어두운 테마로 바꿉니다',

  // 레일
  'rail.preset': '프리셋',
  'rail.frame': '세부조정',
  'rail.arrangement': '배치',
  'rail.export': '다운로드',
  'rail.label': '설정 묶음',

  // 프리셋 이름. 사진을 감싸는 모양만 설명합니다. 어떤 정보가 들어가는지는 배치 이름이
  // 설명하므로 두 목록의 이름이 겹치지 않습니다.
  'preset.bar': '하단 바',
  'preset.film': '필름 데이터백',
  'preset.polaroid': '폴라로이드',
  'preset.letterbox': '레터박스',
  'preset.poster': '포스터',

  // 배치 이름. 어떤 정보가 어디 들어가는지를 설명합니다. id 는 예전 프리셋에서 1:1 로
  // 뽑았지만, 배치 칸에서는 프레임과 별개로 골라 쓸 수 있습니다. 사용자가 하나씩
  // 눌러 보며 미리보기로 판단하므로 이름은 짧게 둡니다.
  'arrangement.body-lens': '바디와 렌즈',
  'arrangement.gear-exposure': '장비와 노출',
  'arrangement.one-line': '한 줄',
  'arrangement.shot-on': 'Shot on',
  'arrangement.minimal': '장비명만',
  'arrangement.film': '일시와 노출',
  'arrangement.polaroid': '장비와 노출',
  'arrangement.letterbox': '장비와 조리개',
  'arrangement.poster': '일시와 장비',
  'arrangement.one-block': '한 덩이',
  'arrangement.exposure-gear': '노출과 장비',

  // 옵션 이름
  'option.MODE': '배치',
  'option.ALIGN': '정렬',
  'option.BACKGROUND': '배경색',
  'option.TEXT_COLOR': '글자색',
  'option.BAR_HEIGHT': '바 높이',
  'option.SIDE_PADDING': '좌우 여백',
  'option.PAD_TOP': '위 여백',
  'option.PAD_RIGHT': '오른쪽 여백',
  'option.PAD_BOTTOM': '아래 여백',
  'option.PAD_LEFT': '왼쪽 여백',
  'option.FONT_SIZE': '글자 크기',
  'option.SUB_SCALE': '작은 줄 비율',
  'option.FONT_WEIGHT': '글자 굵기',
  'option.FONT_FAMILY': '서체',
  'option.DIVIDER': '구분자',
  'option.AUTHOR': '작가',
  'option.PRIMARY_MAIN': '왼쪽 큰 줄',
  'option.PRIMARY_SUB': '왼쪽 작은 줄',
  'option.SECONDARY_MAIN': '오른쪽 큰 줄',
  'option.SECONDARY_SUB': '오른쪽 작은 줄',
  'option.FOOTER': '꼬리 줄',
  'option.LOGO_SOURCE': '브랜드 로고',
  'option.LOGO_SIDE': '로고가 붙는 쪽',

  // 옵션 값 이름
  'value.MODE.split': '좌우 나눔',
  'value.MODE.single': '한 덩이',
  'value.MODE.poster': '포스터',
  'value.ALIGN.left': '왼쪽',
  'value.ALIGN.center': '가운데',
  'value.ALIGN.right': '오른쪽',
  // 로고를 누구의 것으로 그릴지입니다. 끄는 것도 이 목록이 함께 맡습니다.
  'value.LOGO_SOURCE.none': '없음',
  'value.LOGO_SOURCE.body': '바디 제조사',
  'value.LOGO_SOURCE.lens': '렌즈 제조사',
  'value.LOGO_SIDE.left': '왼쪽',
  'value.LOGO_SIDE.right': '오른쪽',

  // 내보내기
  'export.size': '크기',
  'export.size.original': '원본',
  'export.size.4k': '4K',
  'export.size.2k': '2K',
  'export.size.sns': 'SNS',
  'export.format': '형식',
  'export.format.jpeg': 'JPEG',
  'export.format.png': 'PNG',
  // WebP 의 대소문자는 이것이 공식 표기입니다.
  'export.format.webp': 'WebP',
  'action.download': '내려받기',
  'action.downloading': '만드는 중입니다',
  'action.pick': '사진 고르기',
  // 아이콘이 이미 이미지를 뜻하므로 글자가 그것을 되풀이하지 않습니다. 화면 낭독기에는
  // 무엇을 더하는지 밝혀야 하므로 aria-label 은 action.pick 을 그대로 씁니다.
  'action.add': '추가',
  'export.target': '{name} 사진을 내려받습니다',

  // 상태
  'status.preparing': '준비하는 중입니다',
  'status.reading': '읽는 중입니다',
  'status.loaded': '{name} 파일을 불러왔습니다',
  'status.tooMany': '최대 {max}장',
  'status.full': '이미 {max}장입니다',
  'status.removed': '{count}장을 뺐습니다',
  'status.rendering': '전체 해상도로 그리는 중입니다',
  'status.downloaded': '내려받았습니다. {width}x{height}',
  'status.downloadedClamped': '내려받았습니다. 기기 한계 때문에 {width}x{height} 로 줄였습니다',
  'status.fontFailed': '{font} 서체를 불러오지 못했습니다',

  // 드롭
  'drop.empty': '사진을 끌어다 놓거나 여기를 눌러 고르십시오',
  'drop.emptyFormats': 'JPEG PNG WebP 지원',
  'drop.emptyMax': '최대 {max}장',
  'drop.active': '여기에 놓으십시오',

  // 사진 목록
  'photos.legend': '불러온 사진',
  'photos.selectAll': '전체 선택',
  'photos.deselectAll': '전체 해제',
  'photos.count': '{count}장',
  'photos.deleteSelected': '선택 삭제',
  'photos.deleteAll': '전체 삭제',

  // 커스텀 컨트롤
  'control.increase': '{label} 늘리기',
  'control.decrease': '{label} 줄이기',
  // 숫자 칸의 단위 단추입니다. 이름표는 지금 단위가 아니라 누르면 무엇이 되는지를
  // 말합니다. 설명은 마우스를 올렸을 때 보이는 title 입니다.
  'unit.toPx': '단위를 픽셀로 바꿉니다',
  'unit.toUnits': '단위를 디자인 단위로 바꿉니다',
  'unit.explain': '디자인 단위입니다. 사진 짧은 변의 1000분의 1이 1u 입니다',

  // 색 고르기 창
  'colorPicker.pick': '{label} 고르기',
  'colorPicker.close': '닫기',
  'colorPicker.hue': '색상',
  'colorPicker.saturation': '채도',
  'colorPicker.brightness': '명도',
  'colorPicker.hex': '16진값',
  'colorPicker.contrastRatio': '지금 배경과의 대비가 {ratio}:1 입니다',
  'colorPicker.contrastPass': '본문 기준 4.5:1을 넘습니다',
  'colorPicker.contrastFail': '본문 기준 4.5:1에 못 미칩니다',

  // 캔버스
  'canvas.empty': '아직 불러온 사진이 없습니다',
  'canvas.noSelection': '고른 사진이 없습니다',
  'canvas.withFrame': '프레임을 씌운 사진 미리보기입니다. 프레임에 적힌 글은 {text} 입니다',

  // 오류
  'error.decode': '이 사진을 열지 못했습니다. 다른 파일로 시도하십시오',
  'error.tooLarge': '사진이 너무 커서 이 기기에서 처리하지 못했습니다',
  'error.canvas': '이 브라우저에서는 그리기를 쓸 수 없습니다',
  'error.encoding': '이 브라우저가 그 형식으로 저장하지 못했습니다. 다른 형식으로 시도하십시오',
  'error.exportSize': '내보낼 크기를 정하지 못했습니다. 여백 값을 확인하십시오',
  'error.worker': '그리는 중에 문제가 생겼습니다. 다시 시도하십시오',
  'error.unknown': '알 수 없는 문제가 생겼습니다',
} as const;

export type MessageKey = keyof typeof ko;
