import type { DocumentItem } from '../../room/types'

type DocumentsViewProps = {
  documents: DocumentItem[]
}

export function DocumentsView({ documents }: DocumentsViewProps) {
  return (
    <div className="page active">
      <div className="docs-toolbar">
        <input className="search-input" placeholder="파일 검색..." />
        <button className="btn-upload">+ 업로드</button>
      </div>
      <div className="docs-grid">
        {documents.map((doc) => (
          <div className="doc-card" key={doc.name}>
            <div className={`doc-icon ${doc.className}`}>{doc.ext}</div>
            <div className="doc-name">{doc.name}</div>
            <div className="doc-meta">{doc.meta}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
