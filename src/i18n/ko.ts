/**
 * 한국어 사전입니다. 키와 문자열의 유일한 출처이고, 영어는 나중에 이 모양의 파일을 하나 더
 * 두면 됩니다. 라이브러리를 쓰지 않는 이유는 키가 백 개 남짓이라 타입이 붙은 사전 하나로
 * 충분하고, 그래야 키 오타를 컴파일 시점에 잡을 수 있기 때문입니다.
 */
export const ko = {
  // 레일
  'rail.preset': '프리셋',
  'rail.frame': '프레임',
  'rail.arrangement': '배치',
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

  // 배치 이름. 어떤 정보가 어디 들어가는지를 설명합니다. id 는 지금 같은 이름의
  // 프리셋에서 1:1 로 뽑았지만, 배치 칸에서는 프레임과 별개로 골라 쓸 수 있습니다.
  'arrangement.body-lens': '왼쪽에 제조사와 바디, 오른쪽에 렌즈 제조사와 모델, 꼬리에 노출값',
  'arrangement.gear-exposure': '왼쪽에 장비와 렌즈, 오른쪽에 노출값',
  'arrangement.one-line': '한 줄에 장비와 노출값 전부',
  'arrangement.shot-on': 'Shot on 문구와 노출값',
  'arrangement.minimal': '장비명만',
  'arrangement.film': '왼쪽에 촬영 일시, 오른쪽에 노출값',
  'arrangement.polaroid': '왼쪽에 장비, 오른쪽에 노출값',
  'arrangement.letterbox': '장비와 초점 거리, 조리개를 한 줄로',
  'arrangement.poster': '촬영 일시와 장비를 위아래로',
  'arrangement.one-block': '한 덩이에 장비와 노출값 전부',

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
  'export.target': '{name} 사진을 내려받습니다',

  // 상태
  'status.preparing': '준비하는 중입니다',
  'status.readyToDrop': '사진을 끌어다 놓거나 위에서 고르십시오',
  'status.reading': '읽는 중입니다',
  'status.loaded': '{name} 파일을 불러왔습니다',
  'status.tooMany': '사진은 최대 {max}장까지 담을 수 있습니다. 자리가 남는 만큼만 더했습니다',
  'status.full': '사진을 이미 {max}장 담았습니다. 더 넣으려면 몇 장을 빼야 합니다',
  'status.rendering': '전체 해상도로 그리는 중입니다',
  'status.downloaded': '내려받았습니다. {width}x{height}',
  'status.downloadedClamped': '내려받았습니다. 기기 한계 때문에 {width}x{height} 로 줄였습니다',
  'status.fontFailed': '{font} 서체를 불러오지 못했습니다',

  // 드롭
  'drop.hint': '창 어디에나 사진을 끌어다 놓을 수 있습니다',
  'drop.active': '여기에 놓으십시오',

  // 사진 목록
  'photos.legend': '불러온 사진',
  'photos.selectAll': '전체 선택',
  'photos.deselectAll': '전체 해제',
  'photos.count': '{count}장',

  // 커스텀 컨트롤
  'control.increase': '{label} 늘리기',
  'control.decrease': '{label} 줄이기',

  // 색 고르기 창
  'colorPicker.pick': '{label} 고르기',
  'colorPicker.close': '닫기',
  'colorPicker.hue': '색상',
  'colorPicker.saturation': '채도',
  'colorPicker.brightness': '명도',
  'colorPicker.hex': '16진값',
  'colorPicker.contrastRatio': '지금 배경과 대비 {ratio}:1입니다',
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
