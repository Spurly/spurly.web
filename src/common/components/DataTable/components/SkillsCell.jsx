import { Badge } from 'src/common/components/Badge';

export function SkillsCell({ value = [] }) {
  const skills = Array.isArray(value) ? value : [];

  if (skills.length === 0) {
    return <span className="text-spurly-text-secondary">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {skills.slice(0, 3).map((skill, idx) => (
        <Badge key={idx} variant="info">
          {skill}
        </Badge>
      ))}
      {skills.length > 3 && (
        <span className="text-xs text-spurly-text-secondary">+{skills.length - 3}</span>
      )}
    </div>
  );
}
