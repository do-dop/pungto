export function GlobalStyles() {
  return (
    <style jsx global>{`
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { height: 100%; }
      body {
        font-family: 'Pretendard Variable', Pretendard, 'Noto Sans KR', sans-serif;
        background: #f5f5f3;
      }
      .join-shell, .page-shell {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        padding: 16px;
        background:
          radial-gradient(circle at top, rgba(83, 74, 183, 0.1), transparent 30%),
          linear-gradient(180deg, #f7f3ee 0%, #f5f5f3 100%);
      }
      .shell-fab {
        position: absolute;
        right: 20px;
        bottom: 20px;
        width: 56px;
        height: 56px;
        border: 1px solid rgba(224, 221, 213, 0.95);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.88);
        color: #534AB7;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.06em;
        cursor: pointer;
        font-family: inherit;
        box-shadow: 0 16px 36px rgba(31, 29, 47, 0.14);
        backdrop-filter: blur(14px);
        z-index: 5;
        transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      }
      .shell-fab:hover {
        transform: translateY(-1px);
        box-shadow: 0 20px 40px rgba(31, 29, 47, 0.18);
        background: rgba(255, 255, 255, 0.96);
      }
      .join-card {
        width: 100%;
        max-width: 360px;
        padding: 28px 24px 24px;
        border: 1px solid rgba(224, 221, 213, 0.95);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: 0 24px 60px rgba(57, 50, 130, 0.08);
        text-align: center;
        backdrop-filter: blur(14px);
      }
      .join-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px 12px;
        border-radius: 999px;
        background: #f0effd;
        color: #534ab7;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
        margin-bottom: 18px;
      }
      .join-logo {
        width: 54px;
        height: 54px;
        margin: 0 auto 12px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: #fff;
        background: linear-gradient(135deg, #5c53c9 0%, #847ce3 100%);
        box-shadow: 0 14px 28px rgba(83, 74, 183, 0.22);
      }
      .join-title { font-size: 28px; line-height: 1.1; font-weight: 700; color: #1f1d2f; margin-bottom: 8px; }
      .join-room-title {
        max-width: 100%;
        margin: 0 auto 8px;
        padding: 8px 12px;
        border: 1px solid #e9e3d8;
        border-radius: 12px;
        background: #fbf8f3;
        color: #3f3a4a;
        font-size: 15px;
        font-weight: 700;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }
      .join-desc { font-size: 14px; line-height: 1.6; color: #7d7888; margin-bottom: 20px; }
      .join-input {
        width: 100%; border: 1px solid #e7dfd3; border-radius: 16px; padding: 14px 16px; font-size: 15px;
        text-align: center; outline: none; background: #fbf8f3; color: #1f1d2f; font-family: inherit; margin-bottom: 12px;
        transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      }
      .join-input:focus { border-color: #7f77dd; box-shadow: 0 0 0 4px rgba(127, 119, 221, 0.12); background: #fff; }
      .join-btn {
        width: 100%; background: linear-gradient(135deg, #5a52c4 0%, #7f77dd 100%); color: #fff; border: none; border-radius: 16px; padding: 14px 0;
        font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 16px 30px rgba(83, 74, 183, 0.22);
        transition: transform 0.18s ease, box-shadow 0.18s ease;
      }
      .join-btn:hover { transform: translateY(-1px); box-shadow: 0 18px 34px rgba(83, 74, 183, 0.28); }
      .join-error { margin: -2px 0 10px; color: #b91c1c; font-size: 12px; line-height: 1.5; }
      .join-hint { margin-top: 12px; font-size: 12px; color: #9a94a4; }
      .wrap {
        display: flex; width: 100%; max-width: 960px; height: 720px; border: 1px solid #e0ddd5; border-radius: 16px;
        overflow: hidden; background: #fff; box-shadow: 0 4px 32px rgba(0,0,0,0.08);
      }
      .sidebar {
        width: 52px; border-right: 1px solid #e0ddd5; display: flex; flex-direction: column; align-items: center;
        padding: 12px 0; gap: 4px; background: #faf9f7; flex-shrink: 0;
      }
      .logo { font-size: 20px; color: #534AB7; margin-bottom: 8px; font-weight: 700; line-height: 1; }
      .nav-btn {
        width: 36px; height: 36px; border-radius: 10px; border: none; background: transparent; cursor: pointer;
        display: flex; align-items: center; justify-content: center; position: relative; transition: background 0.15s;
      }
      .nav-btn:hover { background: #f0eff8; }
      .nav-btn.active { background: #EEEDFE; }
      .nav-btn svg {
        width: 18px; height: 18px; stroke: #888; fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round;
        transition: stroke 0.15s;
      }
      .nav-btn.active svg { stroke: #534AB7; }
      .badge {
        position: absolute; top: 5px; right: 5px; width: 7px; height: 7px; background: #E24B4A; border-radius: 50%; border: 1.5px solid #faf9f7;
      }
      .nav-sep { width: 24px; height: 1px; background: #e0ddd5; margin: 4px 0; }
      .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
      .topbar {
        display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid #e0ddd5; flex-shrink: 0; background: #fff;
      }
      .topbar-title {
        min-width: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .room-title {
        color: #1f1d2f;
        font-size: 14px;
        font-weight: 800;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .page-title { font-size: 11px; font-weight: 600; color: #9a94a4; }
      .url-pill {
        display: flex; align-items: center; gap: 5px; background: #f5f5f3; border: 1px solid #e0ddd5; border-radius: 20px;
        padding: 4px 10px; font-size: 11px; color: #888; cursor: pointer; transition: border-color 0.15s;
      }
      .url-pill:hover { border-color: #bbb; }
      .green-dot { width: 5px; height: 5px; background: #1D9E75; border-radius: 50%; flex-shrink: 0; }
      .btn-share {
        background: #534AB7; color: #fff; border: none; border-radius: 8px; padding: 5px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.15s;
      }
      .btn-share:hover { background: #7F77DD; }
      .share-panel {
        display: flex; align-items: center; gap: 16px; padding: 12px 16px; border-bottom: 1px solid #e0ddd5; background: #faf9f7; flex-shrink: 0;
      }
      .share-info { flex: 1; min-width: 0; }
      .share-label { font-size: 11px; color: #aaa; margin-bottom: 4px; }
      .share-url {
        font-size: 11px; font-family: monospace; color: #534AB7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .copy-btn {
        margin-top: 8px; background: #534AB7; color: #fff; border: none; border-radius: 6px; padding: 4px 12px; font-size: 11px; cursor: pointer; font-family: inherit;
      }
      .content { flex: 1; overflow: hidden; min-height: 0; }
      .page { height: 100%; overflow: hidden; }
      .page.active { display: flex; flex-direction: column; min-height: 0; }
      .dashboard-page { overflow-y: auto; background: linear-gradient(180deg, #fcfbf8 0%, #f6f3ee 100%); }
      .dashboard-grid {
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 16px;
        padding: 14px;
        align-content: start;
      }
      .dash-card {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #e5dfd5;
        border-radius: 20px;
        padding: 16px;
        box-shadow: 0 16px 40px rgba(57, 50, 130, 0.05);
      }
      .dash-hero { grid-column: span 2; }
      .dash-card-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
      .dash-eyebrow {
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #978fa1;
        margin-bottom: 6px;
      }
      .dash-title {
        font-size: 20px;
        line-height: 1.2;
        color: #1f1d2f;
        font-weight: 700;
      }
      .dash-notice {
        margin-top: 8px;
        font-size: 12px;
        color: #8b8594;
      }
      .dash-room-chip {
        padding: 8px 12px;
        border-radius: 999px;
        background: #f2f0fd;
        color: #534ab7;
        font-size: 12px;
        font-weight: 700;
      }
      .dash-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
      .dash-field span {
        font-size: 12px;
        font-weight: 600;
        color: #746d7a;
      }
      .dash-project-name {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.02em;
        min-height: 56px;
      }
      .dash-input, .dash-textarea {
        width: 100%;
        border: 1px solid #e4ddd2;
        border-radius: 14px;
        background: #fff;
        color: #1f1d2f;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .dash-input {
        min-height: 44px;
        padding: 11px 13px;
      }
      .dash-input.compact {
        min-height: 40px;
        padding: 9px 12px;
      }
      .dash-textarea {
        min-height: 96px;
        resize: vertical;
        padding: 12px 13px;
        line-height: 1.65;
      }
      .dash-textarea.compact { min-height: 76px; }
      .dash-input:focus, .dash-textarea:focus {
        border-color: #7f77dd;
        box-shadow: 0 0 0 4px rgba(127, 119, 221, 0.12);
      }
      .dash-link-form {
        display: grid;
        grid-template-columns: 120px 1fr 1.3fr auto;
        gap: 10px;
        margin-bottom: 12px;
      }
      .dash-primary-btn, .dash-ghost-btn {
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
      }
      .dash-primary-btn {
        border: none;
        background: linear-gradient(135deg, #5a52c4 0%, #7f77dd 100%);
        color: #fff;
      }
      .dash-ghost-btn {
        border: 1px solid #ddd6cb;
        background: #fff;
        color: #6f6875;
      }
      .dash-link-list, .team-role-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .team-role-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 72px;
        gap: 8px;
        padding: 0 10px;
        font-size: 11px;
        font-weight: 700;
        color: #9991a5;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .dash-link-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border: 1px solid #ebe4d9;
        border-radius: 16px;
        background: #fcfbf8;
      }
      .dash-link-icon {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .dash-link-icon.kind-github { background: #ece9ff; color: #40379a; }
      .dash-link-icon.kind-figma { background: #ffe7e1; color: #b54624; }
      .dash-link-icon.kind-notion { background: #ecebe7; color: #4c4640; }
      .dash-link-icon.kind-docs { background: #e4f6ef; color: #0d6a54; }
      .dash-link-icon.kind-etc { background: #f7eddc; color: #8a5807; }
      .dash-link-copy { flex: 1; min-width: 0; }
      .dash-link-label { font-size: 14px; font-weight: 600; color: #1f1d2f; margin-bottom: 4px; }
      .dash-link-url {
        display: block;
        font-size: 12px;
        color: #7c75b8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-decoration: none;
      }
      .team-role-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        border: 1px solid #ebe4d9;
        border-radius: 16px;
        background: #fcfbf8;
        padding: 10px;
      }
      .team-name { font-weight: 700; }
      .compact-btn {
        min-height: 40px;
        padding: 9px 12px;
        white-space: nowrap;
      }
      .chat-page, .todo-page { min-height: 0; }
      .chat-messages {
        flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; min-height: 0;
      }
      .sticky-input { flex-shrink: 0; position: sticky; bottom: 0; z-index: 2; }
      .empty-chat { text-align: center; color: #ccc; font-size: 13px; margin-top: 32px; }
      .msg { display: flex; gap: 10px; align-items: flex-end; }
      .msg.me { flex-direction: row-reverse; }
      .av {
        width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; flex-shrink: 0;
      }
      .av-p { background: #CECBF6; color: #3C3489; }
      .av-t { background: #9FE1CB; color: #085041; }
      .av-c { background: #F5C4B3; color: #712B13; }
      .bubble-wrap { display: flex; flex-direction: column; gap: 3px; max-width: 68%; }
      .msg.me .bubble-wrap { align-items: flex-end; }
      .sender-name { font-size: 11px; color: #bbb; }
      .bubble {
        background: #f5f5f3; border-radius: 12px 12px 12px 3px; padding: 8px 12px; font-size: 13px; line-height: 1.6; color: #1a1a1a; word-break: break-all;
      }
      .msg.me .bubble { background: #EEEDFE; color: #26215C; border-radius: 12px 12px 3px 12px; }
      .msg-meta { font-size: 11px; color: #bbb; }
      .chat-input-row {
        display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-top: 1px solid #e0ddd5; background: #fff;
      }
      .chat-input, .search-input, .todo-add-input {
        outline: none; font-family: inherit;
      }
      .chat-input {
        flex: 1; border: 1px solid #e0ddd5; border-radius: 20px; padding: 8px 14px; font-size: 13px; background: #faf9f7; color: #1a1a1a; transition: border-color 0.15s;
      }
      .chat-input:focus, .search-input:focus, .todo-add-input:focus { border-color: #7F77DD; background: #fff; }
      .send-btn {
        width: 34px; height: 34px; background: #534AB7; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s;
      }
      .send-btn:hover { background: #7F77DD; }
      .send-btn svg { width: 14px; height: 14px; fill: #fff; stroke: #fff; stroke-width: 1.5; }
      .kanban { display: flex; gap: 12px; overflow-x: auto; height: 100%; align-items: flex-start; padding: 16px; }
      .k-col {
        flex: 0 0 195px; background: #faf9f7; border-radius: 12px; border: 1px solid #e0ddd5; padding: 12px; display: flex; flex-direction: column; gap: 8px;
      }
      .k-col-title { font-size: 12px; font-weight: 600; color: #888; display: flex; align-items: center; justify-content: space-between; }
      .k-count { background: #fff; border: 1px solid #e0ddd5; border-radius: 10px; padding: 1px 7px; font-size: 11px; color: #aaa; }
      .k-card {
        background: #fff; border: 1px solid #e0ddd5; border-radius: 10px; padding: 10px 12px; cursor: grab; width: 100%;
        text-align: left; font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s, opacity 0.15s;
      }
      .k-card:hover { border-color: #bbb; transform: translateY(-1px); }
      .k-card.selected { border-color: #7f77dd; box-shadow: 0 0 0 3px rgba(127, 119, 221, 0.12); }
      .k-card.faded { opacity: 0.55; }
      .k-card.dragging { opacity: 0.3; cursor: grabbing; transform: scale(0.97); }
      .k-col.drag-over { background: #eeedfd; border-color: #a49fe8; border-style: dashed; }
      .k-card-title { font-size: 13px; color: #1a1a1a; margin-bottom: 7px; line-height: 1.4; }
      .k-card-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
      .k-tag { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 11px; font-weight: 500; }
      .tag-p { background: #EEEDFE; color: #3C3489; }
      .tag-t { background: #E1F5EE; color: #085041; }
      .tag-a { background: #FAEEDA; color: #633806; }
      .k-owner { font-size: 11px; color: #a09ba8; white-space: nowrap; }
      .k-due { font-size: 11px; color: #aaa; margin-top: 6px; }
      .k-due.overdue { color: #A32D2D; font-weight: 500; }
      .k-add {
        width: 100%; background: transparent; border: 1px dashed #e0ddd5; border-radius: 10px; padding: 7px; font-size: 12px; color: #bbb; cursor: pointer; font-family: inherit;
      }
      .k-add:hover { background: #fff; color: #888; border-color: #bbb; }
      .task-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
        background: rgba(31, 29, 47, 0.36);
        backdrop-filter: blur(6px);
      }
      .task-modal {
        width: min(100%, 640px);
        max-height: min(82vh, 760px);
        border: 1px solid #e0ddd5;
        border-radius: 24px;
        background: linear-gradient(180deg, #fff 0%, #fcfbf8 100%);
        padding: 20px;
        overflow-y: auto;
        box-shadow: 0 28px 80px rgba(31, 29, 47, 0.2);
      }
      .task-panel-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding-bottom: 16px;
        margin-bottom: 16px;
        border-bottom: 1px solid #ece7dd;
      }
      .task-panel-eyebrow {
        font-size: 11px;
        color: #9a94a4;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .task-panel-title {
        font-size: 20px;
        line-height: 1.3;
        color: #1f1d2f;
        font-weight: 700;
      }
      .task-panel-notice {
        margin-top: 8px;
        font-size: 12px;
        color: #8b8594;
      }
      .task-modal-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .task-close {
        border: 1px solid #dfd9cf;
        background: #fff;
        color: #5e5768;
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
      }
      .task-close:hover {
        border-color: #bfb7c8;
        color: #1f1d2f;
      }
      .task-delete {
        border: 1px solid #f0d2d1;
        background: #fff4f3;
        color: #b43d3a;
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
      }
      .task-delete:hover {
        border-color: #e4a5a1;
        background: #feeceb;
      }
      .task-status-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 7px 11px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }
      .task-status-chip.status-todo { background: #f1efec; color: #6f6875; }
      .task-status-chip.status-doing { background: #eeedfe; color: #3c3489; }
      .task-status-chip.status-review { background: #faeeda; color: #7c4a0b; }
      .task-status-chip.status-done { background: #e1f5ee; color: #085041; }
      .task-form { display: flex; flex-direction: column; gap: 14px; }
      .task-field { display: flex; flex-direction: column; gap: 7px; }
      .task-field span {
        font-size: 12px;
        font-weight: 600;
        color: #746d7a;
      }
      .task-field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .task-input, .task-textarea {
        width: 100%;
        border: 1px solid #e4ddd2;
        border-radius: 12px;
        background: #fff;
        color: #1f1d2f;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .task-input {
        min-height: 44px;
        padding: 11px 13px;
      }
      .task-textarea {
        min-height: 140px;
        resize: vertical;
        padding: 13px;
        line-height: 1.6;
      }
      .task-input:focus, .task-textarea:focus {
        border-color: #7f77dd;
        box-shadow: 0 0 0 4px rgba(127, 119, 221, 0.12);
      }
      .task-input:disabled {
        background: #f3f0ea;
        color: #9c97a3;
      }
      .task-input[type="date"]::-webkit-calendar-picker-indicator {
        cursor: pointer;
        opacity: 0.75;
      }
      .task-toggle {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        color: #5f5868;
      }
      .task-toggle input {
        width: 16px;
        height: 16px;
        accent-color: #534ab7;
      }
      .sched-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px 10px; border-bottom: 1px solid #e0ddd5; flex-shrink: 0; }
      .sched-month { font-size: 14px; font-weight: 600; color: #1a1a1a; flex: 1; }
      .nav-arrow {
        background: transparent; border: 1px solid #e0ddd5; border-radius: 8px; padding: 3px 9px; font-size: 13px; cursor: pointer; color: #888; font-family: inherit;
      }
      .nav-arrow:hover { border-color: #bbb; color: #444; }
      .cal-grid { display: grid; grid-template-columns: repeat(7,1fr); padding: 0 16px 8px; flex-shrink: 0; }
      .cal-day-label { font-size: 11px; color: #bbb; text-align: center; padding: 4px 0; }
      .cal-cell { min-height: 52px; border: 0.5px solid #f0efe8; padding: 4px; font-size: 11px; color: #888; background: #fff; cursor: pointer; }
      .cal-cell:hover { background: #faf9f7; }
      .cal-cell.today { background: #EEEDFE; }
      .day-num { font-size: 11px; margin-bottom: 2px; color: #888; }
      .muted-day { color: #ddd; }
      .cal-cell.today .day-num { color: #534AB7; font-weight: 600; }
      .cal-event {
        background: #CECBF6; color: #3C3489; border-radius: 3px; padding: 1px 4px; font-size: 10px; margin-bottom: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .cal-event.teal { background: #9FE1CB; color: #085041; }
      .cal-event.coral { background: #F5C4B3; color: #712B13; }
      .sched-list { flex: 1; overflow-y: auto; padding: 10px 16px; }
      .sched-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f0efe8; }
      .sched-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      .sched-dot.purple { background: #534AB7; }
      .sched-dot.coral { background: #D85A30; }
      .sched-dot.teal { background: #1D9E75; }
      .sched-info { flex: 1; }
      .sched-title { font-size: 13px; color: #1a1a1a; font-weight: 500; }
      .sched-meta { font-size: 11px; color: #aaa; margin-top: 2px; }
      .docs-toolbar { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-bottom: 1px solid #e0ddd5; flex-shrink: 0; }
      .search-input {
        flex: 1; border: 1px solid #e0ddd5; border-radius: 8px; padding: 6px 10px; font-size: 13px; background: #faf9f7; color: #1a1a1a;
      }
      .btn-upload {
        background: transparent; border: 1px solid #e0ddd5; border-radius: 8px; padding: 5px 12px; font-size: 12px; cursor: pointer; color: #888; font-family: inherit; font-weight: 500; white-space: nowrap;
      }
      .btn-upload:hover { border-color: #bbb; color: #444; }
      .docs-grid {
        display: grid; grid-template-columns: repeat(auto-fill,minmax(150px,1fr)); gap: 10px; padding: 14px 16px; overflow-y: auto; flex: 1; align-content: start;
      }
      .doc-card { background: #fff; border: 1px solid #e0ddd5; border-radius: 12px; padding: 14px; cursor: pointer; }
      .doc-card:hover { border-color: #bbb; }
      .doc-icon {
        width: 36px; height: 44px; border-radius: 6px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; letter-spacing: 0.02em;
      }
      .di-doc { background: #EEEDFE; color: #534AB7; }
      .di-pdf { background: #FCEBEB; color: #A32D2D; }
      .di-img { background: #FAEEDA; color: #854F0B; }
      .di-xls { background: #EAF3DE; color: #3B6D11; }
      .doc-name { font-size: 13px; color: #1a1a1a; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
      .doc-meta { font-size: 11px; color: #aaa; }
      .notif-section-label, .todo-section-label {
        padding: 8px 16px 4px; font-size: 11px; font-weight: 600; color: #bbb; letter-spacing: 0.04em; flex-shrink: 0;
      }
      .notif-section-label.nested, .todo-section-label.nested-todo { padding-top: 10px; padding-left: 16px; }
      .notif-list { flex: 1; overflow-y: auto; }
      .notif-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #f0efe8; cursor: pointer; }
      .notif-item:hover { background: #faf9f7; }
      .notif-icon { width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0; }
      .ni-p { background: #EEEDFE; }
      .ni-t { background: #E1F5EE; }
      .ni-a { background: #FAEEDA; }
      .ni-r { background: #FCEBEB; }
      .notif-body { flex: 1; }
      .notif-title { font-size: 13px; color: #1a1a1a; line-height: 1.5; }
      .notif-title b { font-weight: 600; }
      .notif-time { font-size: 11px; color: #bbb; margin-top: 2px; }
      .unread-dot { width: 6px; height: 6px; background: #534AB7; border-radius: 50%; margin-top: 7px; flex-shrink: 0; }
      .todo-list { flex: 1; overflow-y: auto; padding: 0 16px; min-height: 0; }
      .todo-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f0efe8; }
      .todo-check {
        width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid #ddd; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #fff;
      }
      .todo-check:hover { border-color: #7F77DD; }
      .todo-check.done { background: #534AB7; border-color: #534AB7; position: relative; }
      .todo-check.done::after {
        content: ''; display: block; width: 9px; height: 5px; border-left: 2px solid #fff; border-bottom: 2px solid #fff; transform: rotate(-45deg) translateY(-1px);
      }
      .todo-text { flex: 1; font-size: 13px; color: #1a1a1a; }
      .todo-text.done { color: #bbb; text-decoration: line-through; }
      .todo-due { font-size: 11px; color: #aaa; white-space: nowrap; }
      .todo-due.urgent { color: #A32D2D; font-weight: 600; }
      .todo-add-row {
        display: flex; gap: 8px; padding: 10px 16px; border-top: 1px solid #e0ddd5; flex-shrink: 0; background: #fff;
      }
      .todo-add-input {
        flex: 1; border: 1px solid #e0ddd5; border-radius: 8px; padding: 7px 10px; font-size: 13px; background: #faf9f7; color: #1a1a1a;
      }
      .btn-add {
        background: #534AB7; color: #fff; border: none; border-radius: 8px; padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap;
      }
      .btn-add:hover { background: #7F77DD; }
      @media (max-width: 820px) {
        .page-shell, .join-shell { padding: 0; }
        .wrap { height: 100vh; max-width: none; border-radius: 0; border-left: 0; border-right: 0; }
        .url-pill { display: none; }
        .join-shell { padding: 20px 16px; }
        .shell-fab { right: 16px; bottom: 16px; width: 52px; height: 52px; }
        .dashboard-grid { grid-template-columns: 1fr; }
        .dash-hero { grid-column: span 1; }
        .dash-link-form { grid-template-columns: 1fr; }
        .dash-card-head { flex-direction: column; align-items: flex-start; }
        .team-role-head { display: none; }
        .team-role-card { grid-template-columns: 1fr; }
        .task-modal-backdrop { padding: 12px; }
        .task-modal { width: 100%; max-height: 100vh; min-height: 0; border-radius: 20px; padding: 18px 16px; }
        .task-panel-top, .task-modal-actions { flex-direction: column; align-items: flex-start; }
        .task-field-grid { grid-template-columns: 1fr; }
      }
    `}</style>
  )
}
