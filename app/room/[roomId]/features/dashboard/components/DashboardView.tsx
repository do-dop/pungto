"use client";

import type { DashboardLink, TeamRole } from "../types";

type DashboardViewProps = {
  roomId: string;
  dashboardNotice: string;
  projectName: string;
  projectSummary: string;
  projectGoal: string;
  dashboardLinks: DashboardLink[];
  linkKindInput: DashboardLink["kind"];
  linkLabelInput: string;
  linkUrlInput: string;
  teamRoles: TeamRole[];
  onProjectNameChange: (value: string) => void;
  onProjectSummaryChange: (value: string) => void;
  onProjectGoalChange: (value: string) => void;
  onLinkKindChange: (value: DashboardLink["kind"]) => void;
  onLinkLabelChange: (value: string) => void;
  onLinkUrlChange: (value: string) => void;
  onAddDashboardLink: () => void;
  onRemoveDashboardLink: (id: number) => void;
  onAddTeamRole: () => void;
  onUpdateTeamRole: (id: number, patch: Partial<TeamRole>) => void;
  onRemoveTeamRole: (id: number) => void;
};

export function DashboardView({
  roomId,
  dashboardNotice,
  projectName,
  projectSummary,
  projectGoal,
  dashboardLinks,
  linkKindInput,
  linkLabelInput,
  linkUrlInput,
  teamRoles,
  onProjectNameChange,
  onProjectSummaryChange,
  onProjectGoalChange,
  onLinkKindChange,
  onLinkLabelChange,
  onLinkUrlChange,
  onAddDashboardLink,
  onRemoveDashboardLink,
  onAddTeamRole,
  onUpdateTeamRole,
  onRemoveTeamRole,
}: DashboardViewProps) {
  return (
    <div className="page active dashboard-page">
      <div className="dashboard-grid">
        <section className="dash-card dash-hero">
          <div className="dash-card-head">
            <div>
              <p className="dash-eyebrow">Project Overview</p>
              {dashboardNotice ? <p className="dash-notice">{dashboardNotice}</p> : null}
            </div>
            <div className="dash-room-chip">Room {roomId}</div>
          </div>
          <label className="dash-field">
            <span>프로젝트명</span>
            <input
              className="dash-input dash-project-name"
              value={projectName}
              onChange={(event) => onProjectNameChange(event.target.value)}
            />
          </label>
          <label className="dash-field">
            <span>프로젝트 설명</span>
            <textarea
              className="dash-textarea"
              value={projectSummary}
              onChange={(event) => onProjectSummaryChange(event.target.value)}
            />
          </label>
          <label className="dash-field">
            <span>현재 목표</span>
            <textarea
              className="dash-textarea compact"
              value={projectGoal}
              onChange={(event) => onProjectGoalChange(event.target.value)}
            />
          </label>
        </section>

        <section className="dash-card">
          <div className="dash-card-head">
            <div>
              <p className="dash-eyebrow">Quick Links</p>
              <h3 className="dash-title">참고 링크</h3>
            </div>
          </div>
          <div className="dash-link-form">
            <select
              className="dash-input"
              value={linkKindInput}
              onChange={(event) => onLinkKindChange(event.target.value as DashboardLink["kind"])}
            >
              <option value="github">GitHub</option>
              <option value="figma">Figma</option>
              <option value="notion">Notion</option>
              <option value="docs">Docs</option>
              <option value="etc">기타</option>
            </select>
            <input
              className="dash-input"
              placeholder="링크 이름"
              value={linkLabelInput}
              onChange={(event) => onLinkLabelChange(event.target.value)}
            />
            <input
              className="dash-input link-url"
              placeholder="https://..."
              value={linkUrlInput}
              onChange={(event) => onLinkUrlChange(event.target.value)}
            />
            <button className="dash-primary-btn" type="button" onClick={onAddDashboardLink}>링크 추가</button>
          </div>
          <div className="dash-link-list">
            {dashboardLinks.map((link) => (
              <div className="dash-link-item" key={link.id}>
                <div className={`dash-link-icon kind-${link.kind}`}>{link.kind.slice(0, 1).toUpperCase()}</div>
                <div className="dash-link-copy">
                  <div className="dash-link-label">{link.label}</div>
                  <a className="dash-link-url" href={link.url} target="_blank" rel="noreferrer">{link.url}</a>
                </div>
                <button className="dash-ghost-btn" type="button" onClick={() => onRemoveDashboardLink(link.id)}>삭제</button>
              </div>
            ))}
          </div>
        </section>

        <section className="dash-card">
          <div className="dash-card-head">
            <div>
              <p className="dash-eyebrow">Team Roles</p>
              <h3 className="dash-title">팀원 역할</h3>
            </div>
            <button className="dash-primary-btn" type="button" onClick={onAddTeamRole}>팀원 추가</button>
          </div>
          <div className="team-role-list">
            <div className="team-role-head">
              <span>이름</span>
              <span>역할</span>
              <span>관리</span>
            </div>
            {teamRoles.map((member) => (
              <div className="team-role-card" key={member.id}>
                <input
                  className="dash-input team-name compact"
                  value={member.name}
                  onChange={(event) => onUpdateTeamRole(member.id, { name: event.target.value })}
                />
                <input
                  className="dash-input compact"
                  value={member.role}
                  onChange={(event) => onUpdateTeamRole(member.id, { role: event.target.value })}
                />
                <button className="dash-ghost-btn compact-btn" type="button" onClick={() => onRemoveTeamRole(member.id)}>삭제</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
