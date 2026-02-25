import { type JSX } from "react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/dashboard", icon: "fa-solid fa-house-chimney", label: "概览" },
  { to: "/workflow/step1", icon: "fa-solid fa-plus-circle", label: "创建" },
  { to: "/dashboard", icon: "fa-solid fa-layer-group", label: "项目" },
  { to: "/dashboard", icon: "fa-solid fa-user", label: "我的" },
];

export function MobileBottomNav(): JSX.Element {
  const location = useLocation();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-white/20 h-16 flex items-center justify-around z-50">
      {tabs.map((tab) => {
        const active = location.pathname === tab.to;
        return (
          <Link
            key={tab.label}
            to={tab.to}
            className={`flex flex-col items-center gap-1 no-underline ${
              active ? "text-primary" : "text-toy-secondary"
            }`}
          >
            <i className={`${tab.icon} text-xl`} />
            <span className="text-[10px] font-bold">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
