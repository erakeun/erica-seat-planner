# PRIME 컨퍼런스홀 현장 실측 보정 기록

이 문서는 사용자 표시 실측값과 화면 Geometry 적용 상태를 분리해 기록한다. 모델은 `1m = 100 units`의 동일 x/y 축척을 사용하지만, 전체 방 크기와 테이블 길이가 미실측이므로 정밀 실측 CAD 또는 시공 도면이 아니다.

| dimensionId | 값 | 근거 | 측정 의미 | 앵커 A → B | 끝점 | 적용 | 값 확실성 | 좌표 적용 확실성 |
|---|---:|---|---|---|---|---|---|---|
| `MAIN-UPPER-DEPTH` | 800mm | `IMG_2248(1).jpg` | 상단 메인 장변 상판 깊이 | 안쪽 가장자리 → 바깥쪽 가장자리 | resolved | geometry-applied | high | high |
| `MAIN-LOWER-DEPTH` | 800mm | `IMG_2248(1).jpg` | 하단 메인 장변 상판 깊이 | 안쪽 가장자리 → 바깥쪽 가장자리 | resolved | geometry-applied | high | high |
| `STAFF-MODULE-DEPTH` | 800mm | `IMG_2245(1).jpg` | 수행원 대표 모듈 깊이 | 대표 모듈 안쪽 → 바깥쪽 가장자리 | resolved | geometry-applied | high | medium |
| `SCREEN-END-CLEARANCE` | 1000mm | `IMG_2249(2).jpg` | 오른쪽 열린 끝의 상판과 스크린 쪽 벽 사이 | 장변 상판 오른쪽 외곽 → 스크린 쪽 벽 안쪽 면 | resolved | geometry-applied | high | medium |
| `HEAD-WALL-CLEARANCE` | 1800mm | `IMG_2241(1).jpg` | 엠블럼 벽 쪽 상석 뒤 표시 구간 | 엠블럼 벽면 → 의자 등받이 또는 상판 외곽 | unresolved | reference-only | high | low |
| `HEAD-DOOR-WALL-CLEARANCE` | 2200mm | `IMG_2246(1).jpg` | 상석 모서리와 목재 출입문 옆 벽 사이 | 상석 상판 모서리 → 벽 또는 문틀 면 | unresolved | reference-only | high | low |
| `HEAD-CONNECTOR-DEPTH` | 미실측 | `IMG_2240(1).jpg` | 상석 연결 상판 깊이 | 안쪽 가장자리 → 바깥쪽 가장자리 | unresolved | reference-only | none | medium |

`SCREEN-END-CLEARANCE`는 사진에서 확인된 한쪽 1000mm 실측값이다. 현재 모델은 상·하단 장변이 같은 오른쪽 끝 좌표를 공유하므로 양쪽 열린 끝에 동일 설정값이 적용되지만, 이를 양쪽 모두 개별 실측한 것으로 해석하지 않는다.

## 수행원 테이블 매핑

대표 모듈의 800mm 깊이를 동일한 7개 모듈에 적용했다. 테이블 길이와 모듈 사이 틈은 미실측이며 승인 배치의 상대 비례를 유지한 설정값이다. `STAFF-TABLE-*`은 렌더링용 가구 구분 ID이며 JSON V1의 좌석 ID를 대체하지 않는다.

| 가구 모듈 | 기존 좌석 ID |
|---|---|
| `STAFF-TABLE-01` | `STAFF-01`, `STAFF-02` |
| `STAFF-TABLE-02` | `STAFF-03`, `STAFF-04` |
| `STAFF-TABLE-03` | `STAFF-05`, `STAFF-06` |
| `STAFF-TABLE-04` | `STAFF-07`, `STAFF-08` |
| `STAFF-TABLE-05` | `STAFF-09`, `STAFF-10` |
| `STAFF-TABLE-06` | `STAFF-11`, `STAFF-12` |
| `STAFF-TABLE-07` | `STAFF-13`, `STAFF-14` |

현장 사진·승인 참고 이미지는 로컬 분석에만 사용하며 프로젝트·게시 ZIP·배포 산출물에 포함하지 않는다.
