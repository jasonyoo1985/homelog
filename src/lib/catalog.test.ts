import { describe, expect, it } from 'vitest';
import { entriesOfItem, itemOptions, norm, parseCatalog, prefillFromEntry, roomFor } from './catalog';
import type { CatalogEntry } from '@/db/types';

const E = (o: Partial<CatalogEntry>): CatalogEntry => ({ id: 'x', item: '강마루', category: '바닥재/마루/타일', space: '거실', variant: '기본·확장형', trade: '건축', name: '광폭 하이브리드 강마루(115*800)', model: 'SERA DL-HYBRID NORDIC ASH(세라 디엘 하이브리드 노르딕 애쉬)', maker: '이건마루', ...o });
const all = [E({ id: 'a' }), E({ id: 'b', variant: '확장형 유상옵션2', name: '광폭 동조 플렉스 강마루(143*1200)', model: 'SERA FLEX DL-NORDIC FLEX', space: '침실2,3' }),
  E({ id: 'c', item: '바닥 타일', name: '바닥 타일', model: 'IRENE GREY BASAL(600*600)', maker: '가영세라믹스', space: '현관', category: '바닥재/마루/타일' })];

describe('catalog', () => {
  it('품목 목록은 가나다순 + 개수, 검색은 제품명·모델명까지 본다', () => {
    expect(itemOptions(all)).toEqual([{ item: '강마루', count: 2 }, { item: '바닥 타일', count: 1 }]);
    expect(itemOptions(all, '노르딕').map((o) => o.item)).toEqual(['강마루']);
    expect(itemOptions(all, 'irene').map((o) => o.item)).toEqual(['바닥 타일']);
    expect(itemOptions(all, '없는검색어')).toEqual([]);
  });
  it('품목 안의 제품 검색(모델명/공간/옵션/업체)', () => {
    expect(entriesOfItem(all, '강마루')).toHaveLength(2);
    expect(entriesOfItem(all, '강마루', 'nordic flex').map((e) => e.id)).toEqual(['b']);
    expect(entriesOfItem(all, '강마루', '유상옵션2').map((e) => e.id)).toEqual(['b']);
    expect(entriesOfItem(all, '강마루', '이건').length).toBe(2);
    expect(norm('A (b)-C')).toBe('abc');
  });
  it('공간 이름 매핑', () => {
    const rooms = ['거실', '주방', '안방', '작은방', '욕실1', '욕실2', '현관', '다용도실', '베란다'];
    expect(roomFor('주방/식당', rooms)).toBe('주방');
    expect(roomFor('침실1/드레스룸', rooms)).toBe('안방');
    expect(roomFor('침실2,3', rooms)).toBe('작은방');
    expect(roomFor('욕실1,욕실2', rooms)).toBe('욕실1');
    expect(roomFor('실외기실(하향식피난구)', rooms)).toBe('베란다');
    expect(roomFor('복도', rooms)).toBe('복도');
  });
  it('폼 미리 채우기: 규격은 괄호 안 크기, 옵션이면 옵션 표시', () => {
    const p = prefillFromEntry(all[1], ['거실', '작은방']);
    expect(p.name).toBe('광폭 동조 플렉스 강마루');
    expect(p.spec).toBe('143*1200 · 확장형 유상옵션2');
    expect(p.roomName).toBe('작은방'); expect(p.brand).toBe('이건마루');
  });
  it('가져오기 파일 검증: 잘못된 항목·중복 id는 버리고, 형식이 다르면 null', () => {
    const r = parseCatalog({ app: 'homelog', kind: 'catalog', title: 't', items: [all[0], all[0], { id: 'z' }, { ...all[2], category: '이상한값' }] })!;
    expect(r.entries.map((e) => e.id)).toEqual(['a', 'c']);
    expect(r.entries[1].category).toBe('기타');
    expect(parseCatalog({ app: 'homelog', kind: 'pack', materials: [] })).toBeNull();
    expect(parseCatalog(null)).toBeNull();
  });
});
