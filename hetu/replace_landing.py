from pathlib import Path
p = Path('/home/ubuntu/404-ai/client/src/pages/Home.tsx')
s = p.read_text()
if 'ReferenceLanding' not in s:
    s = s.replace('import { useMemo, useState } from "react";', 'import { useMemo, useState } from "react";\nimport ReferenceLanding from "./ReferenceLanding";')
start = s.rfind('  return <div className="landing-shell">')
if start < 0:
    raise SystemExit('landing return not found')
s = s[:start] + '  return <ReferenceLanding onStart={analyze} />;\n}\n'
p.write_text(s)
