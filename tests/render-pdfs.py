"""Render browser-downloaded PDF specimens with a project-local QA dependency."""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.qa-python'))
import pymupdf as fitz

source = (ROOT / (sys.argv[1] if len(sys.argv) > 1 else 'qa/improvements-20260918')).resolve()
assert source.is_relative_to(ROOT), 'QA path must remain inside this project'
output = source / 'pdf-renders'
output.mkdir(parents=True, exist_ok=True)
report = []
for path in sorted(source.glob('demo-*.pdf')):
    document = fitz.open(path)
    pages = []
    for index, page in enumerate(document):
        text = page.get_text()
        assert 'SYNTHETIC DEMO' in text, (path.name, index, 'Missing disclaimer')
        assert 'NOT A LEGAL' in text, (path.name, index, 'Missing legal-record disclaimer')
        boxes = [block[:4] for block in page.get_text('blocks') if len(block) > 4 and str(block[4]).strip()]
        assert all(box[0] >= 0 and box[1] >= 0 and box[2] <= page.rect.width + 1 and box[3] <= page.rect.height + 1 for box in boxes), (path.name, index, 'Text outside page')
        image = output / f'{path.stem}-{index + 1}.png'
        page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False).save(image)
        pages.append({'page': index + 1, 'image': str(image.relative_to(ROOT)), 'text_blocks': len(boxes), 'synthetic_disclaimer': True})
    if path.name == 'demo-floor-plan.pdf':
        full_text = '\n'.join(page.get_text() for page in document)
        assert full_text.count('Bedroom 1') == 2, 'Expected one first bedroom per unit'
        assert full_text.count('Bedroom 2') == 2, 'Expected one second bedroom per unit'
        assert '116.22 m2' in full_text, 'Default plan must show shared net unit area'
    report.append({'file': path.name, 'pages': pages})
assert report, 'No downloaded PDF specimens found'
(source / 'pdf-results.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
