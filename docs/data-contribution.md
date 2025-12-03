# 데이터 기여 가이드 (Data Contribution Guide)

이 문서는 AI 에이전트와 인간 기여자 모두를 위한 데이터 업데이트 가이드입니다.  
This guide is intended for both AI agents and human contributors to safely update category and platform data.

---

## 목차 (Table of Contents)

1. [데이터 파일 개요](#데이터-파일-개요-overview-of-data-files)
2. [categories.json 편집 규칙](#categoriesjson-편집-규칙)
3. [platforms.yaml 편집 규칙](#platformsyaml-편집-규칙)
4. [platforms.json은 직접 편집하지 마세요](#platformsjson은-직접-편집하지-마세요)
5. [동기화 스크립트 설명](#동기화-스크립트-설명)
6. [PR 체크리스트](#pr-체크리스트)

---

## 데이터 파일 개요 (Overview of Data Files)

| 파일 | 역할 | 편집 가능 여부 |
|------|------|----------------|
| `data/categories.json` | 카테고리 목록 정의 (카테고리 ID, 한글명, 영문명, 아이콘) | ✅ 직접 편집 |
| `data/platforms.yaml` | 플랫폼(서비스) 데이터의 **단일 진실 공급원(Single Source of Truth)** | ✅ 직접 편집 |
| `data/platforms.json` | `platforms.yaml`에서 자동 생성된 JSON 파일 | ❌ 직접 편집 금지 |

### 데이터 흐름 (Data Flow)

```
platforms.yaml  ──[sync-yaml-to-json.js]──>  platforms.json
      │                                            │
      │                                            ▼
      │                                    index.html (웹페이지)
      ▼
generate-llms.js ──> llms.txt
```

- `platforms.yaml`이 모든 플랫폼 데이터의 원본입니다.
- `platforms.json`은 스크립트에 의해 자동 생성되며, 수동 편집 시 덮어쓰기됩니다.
- `categories.json`은 카테고리 정의를 위한 독립적인 파일입니다.

---

## categories.json 편집 규칙

### 파일 위치
`data/categories.json`

### 스키마 (Schema)

```json
[
  {
    "id": "category-id",
    "name": "한글 카테고리명",
    "nameEn": "English Category Name",
    "icon": "🏷️"
  }
]
```

### 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | string | ✅ | 고유 식별자. 영문 소문자, 숫자, 하이픈만 사용 (예: `quick-commerce`) |
| `name` | string | ✅ | 한글 카테고리명 |
| `nameEn` | string | ✅ | 영문 카테고리명 |
| `icon` | string | ✅ | 이모지 아이콘 (단일 이모지) |

### 현재 카테고리 목록

```json
[
  { "id": "grocery", "name": "식료품/마트", "nameEn": "Grocery", "icon": "🛒" },
  { "id": "food-delivery", "name": "음식 배달", "nameEn": "Food Delivery", "icon": "🍔" },
  { "id": "fashion", "name": "패션/의류", "nameEn": "Fashion", "icon": "👗" },
  { "id": "electronics", "name": "가전/전자", "nameEn": "Electronics", "icon": "📱" },
  { "id": "beauty", "name": "뷰티/화장품", "nameEn": "Beauty", "icon": "💄" },
  { "id": "living", "name": "생활/가구", "nameEn": "Living/Furniture", "icon": "🛋️" },
  { "id": "quick-commerce", "name": "퀵커머스", "nameEn": "Quick Commerce", "icon": "⚡" },
  { "id": "general", "name": "종합쇼핑몰", "nameEn": "General Mall", "icon": "🏬" },
  { "id": "fresh", "name": "신선식품", "nameEn": "Fresh Food", "icon": "🥬" },
  { "id": "secondhand", "name": "중고거래", "nameEn": "Secondhand", "icon": "♻️" }
]
```

### 카테고리 추가 규칙

1. **고유한 `id` 사용**: 기존 카테고리와 중복되지 않는 ID를 사용하세요.
2. **일관된 명명 규칙**: ID는 영문 소문자와 하이픈만 사용하세요 (예: `pet-supplies`).
3. **배열 끝에 추가**: 새 카테고리는 배열의 마지막에 추가하세요.
4. **JSON 유효성**: 마지막 항목을 제외한 모든 항목 뒤에 쉼표가 있어야 합니다.

### 카테고리 수정/삭제 시 주의사항

- 카테고리 `id`를 변경하면, 해당 ID를 참조하는 모든 `platforms.yaml`의 `categories` 필드도 함께 업데이트해야 합니다.
- 카테고리를 삭제하기 전에, 해당 카테고리를 사용하는 플랫폼이 없는지 확인하세요.

---

## platforms.yaml 편집 규칙

### 파일 위치
`data/platforms.yaml`

### 스키마 (Schema)

```yaml
platforms:
  - id: platform-id
    name: "플랫폼 한글명"
    nameEn: "Platform English Name"
    description: "플랫폼에 대한 간단한 설명"
    url: "https://example.com"
    categories:
      - category-id-1
      - category-id-2
    deliveryMethods:
      - "배송 방법 1"
      - "배송 방법 2"
    deliveryTime: "배송 소요 시간"
    minOrderAmount: "최소 주문 금액"
    features:
      - "주요 특징 1"
      - "주요 특징 2"
```

### 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | string | ✅ | 고유 식별자. 영문 소문자, 숫자, 하이픈만 사용 |
| `name` | string | ✅ | 한글 서비스명 |
| `nameEn` | string | ✅ | 영문 서비스명 |
| `description` | string | ✅ | 서비스에 대한 간단한 설명 (한글) |
| `url` | string | ✅ | 서비스 메인 페이지 URL |
| `categories` | array | ✅ | 서비스가 속하는 카테고리 ID 목록 (`categories.json`에 정의된 ID 사용) |
| `deliveryMethods` | array | ✅ | 배송 방법 목록 |
| `deliveryTime` | string | ✅ | 일반적인 배송 소요 시간 |
| `minOrderAmount` | string | ✅ | 최소 주문 금액 또는 관련 정보 |
| `features` | array | ✅ | 주요 특징/서비스 목록 |

### 플랫폼 추가 예시

```yaml
  - id: new-service
    name: "새로운 서비스"
    nameEn: "New Service"
    description: "새로운 커머스 서비스에 대한 설명"
    url: "https://www.newservice.com"
    categories:
      - general
      - fashion
    deliveryMethods:
      - "일반배송"
      - "익일배송"
    deliveryTime: "2~3일"
    minOrderAmount: "20,000원 이상 무료배송"
    features:
      - "특징 1"
      - "특징 2"
      - "특징 3"
```

### 편집 규칙

1. **들여쓰기**: 스페이스 2칸을 사용하세요. 탭(Tab)은 사용하지 마세요.
2. **문자열 따옴표**: 문자열 값은 큰따옴표(`"`)로 감싸세요.
3. **배열 형식**: 배열 항목은 `- ` (하이픈 + 공백)으로 시작합니다.
4. **카테고리 참조**: `categories` 필드에는 `categories.json`에 정의된 `id` 값만 사용하세요.
5. **파일 끝 빈 줄**: 파일 끝에 빈 줄 하나를 추가하세요.

### 플랫폼 정보 업데이트 시 주의사항

- 기존 플랫폼의 `id`는 변경하지 마세요 (외부에서 참조할 수 있음).
- URL이 변경된 경우, 새 URL이 `https://`로 시작하는 유효한 형식인지 확인하세요.
- 카테고리를 추가할 때는 해당 카테고리가 `categories.json`에 존재하는지 확인하세요.

---

## platforms.json은 직접 편집하지 마세요

### 파일 위치
`data/platforms.json`

### 중요 사항

⚠️ **이 파일은 자동 생성 파일입니다. 직접 편집하지 마세요.**

- `platforms.json`은 `scripts/sync-yaml-to-json.js` 스크립트에 의해 `platforms.yaml`에서 자동으로 생성됩니다.
- 수동으로 편집한 내용은 다음 동기화 시 덮어쓰기되어 손실됩니다.
- 플랫폼 데이터를 변경하려면 **반드시 `platforms.yaml`을 편집**하세요.

---

## 동기화 스크립트 설명

### 스크립트 파일들

| 스크립트 | 역할 |
|----------|------|
| `scripts/sync-yaml-to-json.js` | `platforms.yaml` → `platforms.json` 변환 |
| `scripts/generate-llms.js` | 데이터를 사용하여 `llms.txt` 생성 |
| `scripts/yaml-parser.js` | YAML 파싱을 위한 공통 모듈 |

### YAML → JSON 동기화 실행 방법

```bash
node scripts/sync-yaml-to-json.js
```

이 명령은:
1. `data/platforms.yaml` 파일을 읽습니다.
2. YAML 데이터를 JSON으로 변환합니다.
3. `data/platforms.json` 파일을 생성/덮어쓰기합니다.

### llms.txt 생성 실행 방법

```bash
node scripts/generate-llms.js
```

이 명령은:
1. `data/categories.json`과 `data/platforms.yaml`을 읽습니다.
2. `templates/llms.txt.template`을 사용하여 렌더링합니다.
3. 루트 디렉토리에 `llms.txt` 파일을 생성합니다.

### 스크립트를 실행할 수 없는 경우

AI 에이전트나 기여자가 스크립트를 실행할 수 없는 환경에서는:

1. **PR 설명에 명시하세요**:
   ```
   ⚠️ 동기화 필요: platforms.yaml을 수정했습니다. 
   병합 전 `node scripts/sync-yaml-to-json.js` 실행이 필요합니다.
   ```

2. **GitHub Actions 자동화**:
   - 저장소에 자동 동기화 워크플로우가 설정되어 있다면, PR 병합 후 자동으로 실행됩니다.
   - GitHub 저장소의 "Actions" 탭에서 워크플로우 실행 상태를 확인할 수 있습니다.

---

## PR 체크리스트

데이터 업데이트 PR을 제출하기 전에 아래 항목을 확인하세요:

### categories.json 수정 시

- [ ] 새 카테고리의 `id`가 고유한가요?
- [ ] `id`는 영문 소문자, 숫자, 하이픈만 사용했나요?
- [ ] `name`, `nameEn`, `icon` 필드가 모두 포함되어 있나요?
- [ ] JSON 문법이 유효한가요? (쉼표, 괄호 확인)
- [ ] 기존 카테고리 `id`를 변경한 경우, `platforms.yaml`도 함께 업데이트했나요?

### platforms.yaml 수정 시

- [ ] 들여쓰기가 스페이스 2칸으로 일관되나요?
- [ ] 모든 필수 필드(`id`, `name`, `nameEn`, `description`, `url`, `categories`, `deliveryMethods`, `deliveryTime`, `minOrderAmount`, `features`)가 포함되어 있나요?
- [ ] `categories` 필드의 값들이 `categories.json`에 정의된 `id`와 일치하나요?
- [ ] URL이 유효한 형식인가요?
- [ ] 문자열이 큰따옴표로 올바르게 감싸져 있나요?

### 동기화 관련

- [ ] `platforms.json`을 직접 편집하지 않았나요?
- [ ] 스크립트 실행이 가능한 경우: `node scripts/sync-yaml-to-json.js` 실행 후 스크립트가 생성한 `platforms.json` 변경사항 커밋
- [ ] 스크립트 실행이 불가능한 경우: PR 설명에 동기화 필요성 명시

### 새 카테고리 추가 시

- [ ] `categories.json`에 새 카테고리 추가
- [ ] 해당 카테고리를 사용하는 플랫폼이 있다면 `platforms.yaml`에서 참조

---

## 요약 (Summary)

1. **카테고리 변경**: `data/categories.json` 직접 편집
2. **플랫폼 변경**: `data/platforms.yaml` 직접 편집
3. **platforms.json**: 절대 직접 편집하지 마세요 (자동 생성됨)
4. **동기화**: 변경 후 `node scripts/sync-yaml-to-json.js` 실행 (또는 PR에 명시)

질문이나 문제가 있으면 이슈를 생성해 주세요!
