import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  tone?: "blue" | "green" | "red" | "purple";
}

export function StatCard({
  title,
  value,
  description,
  icon,
  tone = "blue",
}: StatCardProps) {
  return (
    <article className="stat-card">
      <div className={`stat-card__icon stat-card__icon--${tone}`}>
        {icon}
      </div>

      <div className="stat-card__content">
        <p className="stat-card__title">{title}</p>
        <strong className="stat-card__value">{value}</strong>
        <p className="stat-card__description">
          {description}
        </p>
      </div>
    </article>
  );
}