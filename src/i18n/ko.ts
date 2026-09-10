/**
 * 한국어 사전입니다. 키와 문자열의 유일한 출처이고, 영어는 나중에 이 모양의 파일을 하나 더
 * 두면 됩니다. 라이브러리를 쓰지 않는 이유는 키가 백 개 남짓이라 타입이 붙은 사전 하나로
 * 충분하고, 그래야 키 오타를 컴파일 시점에 잡을 수 있기 때문입니다.
 */
export const ko = {
  // 레일
  'rail.preset': '프리셋',
  'rail.frame': '프레임',
  'rail.text': '텍스트',
  'rail.export': '내보내기',
  'rail.label': '설정 묶음',

  // 프리셋 이름
  'preset.body-lens': '바디와 렌즈',
  'preset.gear-exposure': '장비와 노출',
  'preset.one-line': '한 줄',
  'preset.shot-on': 'Shot on',
  'preset.minimal': '미니멀',
  'preset.film': '필름 데이터백',
  'preset.polaroid': '폴라로이드',
  'preset.letterbox': '레터박스',
  'preset.poster': '포스터',

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
  'option.SUB_SCALE': '부 줄 비율',
  'option.FONT_WEIGHT': '글자 굵기',
  'option.FONT_FAMILY': '서체',
  'option.DIVIDER': '구분자',
  'option.PRIMARY_MAIN': '왼쪽 주 줄',
  'option.PRIMARY_SUB': '왼쪽 부 줄',
  'option.SECONDARY_MAIN': '오른쪽 주 줄',
  'option.SECONDARY_SUB': '오른쪽 부 줄',
  'option.FOOTER': '꼬리 줄',

  // 옵션 값 이름
  'value.MODE.split': '좌우 나눔',
  'value.MODE.single': '한 덩어리',
  'value.MODE.poster': '포스터',
  'value.ALIGN.left': '왼쪽',
  'value.ALIGN.center': '가운데',
  'value.ALIGN.right': '오른쪽',

  // 내보내기
  'export.size': '크기',
  'export.size.original': '원본',
  'export.size.4k': '4K',
  'export.size.2k': '2K',
  'export.size.sns': 'SNS',
  'action.download': '내려받기',
  'action.downloading': '만드는 중입니다',
  'action.pick': '사진 고르기',

  // 상태
  'status.preparing': '준비하는 중입니다',
  'status.readyToDrop': '사진을 끌어다 놓거나 위에서 고르십시오',
  'status.reading': '읽는 중입니다',
  'status.loaded': '{name} 파일을 불러왔습니다',
  'status.onlyFirst': '{name} 파일 하나만 불러왔습니다. 여러 장을 한 번에 처리하는 기능은 아직 없습니다',
  'status.rendering': '전체 해상도로 그리는 중입니다',
  'status.downloaded': '내려받았습니다. {width}x{height}',
  'status.downloadedClamped': '내려받았습니다. 기기 한계 때문에 {width}x{height} 로 줄였습니다',
  'status.fontFailed': '{font} 서체를 불러오지 못했습니다',

  // 드롭
  'drop.hint': '창 어디에나 사진을 끌어다 놓을 수 있습니다',
  'drop.active': '여기에 놓으십시오',

  // 캔버스
  'canvas.empty': '아직 불러온 사진이 없습니다',
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
