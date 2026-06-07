import { QRCodeSVG } from 'qrcode.react'

type SharePanelProps = {
  url: string
  copied: boolean
  onCopy: () => void
}

export function SharePanel({ url, copied, onCopy }: SharePanelProps) {
  return (
    <div className="share-panel">
      <QRCodeSVG value={url} size={72} />
      <div className="share-info">
        <p className="share-label">QR 또는 링크로 초대하세요</p>
        <p className="share-url">{url}</p>
        <button className="copy-btn" onClick={onCopy}>{copied ? '복사됨!' : '링크 복사'}</button>
      </div>
    </div>
  )
}
