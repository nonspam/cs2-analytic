# CS2 Analytics — v40 working/final candidate

Текущая рабочая сборка после восстановления проекта, аналитического hardening и сквозного QA. Финальный ZIP создаётся только после полного контрольного прогона.

## Исправлено в v17
- восстановлена функция локальной авторизации Admin;
- проверен экспорт/импорт backup;
- проверены связи match → map → player;
- сохранена политика compact BO3: только aggregate K/D/A, без выдуманного per-map split;
- архивированные матчи/карты исключаются из текущих derived-расчётов;
- главная автоматически строится из актуальной базы;
- аватары игроков не используются.

## Локальная авторизация
- login: `черный флаг`
- password: `ammo19`

Это локальная MVP-авторизация, не серверная система безопасности.

## v20 — last-game completeness
- Последняя игра на главной теперь сохраняет raw_name для строк без player_id, чтобы детальная таблица не теряла участника из-за неразрешённого alias.
- Backup version updated to site-v20.

## v21 — глубокий QA-проход
- Последняя карта детальной серии выбирается как последняя активная детальная карта, а не первая.
- Таблицы не теряют raw_name, если player_id отсутствует.
- Вход в Admin поддерживает Enter и выводит понятную ошибку при неверных данных.
- Добавлен QA_CHECK.py для повторной проверки структуры, связей, aliases и замороженных агрегатов.

## v22 — BO3 validation hardening
- Исправлена проверка количества карт для compact BO3: 2:0/0:2 требуют 2 карты, 2:1/1:2 требуют 3 карты.
- То же правило применяется при редактировании compact BO3.
- Backup version updated to site-v22.

## v22 QA hardening
- LocalStorage additions are applied defensively: a malformed addition is rejected instead of corrupting the loaded runtime base.
- Last-game table fallback keeps raw_name when player_id is unavailable.

## v23 — transactional hydration audit
- LocalStorage additions are applied transactionally as one state change.
- Match creation with dependent map records survives page reload.
- Invalid local state is rolled back to the last valid base instead of partially applying.
- Startup reports a clear hydration warning when local changes cannot be safely applied.
- Backup version bumped to site-v23.

## v24 — lifecycle hardening
- Исправлено редактирование игрока: display name теперь сразу синхронизируется с patch и текущим состоянием DB.
- Alias и display name сохраняются атомарно в одной операции.
- Повторно прогнаны QA и JS syntax checks.


## v25 — packaging + score display hardening
- ZIP теперь обязательно включает папку `data/`; сайт не может быть упакован без исходной базы.
- В БАЗА ИГР для BO1 показывается реальный счёт карты, а не внутренний series_score `1:0`.
- Backup version bumped to site-v25.


## v33 — сквозной механизм сохранения
- Все CRUD-операции теперь используют единый transactional `persistChange`: additions и audit записываются вместе и проверяются после записи.
- При ошибке записи выполняется откат обоих localStorage-состояний.
- Добавлена защита от редактирования подробного BO3 одним aggregate, чтобы не ломать покарточный split.
- `validateBase` теперь дополнительно запрещает orphan maps, повторное использование map_id в разных match_ids и неполный aggregate для compact BO3.
- Добавлен `MECHANISM_QA.js`: проверяет атомарность сохранения/audit, rollback, hydration map-before-match и rollback повреждённого local state.
- Backup version history: site-v38.


## v33 hardening
- Corrupted localStorage arrays for audit/additions are treated as empty instead of crashing the application.
- Backup version marker history: site-v38.


## v33 — storage visibility hardening
- Повреждённый JSON в cs5_additions/cs5_audit_log теперь не скрывается молча: приложение показывает предупреждение и продолжает работу с безопасным пустым состоянием.
- Backup marker history: site-v38.

## v37 red-team hardening
- Backup import now restores the exported local operation journal instead of silently discarding it.
- Backup import validates the local operation journal against a cloned base before writing storage.
- Backup export marker is `site-v37`.
- Hydration exposes malformed `cs5_additions` storage instead of silently hiding the problem.

## v38 — end-to-end validation build
- Backup marker history: site-v38.
- Manifest site_version synchronized to v39.
- End-to-end runtime VM smoke tests executed against the packaged application logic, plus HTTP resource smoke tests.


## v39 — запуск без локального HTTP-сервера
- Добавлен `data_embedded.js` с проверенной копией players/maps/matches/aliases.
- При обычном HTTP сайт по-прежнему читает `data/*.json`.
- Если `fetch(data/*.json)` недоступен (например, index.html открыт двойным кликом через `file://`), приложение автоматически использует встроенную копию данных.
- Это устраняет ошибку `Failed to fetch` при запуске локального index.html без сервера.
- Основная база `data/*.json` остаётся источником данных для обычного запуска.


## v39 — final release QA status
- `QA_CHECK.py` PASS.
- `MECHANISM_QA_v39.js` PASS after synchronizing the test marker to `site-v39`.
- `E2E_QA_v39_strict.js` PASS: create → edit → compact BO3 → archive/restore → backup replay → invalid-backup rollback.
- HTTP smoke test PASS for index, CSS, JS, embedded data and all four JSON data files.
- `data_embedded.js` provides `file://` fallback when JSON fetch is unavailable.


## v40 — аналитический и UI hardening
- Player Center + сравнение игроков до 5 участников.
- Прозрачный `ПОЧЕМУ N?` для Player Index с живой формулой и весами.
- RANGE, Form 5/10/20, ЭРЫ, история Index и маркированная экстраполяция без выдачи её за прогноз.
- Map Lab + Map DNA radar на выбранном игроке/карте.
- Drill-down БАЗА → матч → карта; компактные BO3 остаются aggregate-only.
- РЕКОРДЫ: выбранный metric TOP 10 + K/D/K-D/K/A/Impact/Player Index.
- График накопления: 1–11 игроков, поиск, ВСЕ, focus по линии/легенде, checkpoints 10/20/30/40/50/60.
- Игроки отображаются только текстом; аватары не используются.
- `UI_RUNTIME_QA_v40.js` выполняет 11 основных UI/runtime путей и проверяет автоматический пересчёт после изменения статистики.

## Общий режим для команды — реальная синхронизация

Для игры/проверки с нескольких компьютеров используйте `START_SHARED_SERVER.bat`. Он запускает встроенный Python-сервер, который:
- хранит общую базу в `shared_state.json`;
- сохраняет новые игры, игроков и изменения на сервере, а не только в браузере;
- рассылает изменения открытым браузерам через realtime-события;
- если realtime-канал недоступен, клиенты перепроверяют базу автоматически.

### Как зайти пацанам
1. На ПК, где лежит проект, запусти `START_SHARED_SERVER.bat`.
2. Окно покажет адрес вида `http://192.168.x.x:8000/`.
3. Пацаны в той же Wi-Fi/LAN сети открывают этот адрес у себя.
4. Окно сервера должно оставаться запущенным.
5. Если Windows Firewall спросит доступ Python — разреши **частную сеть**.

В этом режиме изменение, сохранённое одним человеком, появляется у остальных без перезагрузки страницы. Старый `START_SERVER.bat` оставлен как одиночный локальный режим без общей синхронизации.

> Важно: это командный LAN-сервер, а не публичный интернет-хостинг. Для доступа из интернета потребуется размещение сервера на VPS/хостинге и нормальная серверная авторизация.


## Development and GPT workflow

See DEVELOPMENT.md for architecture, safe code/data workflow and local test commands.

For production data changes use the protected Supabase admin API described in API_CONTRACT.md; do not edit JSON by hand.

GPT_HANDOFF.md contains the concise continuation context for another ChatGPT.

GitHub Pages deployment is defined in .github/workflows/pages.yml. Supabase data changes do not require a Pages deploy.
