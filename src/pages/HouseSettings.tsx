import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { HousingType } from '@/db/types';
import { BackHeader } from '@/components/BackHeader';
import { Field, TextInput, inputCls } from '@/components/Field';
import { Loading } from '@/components/EmptyState';
import { useToast } from '@/components/Toast';

const TYPES: HousingType[] = ['아파트', '빌라', '주택', '오피스텔', '기타'];

export function HouseSettings() {
  const nav = useNavigate();
  const toast = useToast();
  const house = useLiveQuery(() => db.houses.toCollection().first(), []);
  const [name, setName] = useState('');
  const [type, setType] = useState<HousingType>('아파트');
  const [area, setArea] = useState('');
  const [moveIn, setMoveIn] = useState('');
  const [built, setBuilt] = useState('');
  const [rooms, setRooms] = useState<string[]>([]);
  const [newRoom, setNewRoom] = useState('');

  useEffect(() => {
    if (!house) return;
    setName(house.name); setType(house.housingType); setArea(house.areaPyeong?.toString() ?? '');
    setMoveIn(house.moveInDate ?? ''); setBuilt(house.builtYear?.toString() ?? ''); setRooms(house.rooms);
  }, [house]);

  if (!house) return <Loading />;

  const addRoom = () => {
    const r = newRoom.trim();
    if (r && !rooms.includes(r)) setRooms([...rooms, r]);
    setNewRoom('');
  };
  async function save() {
    await db.houses.update(house!.id, {
      name: name.trim() || '우리 집', housingType: type, areaPyeong: Number(area) > 0 ? Number(area) : undefined,
      moveInDate: moveIn || undefined, builtYear: Number(built) > 0 ? Number(built) : undefined, rooms, updatedAt: Date.now(),
    });
    toast.show('우리 집 정보를 저장했어요');
    nav('/');
  }

  return (
    <>
      <BackHeader title="우리 집 설정" to="/" />
      <div className="flex flex-col gap-4">
        <div className="card-3d flex flex-col gap-4 p-4">
          <Field label="집 이름"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="주거 형태">
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as HousingType)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="전용 면적(평)"><TextInput inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value.replace(/[^\d.]/g, ''))} /></Field>
            <Field label="준공 연도"><TextInput inputMode="numeric" value={built} onChange={(e) => setBuilt(e.target.value.replace(/\D/g, '').slice(0, 4))} /></Field>
          </div>
          <Field label="입주일"><TextInput type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} /></Field>
        </div>
        <div className="card-3d p-4">
          <h2 className="mb-3 text-sm font-bold">공간</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {rooms.map((r) => (
              <span key={r} className="chip gap-1.5">{r}
                <button aria-label={`${r} 삭제`} className="text-ink-sub" onClick={() => setRooms(rooms.filter((x) => x !== r))}>✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <TextInput value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder="공간 추가 (예: 드레스룸)" onKeyDown={(e) => e.key === 'Enter' && addRoom()} />
            <button className="btn-soft shrink-0 !px-4" onClick={addRoom}>추가</button>
          </div>
          <p className="mt-2 text-xs text-ink-sub">공간을 지워도 이미 등록한 자재는 그대로 유지돼요.</p>
        </div>
        <button className="btn-3d" onClick={save}>저장하기</button>
      </div>
    </>
  );
}
