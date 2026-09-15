# ERICA Seat Planner

한양대학교 ERICA 본관 2층 PRIME 컨퍼런스홀 전용 좌석배치 제작기 V1입니다.

## 실행

별도 설치 없이 `dist/index.html`을 열거나 정적 웹 서버로 `dist` 폴더를 제공하면 됩니다.

## 좌석 Geometry

- 왼쪽 메인석 24석 (`MAIN-L-01` ~ `MAIN-L-24`)
- 오른쪽 메인석 24석 (`MAIN-R-01` ~ `MAIN-R-24`)
- 중앙 상석 1석 (`HEAD-01`)
- 수행원석 14석 (`STAFF-01` ~ `STAFF-14`)
- 총 63석

좌표는 사진과 도면에서 확인되는 상대적 공간 비례를 바탕으로 구성했으며 실제 건축 치수로 사용하면 안 됩니다.

## 배포

GitHub Pages 배포용 워크플로가 포함되어 있습니다. 저장소의 Pages Source를 `GitHub Actions`로 설정하면 `dist` 폴더가 배포됩니다.
