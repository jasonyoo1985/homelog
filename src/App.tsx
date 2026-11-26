import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ToastProvider } from '@/components/Toast';
import { Loading } from '@/components/EmptyState';
import { ensureHouse } from '@/db/repo';
import { db } from '@/db/db';
import { setReturningUser } from '@/lib/whatsnew';
import { Home } from '@/pages/Home';
import { Materials } from '@/pages/Materials';
import { MaterialForm } from '@/pages/MaterialForm';
import { MaterialDetail } from '@/pages/MaterialDetail';
import { HouseSettings } from '@/pages/HouseSettings';
import { TemplatePicker } from '@/pages/TemplatePicker';
import { Guide } from '@/pages/Guide';
import { Repairs } from '@/pages/Repairs';
import { RepairForm } from '@/pages/RepairForm';
import { RepairDetail } from '@/pages/RepairDetail';
import { Docs } from '@/pages/Docs';
import { DevUpdatePreview } from '@/pages/DevUpdatePreview';

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      // 집 프로필을 만들기 전에 '이전에 실행한 적 있는 기기'인지 기록 (업데이트 안내 판단용)
      try { setReturningUser((await db.houses.count()) > 0); } catch { /* 무시 */ }
      await ensureHouse().catch(() => undefined);
      setReady(true);
    })();
  }, []);
  if (!ready) return <Loading />;
  // Capacitor(file://) 환경에서도 새로고침이 깨지지 않도록 HashRouter 사용
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="materials" element={<Materials />} />
            <Route path="materials/new" element={<MaterialForm />} />
            <Route path="materials/template" element={<TemplatePicker />} />
            <Route path="materials/:id" element={<MaterialDetail />} />
            <Route path="materials/:id/edit" element={<MaterialForm />} />
            <Route path="house" element={<HouseSettings />} />
            <Route path="guide" element={<Guide />} />
            <Route path="repairs" element={<Repairs />} />
            <Route path="repairs/new" element={<RepairForm />} />
            <Route path="repairs/:id" element={<RepairDetail />} />
            <Route path="repairs/:id/edit" element={<RepairForm />} />
            <Route path="docs" element={<Docs />} />
            {import.meta.env.DEV && <Route path="dev/update" element={<DevUpdatePreview />} />}
          </Route>
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}
