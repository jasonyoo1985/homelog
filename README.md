# HOMELOG (홈로그)

집을 아는 사람이, 집을 잘 관리합니다. 자재·수리 이력·문서를 로컬 우선(IndexedDB)으로 기록하는 안드로이드 앱.

- 스택: React + TypeScript + Tailwind + Dexie, Capacitor(Android)
- 개발: `npm i && npm run dev`
- 테스트: `npm test`
- 배포 산출물: AAB (GitHub Actions `Android AAB` 워크플로 → Play Console 내부 테스트 트랙에 수동 업로드)

## 업로드 키 시크릿 (GitHub → Settings → Secrets → Actions)
`UPLOAD_KEYSTORE_BASE64`, `UPLOAD_KEYSTORE_PASSWORD`, `UPLOAD_KEY_ALIAS`, `UPLOAD_KEY_PASSWORD`

키스토어는 절대 저장소에 커밋하지 않습니다.
