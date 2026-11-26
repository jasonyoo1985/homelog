export interface MonthlyTask { key: string; title: string; why: string }

/** 매달 공통으로 챙기면 좋은 일 */
export const EVERY_MONTH: MonthlyTask[] = [
  { key: 'breaker', title: '누전차단기 시험버튼 눌러 보기', why: '세대 분전반의 차단기 시험버튼을 눌러 내려가는지 확인하세요. 내려갔으면 다시 올려 두면 돼요. 월 1회 확인이 권장돼요.' },
  { key: 'drain', title: '배수구 머리카락·찌꺼기 치우기', why: '욕실과 싱크대 배수구를 비우면 냄새와 막힘을 막을 수 있어요.' },
  { key: 'hood', title: '주방 후드 필터 기름때 확인', why: '기름때가 쌓이면 흡입력이 떨어져요. 심하면 세척하거나 교체하세요.' },
];

/** 달별로 때에 맞는 일 (1~12월). 지역·집 상태에 따라 다를 수 있는 일반적인 안내예요. */
export const BY_MONTH: Record<number, MonthlyTask[]> = {
  1: [{ key: 'freeze', title: '동파 예방 점검', why: '한파 때 베란다·실외기실 수도와 계량기가 얼지 않게 보온하고, 장기간 집을 비울 땐 외출 모드를 쓰세요.' }],
  2: [{ key: 'mold', title: '결로·곰팡이 점검', why: '창가와 벽 모서리, 가구 뒤를 확인하세요. 가구는 벽에서 5~10cm 띄우면 환기에 도움이 돼요.' }],
  3: [{ key: 'vent-filter', title: '환기 필터 점검·청소', why: '봄철 미세먼지에 대비해 환기장치 필터 상태를 확인하세요.' }],
  4: [{ key: 'ac-filter', title: '에어컨 필터 청소', why: '냉방을 켜기 전에 필터를 씻어 두면 냄새와 효율 저하를 줄일 수 있어요.' }],
  5: [{ key: 'screen', title: '방충망·창문 틈 확인', why: '벌레가 늘기 전에 방충망 찢어짐과 창틀 틈을 살펴보세요.' }],
  6: [{ key: 'rain', title: '장마 전 배수구·누수 점검', why: '베란다와 실외기실 배수구가 막히지 않았는지, 천장이나 벽에 얼룩이 없는지 확인하세요.' }],
  7: [{ key: 'ac-dew', title: '에어컨 결로·물받이 확인', why: '에어컨 배관 주변에 물이 맺히거나 떨어지지 않는지 살펴보세요.' }],
  8: [{ key: 'bath-mold', title: '욕실·다용도실 곰팡이 점검', why: '습한 시기라 실리콘 줄눈과 모서리에 곰팡이가 생기기 쉬워요.' }],
  9: [{ key: 'boiler-book', title: '보일러 점검 예약', why: '난방을 시작하기 전에 점검을 받아 두면 한겨울 고장을 줄일 수 있어요.' }],
  10: [{ key: 'boiler-test', title: '보일러·난방 시험 가동', why: '추워지기 전에 한 번 켜서 정상 작동하는지 확인하세요. 현관·창 틈 바람도 점검해요.' }],
  11: [{ key: 'doorlock', title: '도어락 건전지 확인', why: '추위에 배터리가 빨리 닳을 수 있어요. 겨울이 오기 전에 교체해 두세요.' }],
  12: [{ key: 'backup', title: '한 해 기록 정리와 백업', why: '올해 수리·문서 기록을 정리하고 백업 파일을 만들어 두세요.' }],
};

export function tasksForMonth(month: number): MonthlyTask[] {
  return [...EVERY_MONTH, ...(BY_MONTH[month] ?? [])];
}
