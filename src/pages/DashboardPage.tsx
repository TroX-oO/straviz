import React, { useState } from "react";
import styled from "@emotion/styled";
import { useAuth } from "../hooks/useAuth";
import SyncTab from "./dashboard/SyncTab";
import ActivitiesTab from "./dashboard/ActivitiesTab";
import StatsTab from "./dashboard/StatsTab";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "sync" | "activities" | "stats";

interface NavItem {
  id: Tab;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "sync", icon: "↻", label: "Synchronisation" },
  { id: "activities", icon: "⊞", label: "Activités" },
  { id: "stats", icon: "▦", label: "Statistiques" },
];

// ─── Layout ───────────────────────────────────────────────────────────────────

const Layout = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: white;
`;

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const Sidebar = styled.nav`
  width: 240px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SidebarBrand = styled.div`
  padding: 28px 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
`;

const BrandName = styled.span`
  font-size: 1.4rem;
  font-weight: 800;
  background: linear-gradient(90deg, #fc4c02, #ff6b35);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const BrandTagline = styled.div`
  font-size: 0.72rem;
  color: #555;
  margin-top: 2px;
  letter-spacing: 0.04em;
`;

const SidebarNav = styled.ul`
  list-style: none;
  margin: 0;
  padding: 16px 12px;
  flex: 1;
`;

const NavItemEl = styled.li<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: ${({ $active }) => ($active ? "600" : "400")};
  color: ${({ $active }) => ($active ? "#ffffff" : "#888")};
  background: ${({ $active }) =>
    $active ? "rgba(252, 76, 2, 0.18)" : "transparent"};
  border: 1px solid
    ${({ $active }) => ($active ? "rgba(252, 76, 2, 0.3)" : "transparent")};
  transition: all 0.2s;
  margin-bottom: 4px;

  &:hover {
    background: ${({ $active }) =>
      $active ? "rgba(252, 76, 2, 0.22)" : "rgba(255, 255, 255, 0.05)"};
    color: ${({ $active }) => ($active ? "#ffffff" : "#ccc")};
  }
`;

const NavIcon = styled.span`
  font-size: 1.1rem;
  width: 22px;
  text-align: center;
  flex-shrink: 0;
`;

const SidebarFooter = styled.div`
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
`;

const AthleteRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AthleteAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fc4c02, #ff6b35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
`;

const AthleteName = styled.div`
  font-size: 0.85rem;
  font-weight: 500;
  color: #ccc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// ─── Main content ─────────────────────────────────────────────────────────────

const Main = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 40px 48px;

  @media (max-width: 900px) {
    padding: 24px 20px;
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("sync");
  const { athlete } = useAuth();

  const initials = athlete
    ? `${athlete.firstname[0] ?? ""}${athlete.lastname[0] ?? ""}`.toUpperCase()
    : "?";

  const fullname = athlete
    ? `${athlete.firstname} ${athlete.lastname}`
    : "Athlète";

  return (
    <Layout>
      {/* ── Sidebar ── */}
      <Sidebar>
        <SidebarBrand>
          <BrandName>Straviz</BrandName>
          <BrandTagline>Powered by Strava</BrandTagline>
        </SidebarBrand>

        <SidebarNav>
          {NAV_ITEMS.map((item) => (
            <NavItemEl
              key={item.id}
              $active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            >
              <NavIcon>{item.icon}</NavIcon>
              {item.label}
            </NavItemEl>
          ))}
        </SidebarNav>

        <SidebarFooter>
          <AthleteRow>
            <AthleteAvatar>{initials}</AthleteAvatar>
            <AthleteName>{fullname}</AthleteName>
          </AthleteRow>
        </SidebarFooter>
      </Sidebar>

      {/* ── Main content ── */}
      <Main>
        {activeTab === "sync" && <SyncTab />}
        {activeTab === "activities" && <ActivitiesTab />}
        {activeTab === "stats" && <StatsTab />}
      </Main>
    </Layout>
  );
};

export default DashboardPage;
