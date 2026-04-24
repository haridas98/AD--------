# Asset archive and admin sync

## 1. Откуда парсились картинки

Основной парсер:

```bash
npm run archive:site-images
```

Фактически запускается:

```bash
node scripts/archive-live-site-images.mjs https://alexandradiz.com/
```

Источник:

```text
https://alexandradiz.com/
```

Скрипт собирает страницы сайта, ссылки из sitemap и внутренние ссылки. На текущем архиве найдено:

```text
scripts/site-image-archive/alexandradiz.com/pages.json
pageCount: 138
```

Скрипт вытаскивает картинки из:

```text
src
srcset
data-src
data-original
data-lazy
data-base-path + data-file-name
style="background-image: url(...)"
```

Для Vigbo/CDN дополнительно пробуются размерные варианты файла:

```text
2000-<file>
1600-<file>
1200-<file>
1000-<file>
800-<file>
```

Это важно, потому что в HTML часто есть `data-base-path + data-file-name` без префикса, но прямой URL без префикса отдаёт `404`. Реальные картинки обычно лежат как `1000-filename.jpg` или `2000-filename.jpg`.

Поддерживаются CDN-ссылки вида:

```text
//static-cdn4-2.vigbo.tech/...
https://static-cdn...
https://alexandradiz.com/...
```

## 2. Куда сохраняется архив после парсинга

Корень архива:

```text
scripts/site-image-archive/alexandradiz.com/
```

Основные папки:

```text
scripts/site-image-archive/alexandradiz.com/_cache
scripts/site-image-archive/alexandradiz.com/_by-source
scripts/site-image-archive/alexandradiz.com/_
```

Что означает:

```text
_cache
```

Общий кеш скачанных файлов по URL/hash. Одна и та же картинка не скачивается заново.

```text
_by-source
```

Разбор по исходному CDN/source URL.

```text
_
```

Разбор по страницам сайта. Например:

```text
scripts/site-image-archive/alexandradiz.com/_/bright-mood-pacifica/images
scripts/site-image-archive/alexandradiz.com/_/belmond/images
scripts/site-image-archive/alexandradiz.com/_/bathrooms/images
```

У каждой страницы есть:

```text
manifest.json
images/
```

## 3. Как архив попадает в админку

Импорт из архива делает серверная логика:

```text
server/lib/project-asset-migration.js
```

Её можно запустить массово:

```bash
node server/scripts/import-project-assets-from-archive.mjs
```

Также она вызывается при открытии assets проекта в админке:

```text
GET /api/admin/projects/:id/assets
```

То есть когда в админке открываешь проект и вкладку Assets, сервер пытается:

```text
1. найти подходящую папку в scripts/site-image-archive/alexandradiz.com/_
2. скопировать найденные картинки в public/uploads/projects/<project-slug>/images/original
3. создать записи ProjectAsset в БД
```

## 4. Как проект сопоставляется с папкой архива

Сопоставление идёт по:

```text
project.slug
project.title
```

Сравнение делает нормализацию: lowercase, slug, удаление дефисов.

Пример:

```text
Project slug: bright-mood-pacifica
Archive folder: scripts/site-image-archive/alexandradiz.com/_/bright-mood-pacifica
```

Такой проект должен импортироваться нормально.

Почему может быть мало ассетов:

```text
1. Название/slug проекта не совпадает с папкой архива.
2. В архиве у конкретной страницы реально мало картинок.
3. Картинки повторяются, одинаковые файлы пропускаются по checksum.
4. Проект уже имеет assets, а hydrate из старого content не добавляет новые block URLs.
5. Админская кнопка Sync folder не читает archive, она читает только public/uploads/projects/<slug>.
```

## 5. Откуда синхронизируется кнопка Sync folder в админке

Кнопка:

```text
Admin -> Projects -> Edit project -> Assets -> Sync folder
```

НЕ читает `scripts/site-image-archive`.

Она читает только папку текущего проекта:

```text
public/uploads/projects/<project-slug>
```

Например:

```text
public/uploads/projects/bright-mood-pacifica
```

Сканируются вложенные файлы:

```text
jpg
jpeg
png
webp
mp4
mov
webm
m4v
```

Основная ожидаемая структура:

```text
public/uploads/projects/<project-slug>/images/original
public/uploads/projects/<project-slug>/images/derived
public/uploads/projects/<project-slug>/videos/original
public/uploads/projects/<project-slug>/imports
```

## 6. Куда синхронизируются assets

Физические файлы лежат здесь:

```text
public/uploads/projects/<project-slug>/images/original
public/uploads/projects/<project-slug>/videos/original
```

Публичные URL выглядят так:

```text
/uploads/projects/<project-slug>/images/original/<file>
```

Записи в БД создаются в таблице:

```text
ProjectAsset
```

Важные поля:

```text
projectId
kind
storagePath
publicUrl
originalFilename
mimeType
width
height
fileSize
checksum
status
sourceType
sourcePath
```

## 7. Как правильно добавить много фото вручную

Для существующего проекта:

```text
1. Узнать slug проекта в админке.
2. Сложить файлы в public/uploads/projects/<slug>/images/original.
3. В админке открыть проект.
4. Открыть вкладку Assets.
5. Нажать Sync folder.
```

После этого новые файлы появятся в библиотеке assets проекта.

Если файл уже есть, sync не должен создавать копию. Он сверяет по:

```text
storagePath
checksum
```

## 8. Как импортировать весь архив в БД

Команда:

```bash
node server/scripts/import-project-assets-from-archive.mjs
```

Она проходит по всем проектам из БД и пытается импортировать подходящие папки из:

```text
scripts/site-image-archive/alexandradiz.com/_
```

в:

```text
public/uploads/projects/<project-slug>/images/original
```

и создаёт записи в:

```text
ProjectAsset
```

## 9. Что проверить, если assets мало

Проверить, есть ли папка архива:

```bash
dir scripts\site-image-archive\alexandradiz.com\_\bright-mood-pacifica\images
```

Проверить, есть ли файлы в рабочей папке проекта:

```bash
dir public\uploads\projects\bright-mood-pacifica\images\original
```

Проверить, совпадает ли slug проекта с папкой архива:

```text
project.slug должен быть близок к имени папки в scripts/site-image-archive/alexandradiz.com/_
```

Если slug не совпадает, импорт может не найти папку и assets будут пустыми или неполными.

Если в `manifest.json` много `HTTP 404` по URL без `1000-`/`2000-`, значит архив был создан старой версией парсера. Нужно заново прогнать:

```bash
npm run archive:site-images
node server/scripts/import-project-assets-from-archive.mjs
```

Для проверки одной страницы:

```bash
$env:SITE_ARCHIVE_PAGE_LIMIT="1"; node scripts/archive-live-site-images.mjs https://alexandradiz.com/bright-mood-pacifica scripts/site-image-archive-test
```

## 10. Важное различие

```text
archive-live-site-images.mjs
```

Скачивает картинки с live-сайта в архив.

```text
import-project-assets-from-archive.mjs
```

Переносит картинки из архива в проектные uploads и БД.

```text
Sync folder в админке
```

Синхронизирует только уже лежащие файлы из `public/uploads/projects/<slug>` с БД.

## 11. Проверка одинаковых фотографий

Для проверки дублей используется отдельный скрипт:

```bash
npm run audit:image-duplicates
```

Он проверяет не названия файлов, а содержимое:

```text
1. exact duplicates: точный sha256 файла
2. visually similar: perceptual hash после resize/grayscale через sharp
```

Отчёт сохраняется сюда:

```text
scripts/site-image-archive/alexandradiz.com/duplicate-report.json
```

Текущий прогон по архиву:

```text
Images scanned: 3309
Exact duplicate groups: 629
Exact duplicate files: 764
Visually similar groups: 1034
Visually similar files: 1196
```

Порог похожести можно менять:

```bash
node scripts/audit-image-duplicates.mjs scripts/site-image-archive/alexandradiz.com --threshold 6
```

Чем меньше `threshold`, тем строже сравнение. По умолчанию используется `8`.

Скрипт ничего не удаляет. Он только создаёт отчёт, чтобы сначала руками проверить группы дублей.

## 12. Как не пускать дубли в админку

Импорт из архива и кнопка `Sync folder` теперь фильтруют:

```text
1. точные копии по checksum
2. визуально похожие фото по perceptual hash
```

Порог задаётся переменной:

```env
ASSET_VISUAL_DUPLICATE_THRESHOLD=8
```

Меньше значение = строже фильтр.

Чтобы очистить импортированные assets и заново загрузить архив с фильтром дублей, сначала сделать dry-run:

```bash
npm run rebuild:project-assets
```

Dry-run ничего не удаляет. Он показывает, сколько записей и файлов будет затронуто.

Для реального применения:

```bash
npm run rebuild:project-assets -- --apply
```

Скрипт:

```text
1. делает backup SQLite БД
2. удаляет ProjectAssetUsage для выбранных assets
3. удаляет ProjectAsset с sourceType legacy-import и folder-sync
4. удаляет соответствующие файлы из public/uploads/projects/<slug>
5. заново импортирует архив из scripts/site-image-archive/alexandradiz.com/_
6. пропускает exact и visually similar дубли
```

По умолчанию не трогает ручные URL/import assets:

```text
remote-import
upload
```

Если нужно очистить ещё и remote-import:

```bash
node server/scripts/rebuild-project-assets-from-archive.mjs --source-types legacy-import,folder-sync,remote-import --apply
```

## 13. Strict project-folder matching

Import from the parsed archive now uses strict matching only:

```text
1. exact project.slug -> archive folder
2. exact project.title -> archive folder
```

The importer no longer uses substring/fuzzy matches. This prevents cases where `San Carlos`,
`Menlo Park`, `Mountain View`, `Palo Alto`, or other generic names pull photos from unrelated
project folders.

If the archive folder name does not match the project slug/title, assets will not be imported
until the project slug or archive folder is corrected.

To repair already mixed imported assets:

```bash
npm run rebuild:project-assets
```

This is a dry-run and changes nothing. Current dry-run should show how many `legacy-import` and
`folder-sync` assets will be rebuilt.

Real rebuild:

```bash
npm run rebuild:project-assets -- --apply
```

Only run `--apply` after confirming the dry-run. The script creates a SQLite backup first.
