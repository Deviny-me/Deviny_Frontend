# Workouts API — Контракт для бэкенда

> **Кому:** команда бэкенда Deviny.  
> **Цель:** заменить локальный localStorage-мок на реальные HTTP-эндпоинты. Когда бэкенд готов — выставляем одну переменную окружения, и вся фича тренировок автоматически переключается на сервер **без каких-либо изменений в UI**.

---

## 1. Активация

По умолчанию фронтенд работает с localStorage-моком. Чтобы переключиться на реальный бэкенд:

```env
# .env.local на фронтенде
NEXT_PUBLIC_WORKOUTS_API=1
```

Когда `NEXT_PUBLIC_WORKOUTS_API=1` — все вызовы `workoutsApi.*` уходят на HTTP-эндпоинты, описанные в этом документе. Без этой переменной работает мок (текущее поведение по умолчанию).

Базовый URL: `${NEXT_PUBLIC_API_URL}/api` (по умолчанию `https://api.deviny.me/api`).

---

## 2. Аутентификация

Все эндпоинты требуют заголовок:

```
Authorization: Bearer <accessToken>
```

- Токен хранится на клиенте в `localStorage.accessToken` или `sessionStorage.accessToken` и автоматически обновляется через `/auth/refresh` (cookie `refreshToken`).
- При получении `401` фронтенд автоматически пробует обновить токен. Бэкенд должен возвращать именно `401` (не `403`), когда access-токен истёк, но refresh-токен ещё валиден.

Формат ошибки (единый для всей платформы):

```json
{ "message": "Понятное описание ошибки", "code": "OPTIONAL_ENUM" }
```

Фронтенд читает `errorData.message` и бросает исключение.

---

## 3. Доменная модель

TypeScript-типы ниже — единственный источник истины (зеркало из `src/types/workout.ts`). Бэкенд должен строго им следовать.

```ts
type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms'
  | 'core'  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'fullBody' | 'cardio'

type Equipment =
  | 'barbell' | 'dumbbell' | 'machine' | 'cable'
  | 'bodyweight' | 'kettlebell' | 'band' | 'other'

type WeightUnit = 'kg' | 'lb'

interface LocalizedString { en: string; ru: string; az: string }

interface Exercise {
  id: string                      // идентификатор в каталоге, напр. "ex-bench-press"
  slug: string                    // url-safe строка, напр. "barbell-bench-press"
  name: LocalizedString
  primaryMuscle: MuscleGroup
  secondaryMuscles?: MuscleGroup[]
  equipment: Equipment
  mediaFrames?: [string, string]  // два URL изображений — UI чередует их анимацией
  instructions?: LocalizedString  // короткая тренерская подсказка
  isBodyweight?: boolean
  aliases?: { en?: string[]; ru?: string[]; az?: string[] }  // дополнительные поисковые слова
}

interface SetLog {
  id: string
  reps: number | null
  weight: number | null
  rpe?: number | null
  isWarmup?: boolean
  completed: boolean
}

interface ExerciseLog {
  id: string
  exerciseId: string              // FK -> Exercise.id
  order: number                   // позиция в сессии, начиная с 0
  restSec: number                 // отдых между подходами по умолчанию, секунды
  notes?: string
  sets: SetLog[]
}

type SessionStatus = 'inProgress' | 'finished' | 'cancelled'

interface WorkoutSession {
  id: string
  userId?: string                 // добавляется сервером; клиент игнорирует
  name: string                    // напр. "Спина + бицепс"
  startedAt: string               // ISO 8601 datetime
  finishedAt?: string             // ISO 8601, присутствует когда тренировка завершена
  durationSec?: number            // опциональный кэш длительности
  status: SessionStatus           // мок всегда выставляет 'finished'
  notes?: string
  bodyWeight?: number             // вес тела пользователя на момент тренировки
  unit: WeightUnit                // единица веса для этой сессии
  exercises: ExerciseLog[]
  templateId?: string             // опциональный FK на шаблон
}

interface WorkoutTemplate {
  id: string
  name: string
  tag?: string                    // напр. "Push"
  exerciseIds: string[]
  createdAt: string               // ISO 8601
}

interface PreviousBest {
  date: string                    // ISO 8601 дата сессии
  reps: number
  weight: number
}
```

### Формат ID

Фронтенд сейчас генерирует ID вида `ws_lz4t_p9d2k1`, `el_…`, `set_…`, `tpl_…`. Сервер может использовать любой строковый формат (например, UUID v4). Фронтенд воспринимает `id` как непрозрачную строку.

---

## 4. Эндпоинты

Все эндпоинты привязаны к авторизованному пользователю. Бэкенд **обязан** фильтровать данные по `userId` на стороне сервера.

### 4.1 Каталог упражнений

Каталог (~260 упражнений) сейчас живёт на фронтенде в `src/lib/data/exercises.ts`. **Рекомендуется** перенести его на бэкенд и отдавать через этот эндпоинт. До тех пор эндпоинт необязателен — фронтенд продолжит использовать встроенный статический список.

#### `GET /workouts/exercises`

Возвращает глобальный каталог упражнений.

**Query-параметры (все необязательны):**
| параметр | тип | описание |
|---|---|---|
| `muscle` | `MuscleGroup` | фильтр по основной или вторичной мышце |
| `equipment` | `Equipment` | фильтр по оборудованию |
| `q` | `string` | текстовый поиск (по названию на любом языке + aliases + slug) |
| `limit` | `number` | по умолчанию `500` |
| `offset` | `number` | по умолчанию `0` |

**Ответ `200`:**
```json
{ "items": [Exercise, …], "total": 260 }
```

#### `GET /workouts/exercises/:idOrSlug`

Получить одно упражнение. `200 OK` → `Exercise`. `404` если не найдено.

---

### 4.2 Сессии (тренировки)

#### `GET /workouts/sessions`

Список тренировок текущего пользователя, **новые сначала** (по `startedAt DESC`).

**Query-параметры:**
| параметр | тип | по умолчанию |
|---|---|---|
| `limit` | `number` | `50` |
| `offset` | `number` | `0` |
| `from` | ISO date `YYYY-MM-DD` | — |
| `to` | ISO date `YYYY-MM-DD` | — |

**Ответ `200`:**
```json
{ "items": [WorkoutSession, …], "total": 123 }
```

> Фронтенд умеет работать как с голым массивом, так и с `{ items, total }` — тонкий клиент (`workoutsApi.remote.ts`) сам разворачивает `items`. **Предпочтительно:** `{ items, total }`.

---

#### `GET /workouts/sessions/:id`

`200 OK` → `WorkoutSession`. `404` если не найдено или не принадлежит пользователю.

---

#### `POST /workouts/sessions`

Создать новую запись тренировки (уже завершённой).

**Тело запроса:**
```json
{
  "name": "Спина + бицепс",        // необязательно; сервер по умолчанию ставит название дня недели
  "date": "2026-05-11",            // ISO date или полный datetime; по умолчанию "сейчас"
  "templateId": "tpl_abc"          // необязательно — сервер должен заполнить упражнения из шаблона
}
```

**Ответ `201`:** созданный `WorkoutSession`. Важно:
- `status = "finished"` (тренировки логируются постфактум в текущем UX)
- `startedAt = finishedAt = <date>`, если передана только дата — использовать `12:00:00Z`
- `unit` по умолчанию — последняя использованная единица пользователя (kg). Фронтенд может сразу сделать PATCH.
- Если передан `templateId`: заполнить `exercises` из шаблона, каждому добавить 3 пустых подхода `{reps:null, weight:null, completed:true}`.

---

#### `PATCH /workouts/sessions/:id`

Частичное обновление. Тело соответствует `Partial<Omit<WorkoutSession, 'id' | 'userId'>>`. Сервер **должен** игнорировать неизвестные поля и **никогда** не перезаписывать `exercises` здесь (для этого есть вложенные эндпоинты).

Фронтенд отправляет одно из:
```json
{ "name": "New name" }
{ "startedAt": "2026-05-10T12:00:00Z", "finishedAt": "2026-05-10T12:00:00Z" }
{ "unit": "lb" }
{ "notes": "…" }
{ "bodyWeight": 82.5 }
```

**Ответ `200`:** обновлённый `WorkoutSession`.

---

#### `DELETE /workouts/sessions/:id`

Удалить сессию с каскадным удалением `ExerciseLog` и `SetLog`. **Ответ `204`.**

---

### 4.3 Упражнения внутри сессии

Фронтенд никогда не PATCHит весь массив `exercises` — только через гранулярные эндпоинты ниже. Это обеспечивает надёжность оптимистичного UI и порядка упражнений.

Все маршруты возвращают **обновлённый полный `WorkoutSession`**, чтобы фронтенд мог перерендерить всё за один раз.

---

#### `POST /workouts/sessions/:sessionId/exercises`

Добавить упражнение в сессию.

```json
{ "exerciseId": "ex-bench-press" }
```

Сервер создаёт `ExerciseLog` с:
- `order = текущее кол-во упражнений`
- `restSec = 0`
- `sets = [ { id, reps: null, weight: null, completed: true } ]` (один пустой подход)

**Ответ `200`:** обновлённый `WorkoutSession`.

---

#### `DELETE /workouts/sessions/:sessionId/exercises/:exerciseLogId`

Удалить упражнение. Сервер **обязан** пересчитать `order` у оставшихся упражнений так, чтобы они шли от 0 до n-1 без пропусков.

**Ответ `200`:** обновлённый `WorkoutSession`.

---

#### `PATCH /workouts/sessions/:sessionId/exercises/:exerciseLogId`

Обновить поля одного лога упражнения. Тело — `Partial<Omit<ExerciseLog, 'id' | 'exerciseId'>>`.

Фронтенд отправляет, например:
```json
{ "notes": "Felt strong today" }
{ "restSec": 120 }
```

**Ответ `200`:** обновлённый `WorkoutSession`.

---

#### `POST /workouts/sessions/:sessionId/exercises/:exerciseLogId/move`

Переместить упражнение вверх или вниз.

```json
{ "direction": "up" }   // или "down"
```

Сервер меняет упражнения местами с соседом и пересчитывает `order`. На границах — ничего не делает (возвращает `200` с неизменёнными данными).

**Ответ `200`:** обновлённый `WorkoutSession`.

---

### 4.4 Подходы (сеты) внутри упражнения

---

#### `POST /workouts/sessions/:sessionId/exercises/:exerciseLogId/sets`

Добавить подход. **Тело не нужно.** Сервер **должен** скопировать `reps`/`weight` из предыдущего подхода (пользователю не нужно вводить каждый раз). `completed = true` по умолчанию. Логика мока:

```ts
const last = exerciseLog.sets[exerciseLog.sets.length - 1]
const next = last
  ? { id, reps: last.reps, weight: last.weight, completed: true }
  : { id, reps: null, weight: null, completed: true }
```

**Ответ `200`:** обновлённый `WorkoutSession`.

---

#### `PATCH /workouts/sessions/:sessionId/exercises/:exerciseLogId/sets/:setId`

Частичное обновление одного подхода. Тело — `Partial<Omit<SetLog, 'id'>>`.

```json
{ "reps": 8, "weight": 100 }
{ "isWarmup": true }
{ "completed": false }
```

**Ответ `200`:** обновлённый `WorkoutSession`.

---

#### `DELETE /workouts/sessions/:sessionId/exercises/:exerciseLogId/sets/:setId`

**Ответ `200`:** обновлённый `WorkoutSession`.

---

### 4.5 Лучший результат (previous best)

Используется для отображения подсказки «лучший результат» над строками подходов.

#### `GET /workouts/exercises/:exerciseId/previous-best`

**Query-параметры:**
| параметр | тип | описание |
|---|---|---|
| `excludeSessionId` | string | необязательно — исключить эту сессию из поиска (при редактировании) |

Лучший результат = самый тяжёлый подход во всех сессиях пользователя для данного упражнения.

**Ответ `200`:**
```json
{ "date": "2026-04-20T12:00:00Z", "reps": 8, "weight": 100 }
```

Если пользователь никогда не логировал это упражнение — вернуть `null` (`200 { "data": null }` **или** `204 No Content`). Фронтенд обрабатывает оба варианта одинаково.

---

### 4.6 Шаблоны (зарезервировано)

Шаблоны пока не отображаются в UI, но API должен быть готов:

- `GET    /workouts/templates`                → `{ items: WorkoutTemplate[] }`
- `POST   /workouts/templates`                тело: `Omit<WorkoutTemplate, 'id' | 'createdAt'>` → `201` + `WorkoutTemplate`
- `DELETE /workouts/templates/:id`            → `204`

---

## 5. Данные, хранимые только на устройстве (не отправляются на сервер)

Эти данные принадлежат устройству, а не серверу:

| ключ | что хранит | область |
|---|---|---|
| `deviny.workouts.unit.v1` | последняя выбранная единица веса (kg/lb) | один браузер |
| `deviny.workouts.customNames.v1` | последние 10 пользовательских названий тренировок | один браузер |

Фронтенд держит их в `localStorage` независимо от состояния бэкенда. Бэкенд **не должен** их хранить.

---

## 6. Правила валидации на стороне бэкенда

- `weight >= 0`, максимум `9999` (кг или фунты).
- `reps >= 0`, максимум `999`.
- `rpe`, если передан — в диапазоне `[1, 10]` (допускается шаг `.5`).
- `restSec >= 0`, максимум `3600`.
- `name.length <= 100`.
- `notes.length <= 2000`.
- `unit ∈ {'kg','lb'}`.
- `status ∈ {'inProgress','finished','cancelled'}`.
- `exerciseId` **обязан** существовать в каталоге.
- Одно и то же упражнение **может** встречаться несколько раз в одной сессии (суперсеты, дроп-сеты и т.д.). Уникальность не нужна.

Ошибки валидации: `400` с `{ "message": "...", "code": "VALIDATION_ERROR", "field": "weight" }`.

---

## 7. Инварианты пагинации и порядка

- Список сессий: сортировка по `startedAt DESC` на сервере. Фронтенд **не пересортировывает**.
- `exercises[]` внутри сессии: по `order ASC`. После удаления/перемещения — **обязательно** пересчитать без пропусков.
- `sets[]` внутри упражнения: по порядку добавления. Используйте стабильный `createdAt` или auto-increment на сервере.

---

## 8. Примерная схема БД (Postgres)

```sql
CREATE TABLE workout_exercises (
  id            TEXT PRIMARY KEY,            -- "ex-bench-press"
  slug          TEXT UNIQUE NOT NULL,
  name_en       TEXT NOT NULL,
  name_ru       TEXT NOT NULL,
  name_az       TEXT NOT NULL,
  primary_muscle TEXT NOT NULL,
  secondary_muscles TEXT[] NOT NULL DEFAULT '{}',
  equipment     TEXT NOT NULL,
  is_bodyweight BOOLEAN NOT NULL DEFAULT FALSE,
  media_frame_1 TEXT,
  media_frame_2 TEXT,
  instructions_en TEXT,
  instructions_ru TEXT,
  instructions_az TEXT,
  aliases_en    TEXT[] NOT NULL DEFAULT '{}',
  aliases_ru    TEXT[] NOT NULL DEFAULT '{}',
  aliases_az    TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE workout_sessions (
  id           TEXT PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL,
  finished_at  TIMESTAMPTZ,
  duration_sec INT,
  status       TEXT NOT NULL,                -- inProgress|finished|cancelled
  notes        TEXT,
  body_weight  NUMERIC(5,2),
  unit         TEXT NOT NULL,                -- kg|lb
  template_id  TEXT REFERENCES workout_templates(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_workout_sessions_user_started ON workout_sessions(user_id, started_at DESC);

CREATE TABLE workout_exercise_logs (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id   TEXT NOT NULL REFERENCES workout_exercises(id),
  "order"       INT NOT NULL,
  rest_sec      INT NOT NULL DEFAULT 0,
  notes         TEXT
);
CREATE INDEX idx_workout_logs_session ON workout_exercise_logs(session_id, "order");

CREATE TABLE workout_sets (
  id              TEXT PRIMARY KEY,
  exercise_log_id TEXT NOT NULL REFERENCES workout_exercise_logs(id) ON DELETE CASCADE,
  position        INT NOT NULL,
  reps            INT,
  weight          NUMERIC(7,2),
  rpe             NUMERIC(3,1),
  is_warmup       BOOLEAN NOT NULL DEFAULT FALSE,
  completed       BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_workout_sets_log ON workout_sets(exercise_log_id, position);

CREATE TABLE workout_templates (
  id          TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  tag         TEXT,
  exercise_ids TEXT[] NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 9. Миграция статического каталога

Массив `EXERCISES` (260+ упражнений) сейчас живёт на фронтенде в `src/lib/data/exercises.ts`. Чтобы засеять бэкенд:

```bash
# в репозитории фронтенда
npx ts-node scripts/dumpExercises.ts > exercises.json
```

Затем одноразовый скрипт на бэкенде делает `INSERT … ON CONFLICT (slug) DO UPDATE` в таблицу `workout_exercises`. Как только `/workouts/exercises` на бэкенде готов и выставлен `NEXT_PUBLIC_WORKOUTS_API=1` — фронтенд начнёт загружать каталог с сервера.

(Скрипт дампа не закоммичен — напишите 10-строчник, который импортирует `EXERCISES` и вызывает `JSON.stringify`.)

---

## 10. Чек-лист для smoke-теста

После деплоя эндпоинтов выставить `NEXT_PUBLIC_WORKOUTS_API=1` и проверить:

- [ ] `/user/workouts` загружает список тренировок (новые сначала).
- [ ] Создание тренировки через модалку возвращает новый `id` и переходит на неё.
- [ ] Переименование тренировки (карандаш в заголовке) сохраняется после перезагрузки.
- [ ] Смена даты сохраняется.
- [ ] Добавление упражнения через пикер появляется сразу с одним пустым подходом.
- [ ] Добавление/редактирование/удаление подхода сохраняется.
- [ ] Переключение `kg ↔ lb` сохраняется для сессии.
- [ ] Перемещение упражнений вверх/вниз сохраняется после перезагрузки.
- [ ] Подсказка «лучший результат» появляется, если у пользователя есть хотя бы 2 сессии с одним упражнением.
- [ ] Удаление тренировки убирает её из списка.
- [ ] Все операции при недоступном сервере показывают error-toast и не ломают UI.

---

## 11. Версионирование

Эндпоинты не версионированы и живут по пути `/api/workouts/*`. Ломающие изменения **должны** переезжать на `/api/v2/workouts/*`, а фронтенд перейдёт на новый адрес через отдельный env-флаг.

---

**Контакты:**  
- Фронтенд-лид: поддерживает `workoutsApi.ts` (мок) и `workoutsApi.remote.ts` (HTTP) в соответствии с этим документом.  
- Любое отклонение от контракта: сначала обновить **этот файл**, потом реализовывать.
